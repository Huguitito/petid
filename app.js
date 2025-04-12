// app.js

// 1. Configuración de Firebase (TUS DATOS)
const firebaseConfig = {
  apiKey: "AIzaSyCatSfVDRfqkBBbrUH-lS9kxPexbMVV6mw",
  authDomain: "mascotas-qr-v2.firebaseapp.com", // Mantén este si tu proyecto Firebase se llama así
  projectId: "mascotas-qr-v2",               // Mantén este si tu proyecto Firebase se llama así
  storageBucket: "mascotas-qr-v2.firebasestorage.app", // Aunque no usemos Storage, puede estar aquí
  messagingSenderId: "139139331167",
  appId: "1:139139331167:web:7634d72ef1500f2fe757ea"
};

// --- >>> CONFIGURACIÓN DE CLOUDINARY (CON TUS DATOS) <<< ---
const CLOUDINARY_CLOUD_NAME = "djwc9b2g4";
const CLOUDINARY_UPLOAD_PRESET = "mascotas-qr-v2"; // Tu upload preset sin firmar
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`; // URL de la API

// 2. Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// 3. Referencias a Elementos del DOM
// ... (todas las referencias igual que en la versión anterior) ...
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
const placeholderImage = 'generic-pet.png'; // !! Asegúrate de tener este archivo !!
const repoName = "petid"; // <<<--- !! ASUMIENDO QUE RENOMBRASTE EL REPO A petid !!

// ===========================================
// DEFINICIÓN DE FUNCIONES PRINCIPALES
// ===========================================

function showView(viewId) {
    // ... (definición igual que antes) ...
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active-view');
    });
    const activeView = document.getElementById(viewId);
    if (activeView) {
        activeView.classList.add('active-view');
    } else {
        console.error("Error interno: Vista no encontrada:", viewId);
        if (typeof showError === 'function' && errorMessage) {
            showError(`Error interno: La vista solicitada ('${viewId}') no existe.`);
        } else {
            alert(`Error crítico: Vista '${viewId}' no encontrada y no se puede mostrar mensaje de error.`);
        }
    }
}

function showError(message = "Ocurrió un error inesperado.") {
    // ... (definición igual que antes) ...
     if (errorMessage) {
        errorMessage.textContent = message;
        if (typeof showView === 'function') {
            showView('error-view');
        } else {
            console.error("Error al mostrar error: showView no está definida. Mensaje original:", message);
            alert("Error: " + message);
        }
    } else {
        console.error("Error al mostrar error: Elemento 'errorMessage' no encontrado. Mensaje original:", message);
        alert("Error: " + message);
    }
}

// ===========================================
// LÓGICA PRINCIPAL Y OTRAS FUNCIONES
// ===========================================

document.addEventListener('DOMContentLoaded', () => {
    // ... (Lógica de DOMContentLoaded igual que antes, usando repoName y petSegment='p') ...
     showView('loading-view');

    const urlParams = new URLSearchParams(window.location.search);
    const redirectPath = urlParams.get('redirect');
    let effectivePath = "";

    if (redirectPath) {
        effectivePath = "/" + redirectPath.replace(/^\//, '');
        console.log("Redirección detectada. Ruta efectiva:", effectivePath);
        const cleanUrl = window.location.pathname; // Solo /repoName/
        window.history.replaceState({}, document.title, cleanUrl);
    } else {
        effectivePath = window.location.pathname;
        console.log("Acceso directo. Ruta efectiva:", effectivePath);
    }

    const pathParts = effectivePath.split('/');
    // const repoName = "petid"; // Definido globalmente ahora
    const petSegment = "p";
    let idFound = false;
    currentPetId = null;

    for (let i = 0; i < pathParts.length - 1; i++) {
        if (pathParts[i] === petSegment && pathParts[i + 1]) {
            if ((i > 0 && pathParts[i - 1] === repoName) || (i === 1 && effectivePath.startsWith('/' + petSegment))) {
                 currentPetId = pathParts[i + 1];
                 idFound = true;
                 break;
            }
        }
    }

    if (idFound && currentPetId) {
        console.log("ID de mascota encontrado:", currentPetId);
        listenToAuthState();
    } else {
        console.log(`No se encontró un patrón '/${repoName}/${petSegment}/ID' o '/${petSegment}/ID' válido en la ruta:`, effectivePath);
        listenToAuthState();
        if (effectivePath !== `/${repoName}/` && effectivePath !== '/') {
           showError("URL no válida 🤷. Escanea un QR válido.");
        } else {
           showView('login-view');
        }
    }

    // Listener para preview de foto en registro
    if (petPhotoInput && photoPreview) {
       // ... (listener igual) ...
        petPhotoInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    photoPreview.innerHTML = `<img src="${event.target.result}" alt="Vista previa" style="max-width: 150px; margin-top: 10px; border-radius: var(--border-radius);"/>`;
                }
                reader.readAsDataURL(file);
            } else {
                photoPreview.innerHTML = '';
            }
        });
    }

    // Listeners de botones
    if(goToLoginBtn) {
       // ... (listener igual) ...
        goToLoginBtn.addEventListener('click', () => {
            showView('login-view');
            if (currentPetId && backToProfileBtn) {
               backToProfileBtn.style.display = 'inline-block';
            } else if (backToProfileBtn) {
               backToProfileBtn.style.display = 'none';
            }
        });
    }

    if(backToProfileBtn) {
        // ... (listener igual) ...
        backToProfileBtn.addEventListener('click', (e) => {
             e.preventDefault();
             if (currentPetId) {
                handlePetId(currentPetId, currentUser);
             } else {
                showView('login-view');
             }
         });
    }

    if(logoutBtn) {
        // ... (listener igual) ...
         logoutBtn.addEventListener('click', () => {
             auth.signOut().then(() => {
                 console.log("Usuario deslogueado");
                 currentUser = null;
                 currentPetData = null;
                 if (currentPetId) {
                     handlePetId(currentPetId, null);
                 } else {
                     showView('login-view');
                 }
             }).catch(error => {
                 console.error("Error al desloguear:", error);
                 showError("No se pudo cerrar sesión. Intenta de nuevo.");
             });
         });
    }
}); // Fin DOMContentLoaded

function listenToAuthState() {
    // ... (definición igual que antes) ...
     auth.onAuthStateChanged(user => {
        currentUser = user;
        if (currentPetId) {
            handlePetId(currentPetId, user);
        } else {
             if (!user) {
                if (!errorView.classList.contains('active-view')) {
                     showView('login-view');
                }
            } else {
                 if (!editView.classList.contains('active-view') && !errorView.classList.contains('active-view')) {
                    showError("¡Hola! 👋 Escanea el QR de tu mascota para ver o editar su perfil.");
                 }
            }
        }
    });
}

async function handlePetId(petId, user) {
    // ... (definición igual que antes) ...
     if (!loadingView.classList.contains('active-view')) {
        showView('loading-view');
    }
    try {
        const docRef = db.collection('pets').doc(petId);
        const docSnap = await docRef.get();

        if (docSnap.exists) {
            currentPetData = docSnap.data();
            currentPetData.id = docSnap.id;
            if (user && user.uid === currentPetData.ownerUserId) {
                populateEditForm(currentPetData);
                showView('edit-view');
            } else {
                populatePublicProfile(currentPetData);
                showView('public-profile-view');
                if (backToProfileBtn) backToProfileBtn.style.display = 'none';
            }
        } else {
            console.log("No existe documento para el ID:", petId);
            if (registerForm) registerForm.reset();
            if (photoPreview) photoPreview.innerHTML = '';
            if (registerError) registerError.textContent = '';
            showView('register-view');
            if (backToProfileBtn) backToProfileBtn.style.display = 'none';
        }
    } catch (error) {
        console.error("Error al obtener datos de la mascota:", error);
        showError(`Error al cargar datos para ${petId} 😥: ${error.message}`);
    }
}

function populatePublicProfile(data) {
    // ... (definición igual que antes) ...
     if (publicPetPhoto) {
         publicPetPhoto.src = data.petPhotoUrl || placeholderImage;
         publicPetPhoto.onerror = () => { publicPetPhoto.src = placeholderImage; };
    }
    if (publicPetName) publicPetName.textContent = data.petName || 'Nombre no disponible';
    if (publicOwnerName) publicOwnerName.textContent = data.ownerName || 'Dueño no disponible';

    if (publicObservationsSection && publicPetObservations) {
        if (data.petObservations && data.petObservations.trim() !== '') {
            publicPetObservations.innerHTML = data.petObservations.replace(/\n/g, '<br>');
            publicObservationsSection.style.display = 'block';
        } else {
            publicObservationsSection.style.display = 'none';
        }
    }

    if (whatsappButton) {
        if (data.ownerPhone) {
            const cleanPhone = data.ownerPhone.replace(/[\s+\-()]/g, '');
            const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(`¡Hola ${data.ownerName}! Encontré a ${data.petName || 'tu mascota'} que tiene la chapita QR. ¿Estás cerca?`)}`;
            whatsappButton.href = whatsappUrl;
            whatsappButton.style.display = 'block';
        } else {
            whatsappButton.style.display = 'none';
        }
    }

    if (mapsButton) {
        if (data.ownerAddress && data.showAddressPublicly === true) {
            const mapsUrl = `https://www.google.com/maps?q=${encodeURIComponent(data.ownerAddress)}`;
            mapsButton.href = mapsUrl;
            mapsButton.style.display = 'block';
        } else {
            mapsButton.style.display = 'none';
        }
    }
}

function populateEditForm(data) {
    // ... (definición igual que antes) ...
     if (!editForm) return;
     if (currentPetPhoto) {
         currentPetPhoto.src = data.petPhotoUrl || placeholderImage;
         currentPetPhoto.onerror = () => { currentPetPhoto.src = placeholderImage; };
     }
     if(editPetPhotoInput) editPetPhotoInput.value = null;

    const ownerNameInput = document.getElementById('edit-owner-name');
    const ownerPhoneInput = document.getElementById('edit-owner-phone');
    const ownerAddressInput = document.getElementById('edit-owner-address');
    const showAddressCheckbox = document.getElementById('edit-show-address');
    const petNameInput = document.getElementById('edit-pet-name');
    const petObservationsTextarea = document.getElementById('edit-pet-observations');

    if (ownerNameInput) ownerNameInput.value = data.ownerName || '';
    if (ownerPhoneInput) ownerPhoneInput.value = data.ownerPhone || '';
    if (ownerAddressInput) ownerAddressInput.value = data.ownerAddress || '';
    if (showAddressCheckbox) showAddressCheckbox.checked = data.showAddressPublicly === true;
    if (petNameInput) petNameInput.value = data.petName || '';
    if (petObservationsTextarea) petObservationsTextarea.value = data.petObservations || '';

    if (editError) editError.textContent = '';
    if (editSuccess) editSuccess.textContent = '';
}

async function uploadImageToCloudinary(file) {
    // ... (definición igual que antes, USA TUS CONSTANTES CLOUDINARY_) ...
    const maxSizeMB = 5;
    if (file.size > maxSizeMB * 1024 * 1024) {
         throw new Error(`La imagen es muy grande (máx ${maxSizeMB} MB)`);
    }
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
         throw new Error('Formato de imagen no válido (solo JPG, PNG, GIF)');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET); // <-- Usa tu preset

    console.log(`Subiendo ${file.name} a Cloudinary...`);

    try {
        const response = await fetch(CLOUDINARY_URL, { // <-- Usa tu URL de API
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        if (!response.ok) {
            const errorMsg = data?.error?.message || `Error HTTP ${response.status}`;
            console.error('Error Cloudinary:', data);
            throw new Error(`Cloudinary: ${errorMsg}`);
        }
        console.log('Respuesta Cloudinary:', data);
        if (!data.secure_url) {
            throw new Error('Cloudinary no devolvió una URL segura.');
        }
        return data.secure_url;
    } catch (error) {
        console.error("Error en fetch a Cloudinary:", error);
        throw new Error(error.message || 'Error de red al subir imagen.');
    }
}

if (registerForm) {
    // ... (listener igual que antes, llama a uploadImageToCloudinary) ...
     registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        showView('loading-view');
        if (registerError) registerError.textContent = '';

        const ownerName = document.getElementById('owner-name')?.value.trim();
        const ownerPhone = document.getElementById('owner-phone')?.value.trim();
        const ownerAddress = document.getElementById('owner-address')?.value.trim();
        const showAddress = document.getElementById('show-address')?.checked;
        const petName = document.getElementById('pet-name')?.value.trim();
        const petObservations = document.getElementById('pet-observations')?.value.trim();
        const email = document.getElementById('register-email')?.value.trim();
        const password = document.getElementById('register-password')?.value;
        const photoFile = petPhotoInput?.files[0];

        if (!photoFile) {
            if (registerError) registerError.textContent = "¡No olvides la foto de tu mascota! 📸";
            showView('register-view');
            return;
        }
        if (!ownerName || !ownerPhone || !petName || !email || !password) {
             if (registerError) registerError.textContent = "Completa todos los campos obligatorios (*).";
             showView('register-view');
             return;
        }
        if (password.length < 6) {
            if (registerError) registerError.textContent = "La contraseña debe tener al menos 6 caracteres.";
            showView('register-view');
            return;
         }

        try {
            console.log("Iniciando subida de foto para registro...");
            const photoUrl = await uploadImageToCloudinary(photoFile);
            console.log("Foto subida OK:", photoUrl);

            console.log("Creando usuario...");
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            console.log("Usuario creado OK:", user.uid);

            const petData = {
                ownerUserId: user.uid, ownerName, ownerPhone, ownerAddress,
                showAddressPublicly: showAddress, petName, petPhotoUrl: photoUrl,
                petObservations, registeredAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            console.log("Guardando datos en Firestore...");
            await db.collection('pets').doc(currentPetId).set(petData);
            console.log("Datos guardados OK para ID:", currentPetId);

            currentPetData = { ...petData, id: currentPetId };
            populatePublicProfile(currentPetData);
            showView('public-profile-view');

        } catch (error) {
            console.error("Error durante el registro:", error);
            let userFriendlyError = "Ocurrió un error. Intenta de nuevo.";
             if (error.message.includes("Cloudinary")) {
                 userFriendlyError = `Error con la foto: ${error.message}. Prueba otra imagen o revisa tu conexión.`;
             } else {
                 userFriendlyError = mapFirebaseError(error);
             }
            if (registerError) registerError.textContent = userFriendlyError;
            showView('register-view');
        }
    });
}

if (loginForm) {
    // ... (listener igual que antes) ...
     loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (loginError) loginError.textContent = '';
        const email = document.getElementById('login-email')?.value;
        const password = document.getElementById('login-password')?.value;

         if (!email || !password) {
            if(loginError) loginError.textContent = "Ingresa email y contraseña.";
            return;
        }

        showView('loading-view');

        try {
            await auth.signInWithEmailAndPassword(email, password);
            console.log("Usuario logueado OK");
            loginForm.reset();
            if (backToProfileBtn) backToProfileBtn.style.display = 'none';
            // onAuthStateChanged se encarga del resto

        } catch (error) {
            console.error("Error de login:", error);
            if (loginError) loginError.textContent = mapFirebaseError(error);
            showView('login-view');
        }
    });
}

if (editForm) {
    // ... (listener igual que antes, llama a uploadImageToCloudinary si hay newPhotoFile) ...
     editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        showView('loading-view');
        if (editError) editError.textContent = '';
        if (editSuccess) editSuccess.textContent = '';

        const ownerName = document.getElementById('edit-owner-name')?.value.trim();
        const ownerPhone = document.getElementById('edit-owner-phone')?.value.trim();
        const ownerAddress = document.getElementById('edit-owner-address')?.value.trim();
        const showAddress = document.getElementById('edit-show-address')?.checked;
        const petName = document.getElementById('edit-pet-name')?.value.trim();
        const petObservations = document.getElementById('edit-pet-observations')?.value.trim();
        const newPhotoFile = editPetPhotoInput?.files[0];

        if (!ownerName || !ownerPhone || !petName) {
             if(editError) editError.textContent = "Completa los campos obligatorios.";
             showView('edit-view');
             return;
        }

        try {
            let photoUrl = currentPetData.petPhotoUrl;

            if (newPhotoFile) {
                console.log("Subiendo nueva foto para edición...");
                photoUrl = await uploadImageToCloudinary(newPhotoFile);
                console.log("Nueva foto subida OK:", photoUrl);
            }

            const updatedData = {
                ownerName, ownerPhone, ownerAddress, showAddressPublicly: showAddress,
                petName, petPhotoUrl: photoUrl, petObservations,
                lastUpdatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            console.log("Actualizando Firestore...");
            await db.collection('pets').doc(currentPetId).update(updatedData);
            console.log("Datos actualizados OK");

            currentPetData = { ...currentPetData, ...updatedData };
            populateEditForm(currentPetData);
            if (editSuccess) editSuccess.textContent = "¡Información actualizada con éxito! ✨";
            showView('edit-view');

        } catch (error) {
            console.error("Error al actualizar:", error);
            let userFriendlyError = "Ocurrió un error al guardar.";
             if (error.message.includes("Cloudinary")) {
                 userFriendlyError = `Error con la foto: ${error.message}.`;
             } else {
                 userFriendlyError = mapFirebaseError(error);
             }
            if (editError) editError.textContent = userFriendlyError;
            populateEditForm(currentPetData); // Repoblar con datos previos
            showView('edit-view');
        }
    });
}

function mapFirebaseError(error) {
    // ... (definición igual que antes) ...
     console.log("Código de error Firebase:", error.code, error.message);
    switch (error.code) {
        case 'auth/invalid-email': return 'El formato del email no es válido.';
        case 'auth/user-not-found': return 'No encontramos cuenta con ese email. ¿Te registraste?';
        case 'auth/wrong-password': return '¡Contraseña incorrecta! Intenta de nuevo.';
        case 'auth/email-already-in-use': return 'Ese email ya está registrado. Intenta iniciar sesión.';
        case 'auth/weak-password': return 'Contraseña muy corta (mínimo 6 caracteres).';
        case 'auth/too-many-requests': return 'Demasiados intentos. Espera un momento ⏳.';
        case 'permission-denied': return 'Permiso denegado. ¿Estás logueado?';
        case 'unavailable': return 'El servicio no está disponible. Intenta más tarde.';
        case 'internal-error': return 'Error interno del servidor. Intenta más tarde.';
        case 'cancelled': return 'Operación cancelada.';
        case 'unknown': return 'Error desconocido. Revisa tu conexión.';
        case 'failed-precondition': return 'Condición previa fallida (¿datos incorrectos?).';
        case 'unauthenticated': return 'Necesitas iniciar sesión para esta acción.';
        default: return error.message || 'Ocurrió un error inesperado.';
    }
}