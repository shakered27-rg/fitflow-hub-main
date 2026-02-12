// ============================================
// FIREBASE CONFIGURATION
// ============================================

// Replace with your Firebase project configuration
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize services
const auth = firebase.auth();
const db = firebase.firestore();

// Admin credentials (for development/testing)
const ADMIN_EMAIL = "admin@fitnessapp.com";
const ADMIN_PASSWORD = "admin123";

// Check if user is admin
function isAdmin(email) {
    return email === ADMIN_EMAIL;
}