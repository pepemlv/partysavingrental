// backend/firebase-node.js

const { initializeApp } = require('firebase/app');
const { getFirestore } = require('firebase/firestore');

// Config identique à src/lib/firebase.js
const firebaseConfig = {
    apiKey: "AIzaSyDNJQ5rKci64Ni1UFym6QSgwHDhWMyQTMc",
    authDomain: "techtracknative.firebaseapp.com",
    databaseURL: "https://techtracknative-default-rtdb.firebaseio.com",
    projectId: "techtracknative",
    storageBucket: "techtracknative.appspot.com",
    messagingSenderId: "749519080715",
    appId: "1:749519080715:web:f0689782d88552dc33660e"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

module.exports = { db };
