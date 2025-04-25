// app.js

// 1. Configuración de Firebase (Usa la que diste, ligada al proyecto 'mascotas-qr-v2')
const firebaseConfig = {
  apiKey: "AIzaSyCatSfVDRfqkBBbrUH-lS9kxPexbMVV6mw",
  authDomain: "mascotas-qr-v2.firebaseapp.com", // Correcto, asociado al proyecto Firebase
  projectId: "mascotas-qr-v2",               // Correcto, asociado al proyecto Firebase
  storageBucket: "mascotas-qr-v2.firebasestorage.app",
  messagingSenderId: "139139331167",
  appId: "1:139139331167:web:7634d72ef1500f2fe757ea"
};

// --- >>> CONFIGURACIÓN DE CLOUDINARY (CON TUS DATOS) <<< ---
const CLOUDINARY_CLOUD_NAME = "djwc9b2g4";
const CLOUDINARY_UPLOAD_PRESET = "mascotas-qr-v2"; // Tu upload preset
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

// 2. Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// 3. Referencias al DOM
const loadingView = document.getElementById('loading-view');
const registerView = document.getElementById('register-view');
const publicProfileView = document.getElementById('public-profile-view');
const editView = document.getElementById('edit-view');
const loginView = document.getElementById('login-view');
const errorView = document.getElementById('error-view');
const errorMessage = document.getElementById('error-message');
const registerForm = document.getElementById('register-form');
const loginForm = document.getElementById('login-form');
const editForm = document.getElementById('edit-form');
const registerError = document.getElementById('register-error');
const loginError = document.getElementById('login-error');
const editError = document.getElementById('edit-error');
const editSuccess = document.getElementById('edit-success');
const petPhotoInput = document.getElementById('pet-photo');
const photoPreview = document.getElementById('photo-preview');
const editPetPhotoInput = document.getElementById('edit-pet-photo');
const currentPetPhoto = document.getElementById('current-pet-photo');
const publicPetPhoto = document.getElementById('public-pet-photo');
const publicPetName = document.getElementById('public-pet-name');
const publicOwnerName = document.getElementById('public-owner-name');
const publicObservationsSection = document.getElementById('public-observations-section');
const publicPetObservations = document.getElementById('public-pet-observations');
const whatsappButton = document.getElementById('whatsapp-button');
const mapsButton = document.getElementById('maps-button');
const goToLoginBtn = document.getElementById('go-to-login-btn');
const backToProfileBtn = document.getElementById('back-to-profile-btn');
const logoutBtn = document.getElementById('logout-btn');

// Variables Globales
let currentPetId = null;
let currentUser = null;
let currentPetData = null;
const repoName = "petid"; // <<<--- !! NOMBRE CORTO DEL REPO !!
const placeholderImage = `/${repoName}/generic-pet.png`; // <<<--- !! RUTA COMPLETA CON REPO CORTO !!
const baseUrl = `https://huguitito.github.io/${repoName}/`; // URL base correcta
const petSegment = 'p/'; // Segmento corto

// ===========================================
// FUNCIONES PRINCIPALES (showView, showError, listenToAuthState, handlePetId, etc.)
// ===========================================

function showView(viewId) { /* ... (sin cambios) ... */
    document.querySelectorAll('.view').forEach(view => { view.classList.remove('active-view'); });
    const activeView = document.getElementById(viewId);
    if (activeView) { activeView.classList.add('active-view'); }
    else { console.error("Vista no encontrada:", viewId); if (typeof showError === 'function' && errorMessage) { showError(`Error: Vista '${viewId}' no encontrada.`); } else { alert(`Error: Vista '${viewId}' no encontrada.`); } }
}
function showError(message = "Ocurrió un error.") { /* ... (sin cambios) ... */
    if (errorMessage) { errorMessage.textContent = message; if (typeof showView === 'function') { showView('error-view'); } else { alert("Error: " + message); } }
    else { alert("Error: " + message); }
}
function listenToAuthState() { /* ... (sin cambios, usa currentPetId para decidir) ... */
    auth.onAuthStateChanged(user => {
        currentUser = user;
        if (currentPetId) { handlePetId(currentPetId, user); }
        else {
             if (!user) { if (!errorView.classList.contains('active-view')) { showView('login-view'); } }
             else { if (!editView.classList.contains('active-view') && !errorView.classList.contains('active-view')) { showError("¡Hola! 👋 Escanea el QR para ver o editar."); } }
        }
    });
}
async function handlePetId(petId, user) { /* ... (sin cambios) ... */
    if (!loadingView.classList.contains('active-view')) { showView('loading-view'); }
    try {
        const docRef = db.collection('pets').doc(petId); const docSnap = await docRef.get();
        if (docSnap.exists) {
            currentPetData = docSnap.data(); currentPetData.id = docSnap.id;
            if (user && user.uid === currentPetData.ownerUserId) { populateEditForm(currentPetData); showView('edit-view'); }
            else { populatePublicProfile(currentPetData); showView('public-profile-view'); if (backToProfileBtn) backToProfileBtn.style.display = 'none'; }
        } else {
            console.log("No existe doc para ID:", petId); if (registerForm) registerForm.reset(); if (photoPreview) photoPreview.innerHTML = ''; if (registerError) registerError.textContent = ''; showView('register-view'); if (backToProfileBtn) backToProfileBtn.style.display = 'none';
        }
    } catch (error) { console.error("Error obteniendo datos:", error); showError(`Error al cargar datos 😥: ${error.message}`); }
}
function populatePublicProfile(data) { /* ... (sin cambios, usa placeholderImage) ... */
    if (publicPetPhoto) { publicPetPhoto.src = data.petPhotoUrl || placeholderImage; publicPetPhoto.onerror = () => { if(publicPetPhoto) publicPetPhoto.src = placeholderImage; }; }
    if (publicPetName) publicPetName.textContent = data.petName || 'N/A'; if (publicOwnerName) publicOwnerName.textContent = data.ownerName || 'N/A';
    if (publicObservationsSection && publicPetObservations) { if (data.petObservations?.trim()) { publicPetObservations.innerHTML = data.petObservations.replace(/\n/g, '<br>'); publicObservationsSection.style.display = 'block'; } else { publicObservationsSection.style.display = 'none'; } }
    if (whatsappButton) { if (data.ownerPhone) { const cleanPhone = data.ownerPhone.replace(/[\s+\-()]/g, ''); const msg = encodeURIComponent(`¡Hola ${data.ownerName}! Encontré a ${data.petName || 'tu mascota'}.`); whatsappButton.href = `https://wa.me/${cleanPhone}?text=${msg}`; whatsappButton.style.display = 'block'; } else { whatsappButton.style.display = 'none'; } }
    if (mapsButton) { if (data.ownerAddress && data.showAddressPublicly === true) { mapsButton.href = `https://www.google.com/maps?q=${encodeURIComponent(data.ownerAddress)}`; mapsButton.style.display = 'block'; } else { mapsButton.style.display = 'none'; } }
}
function populateEditForm(data) { /* ... (sin cambios, usa placeholderImage) ... */
    if (!editForm) return; if (currentPetPhoto) { currentPetPhoto.src = data.petPhotoUrl || placeholderImage; currentPetPhoto.onerror = () => { if(currentPetPhoto) currentPetPhoto.src = placeholderImage; }; } if(editPetPhotoInput) editPetPhotoInput.value = null;
    const ownerNameInput = document.getElementById('edit-owner-name'); const ownerPhoneInput = document.getElementById('edit-owner-phone'); const ownerAddressInput = document.getElementById('edit-owner-address'); const showAddressCheckbox = document.getElementById('edit-show-address'); const petNameInput = document.getElementById('edit-pet-name'); const petObservationsTextarea = document.getElementById('edit-pet-observations');
    if (ownerNameInput) ownerNameInput.value = data.ownerName || ''; if (ownerPhoneInput) ownerPhoneInput.value = data.ownerPhone || ''; if (ownerAddressInput) ownerAddressInput.value = data.ownerAddress || ''; if (showAddressCheckbox) showAddressCheckbox.checked = data.showAddressPublicly === true; if (petNameInput) petNameInput.value = data.petName || ''; if (petObservationsTextarea) petObservationsTextarea.value = data.petObservations || '';
    if (editError) editError.textContent = ''; if (editSuccess) editSuccess.textContent = '';
}
async function uploadImageToCloudinary(file) { /* ... (sin cambios, usa constantes CLOUDINARY_) ... */
    const maxSizeMB = 5; if (file.size > maxSizeMB * 1024 * 1024) throw new Error(`Imagen muy grande (máx ${maxSizeMB} MB)`); const allowedTypes = ['image/jpeg', 'image/png', 'image/gif']; if (!allowedTypes.includes(file.type)) throw new Error('Formato no válido (JPG, PNG, GIF)');
    const formData = new FormData(); formData.append('file', file); formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    console.log(`Subiendo ${file.name}...`);
    try {
        const response = await fetch(CLOUDINARY_URL, { method: 'POST', body: formData }); const data = await response.json();
        if (!response.ok) { const errorMsg = data?.error?.message || `Error HTTP ${response.status}`; console.error('Error Cloudinary:', data); throw new Error(`Cloudinary: ${errorMsg}`); }
        if (!data.secure_url) throw new Error('Cloudinary no devolvió URL segura.'); return data.secure_url;
    } catch (error) { console.error("Error en fetch Cloudinary:", error); throw new Error(error.message || 'Error de red al subir.'); }
}
function mapFirebaseError(error) { /* ... (sin cambios) ... */
    console.log("Firebase Error:", error.code, error.message); switch (error.code) { case 'auth/invalid-email': return 'Email inválido.'; case 'auth/user-not-found': return 'Email no encontrado.'; case 'auth/wrong-password': return 'Contraseña incorrecta.'; case 'auth/email-already-in-use': return 'Email ya registrado.'; case 'auth/weak-password': return 'Contraseña corta (mín 6 car.).'; case 'auth/too-many-requests': return 'Demasiados intentos ⏳.'; case 'permission-denied': return 'Permiso denegado.'; case 'unavailable': return 'Servicio no disponible.'; default: return error.message || 'Error desconocido.'; }
}

// ===========================================
// LÓGICA DE EVENTOS
// ===========================================

document.addEventListener('DOMContentLoaded', () => {
    showView('loading-view');

    const urlParams = new URLSearchParams(window.location.search);
    const redirectPath = urlParams.get('redirect');
    let effectivePath = "";

    if (redirectPath) {
        effectivePath = "/" + redirectPath.replace(/^\//, '');
        console.log("Redirección. Ruta efectiva:", effectivePath);
        const cleanUrl = `/${repoName}/`; // URL base del repo
        window.history.replaceState({}, document.title, cleanUrl);
    } else {
        effectivePath = window.location.pathname;
        console.log("Acceso directo. Ruta efectiva:", effectivePath);
    }

    const pathParts = effectivePath.split('/');
    let idFound = false;
    currentPetId = null;

    // Bucle busca el ID usando repoName y petSegment correctos
    for (let i = 0; i < pathParts.length - 1; i++) {
        if (pathParts[i] === petSegment.replace('/','') && pathParts[i + 1]) { // Compara 'p'
            // Verifica si el path empieza con /repoName/ O si viene del redirect (empieza con /p/)
            if (effectivePath.startsWith(`/${repoName}/`) || effectivePath.startsWith(`/${petSegment.replace('/','')}/`)) {
                 // Asegura que el segmento ANTES de 'p' sea 'petid' si NO viene de redirect
                 if (!effectivePath.startsWith(`/${petSegment.replace('/','')}/`)) { // Si NO es por redirect
                    if (i > 0 && pathParts[i-1] === repoName) { // El anterior debe ser el repoName
                        currentPetId = pathParts[i + 1];
                        idFound = true;
                        break;
                    }
                 } else { // Si viene por redirect (empieza con /p/)
                     currentPetId = pathParts[i + 1];
                     idFound = true;
                     break;
                 }
            }
        }
    }


    if (idFound && currentPetId) {
        console.log("ID encontrado:", currentPetId);
        listenToAuthState();
    } else {
        console.log(`Patrón /${repoName}/${petSegment} ó /${petSegment} no encontrado en:`, effectivePath);
        listenToAuthState();
        // Muestra error SÓLO si NO estamos en la URL raíz exacta
        if (effectivePath !== `/${repoName}/` && effectivePath !== '/') {
           showError("URL no válida 🤷. Escanea un QR válido.");
        }
        // Si estamos en la raíz, listenToAuthState decidirá si mostrar login o mensaje
    }

    // Listener preview foto registro
    if (petPhotoInput && photoPreview) {
        petPhotoInput.addEventListener('change', (e) => { /* ... (sin cambios) ... */
             const file = e.target.files[0]; if (file) { const reader = new FileReader(); reader.onload = function(event) { photoPreview.innerHTML = `<img src="${event.target.result}" alt="Vista previa" style="max-width: 150px; margin-top: 10px; border-radius: var(--border-radius);"/>`; }; reader.readAsDataURL(file); } else { photoPreview.innerHTML = ''; } });
    }
    // Listeners botones (goToLoginBtn, backToProfileBtn, logoutBtn)
    if(goToLoginBtn) { goToLoginBtn.addEventListener('click', () => { /* ... (sin cambios) ... */ showView('login-view'); if (currentPetId && backToProfileBtn) { backToProfileBtn.style.display = 'inline-block'; } else if (backToProfileBtn) { backToProfileBtn.style.display = 'none'; } }); }
    if(backToProfileBtn) { backToProfileBtn.addEventListener('click', (e) => { /* ... (sin cambios) ... */ e.preventDefault(); if (currentPetId) { handlePetId(currentPetId, currentUser); } else { showView('login-view'); } }); }
    if(logoutBtn) { logoutBtn.addEventListener('click', () => { /* ... (sin cambios) ... */ auth.signOut().catch(error => { console.error("Error logout:", error); showError("No se pudo cerrar sesión."); }); }); }

}); // Fin DOMContentLoaded

// ===========================================
// LISTENERS DE FORMULARIOS (register, login, edit)
// ===========================================

if (registerForm) {
    registerForm.addEventListener('submit', async (e) => { /* ... (lógica igual que antes, usa uploadImageToCloudinary) ... */
        e.preventDefault(); showView('loading-view'); if (registerError) registerError.textContent = '';
        const ownerName = document.getElementById('owner-name')?.value.trim(); const ownerPhone = document.getElementById('owner-phone')?.value.trim(); const ownerAddress = document.getElementById('owner-address')?.value.trim(); const showAddress = document.getElementById('show-address')?.checked; const petName = document.getElementById('pet-name')?.value.trim(); const petObservations = document.getElementById('pet-observations')?.value.trim(); const email = document.getElementById('register-email')?.value.trim(); const password = document.getElementById('register-password')?.value; const photoFile = petPhotoInput?.files[0];
        if (!photoFile) { if (registerError) registerError.textContent = "¡Falta la foto! 📸"; showView('register-view'); return; } if (!ownerName || !ownerPhone || !petName || !email || !password) { if (registerError) registerError.textContent = "Completa campos obligatorios (*)."; showView('register-view'); return; } if (password.length < 6) { if (registerError) registerError.textContent = "Contraseña corta (mín 6 car.)."; showView('register-view'); return; }
        try {
            const photoUrl = await uploadImageToCloudinary(photoFile);
            const userCredential = await auth.createUserWithEmailAndPassword(email, password); const user = userCredential.user;
            const petData = { ownerUserId: user.uid, ownerName, ownerPhone, ownerAddress, showAddressPublicly: showAddress, petName, petPhotoUrl: photoUrl, petObservations, registeredAt: firebase.firestore.FieldValue.serverTimestamp() };
            await db.collection('pets').doc(currentPetId).set(petData);
            currentPetData = { ...petData, id: currentPetId }; populatePublicProfile(currentPetData); showView('public-profile-view');
        } catch (error) { console.error("Error registro:", error); let errTxt = "Error."; if (error.message.includes("Cloudinary")) { errTxt = `Error foto: ${error.message}.`; } else { errTxt = mapFirebaseError(error); } if (registerError) registerError.textContent = errTxt; showView('register-view'); }
    });
}
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => { /* ... (lógica igual que antes) ... */
        e.preventDefault(); if (loginError) loginError.textContent = ''; const email = document.getElementById('login-email')?.value; const password = document.getElementById('login-password')?.value; if (!email || !password) { if(loginError) loginError.textContent = "Ingresa email y contraseña."; return; } showView('loading-view');
        try { await auth.signInWithEmailAndPassword(email, password); loginForm.reset(); if (backToProfileBtn) backToProfileBtn.style.display = 'none'; } catch (error) { console.error("Error login:", error); if (loginError) loginError.textContent = mapFirebaseError(error); showView('login-view'); }
    });
}
if (editForm) {
    editForm.addEventListener('submit', async (e) => { /* ... (lógica igual que antes, usa uploadImageToCloudinary) ... */
         e.preventDefault(); showView('loading-view'); if (editError) editError.textContent = ''; if (editSuccess) editSuccess.textContent = '';
        const ownerName = document.getElementById('edit-owner-name')?.value.trim(); const ownerPhone = document.getElementById('edit-owner-phone')?.value.trim(); const ownerAddress = document.getElementById('edit-owner-address')?.value.trim(); const showAddress = document.getElementById('edit-show-address')?.checked; const petName = document.getElementById('edit-pet-name')?.value.trim(); const petObservations = document.getElementById('edit-pet-observations')?.value.trim(); const newPhotoFile = editPetPhotoInput?.files[0];
        if (!ownerName || !ownerPhone || !petName) { if(editError) editError.textContent = "Completa campos obligatorios."; showView('edit-view'); return; }
        try {
            let photoUrl = currentPetData.petPhotoUrl; if (newPhotoFile) { photoUrl = await uploadImageToCloudinary(newPhotoFile); }
            const updatedData = { ownerName, ownerPhone, ownerAddress, showAddressPublicly: showAddress, petName, petPhotoUrl: photoUrl, petObservations, lastUpdatedAt: firebase.firestore.FieldValue.serverTimestamp() };
            await db.collection('pets').doc(currentPetId).update(updatedData);
            currentPetData = { ...currentPetData, ...updatedData }; populateEditForm(currentPetData); if (editSuccess) editSuccess.textContent = "¡Actualizado! ✨"; showView('edit-view');
        } catch (error) { console.error("Error actualizando:", error); let errTxt = "Error."; if (error.message.includes("Cloudinary")) { errTxt = `Error foto: ${error.message}.`; } else { errTxt = mapFirebaseError(error); } if (editError) editError.textContent = errTxt; populateEditForm(currentPetData); showView('edit-view'); }
    });
}

// --- Fin del código ---