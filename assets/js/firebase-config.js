// ============================================
// CONFIGURACIÓN DE FIREBASE
// ============================================

const firebaseConfig = {
    apiKey: "AIzaSyAEj8LOTROcv_El9G_aqR6g7ehLrNYXAzQ",
    authDomain: "arquitecto-sistemas-2026.firebaseapp.com",
    projectId: "arquitecto-sistemas-2026",
    storageBucket: "arquitecto-sistemas-2026.firebasestorage.app",
    messagingSenderId: "30537946950",
    appId: "1:30537946950:web:3f0cd5214cb8b458787747"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Referencias globales
const auth = firebase.auth();
const db = firebase.firestore();

// Configurar persistencia offline
db.enablePersistence()
    .catch((err) => {
        if (err.code === 'failed-precondition') {
            console.warn('Persistencia fallida: múltiples tabs abiertos');
        } else if (err.code === 'unimplemented') {
            console.warn('Persistencia no soportada en este navegador');
        }
    });

console.log('🔥 Firebase inicializado correctamente');
