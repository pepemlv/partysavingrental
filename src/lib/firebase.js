import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database'; // Realtime Database
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getStorage } from 'firebase/storage'; // Firebase Storage

// Firebase configuration


const firebaseConfig = {
  apiKey: "AIzaSyAV087GU2EiD4N5ljU5wUkRWHeR6TGKdkE",
  authDomain: "assistmetech-45347.firebaseapp.com",
  databaseURL: "https://assistmetech-45347-default-rtdb.firebaseio.com",
  projectId: "assistmetech-45347",
  storageBucket: "assistmetech-45347.firebasestorage.app",
  messagingSenderId: "121696551475",
  appId: "1:121696551475:web:c557dc0212216f0e40d946"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize a secondary app for creating users without affecting current session
// This prevents logging out the current user when creating new accounts
const secondaryApp = initializeApp(firebaseConfig, 'Secondary');

// Initialize services
const db = getFirestore(app);
const realtimeDb = getDatabase(app);
const auth = getAuth(app);
const secondaryAuth = getAuth(secondaryApp); // Auth instance for creating users without affecting session
const storage = getStorage(app); // Initialize Storage

// Initialize Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Conditionally initialize Analytics
let analytics;
isSupported().then(supported => {
    if (supported) {
        analytics = getAnalytics(app);
    }
});

// Export Firebase services
export { app, analytics, db, auth, realtimeDb, storage, googleProvider, secondaryAuth };