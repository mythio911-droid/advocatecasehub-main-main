const { initializeApp } = require('firebase/app');
const { getFirestore } = require('firebase/firestore');
require('dotenv').config();

const firebaseConfig = {
    apiKey: "AIzaSyD3FNeNCSm2Q7JX4vZ_3Akfb-aLS-8Kbao",
    authDomain: "advocatecasehub.firebaseapp.com",
    projectId: "advocatecasehub",
    storageBucket: "advocatecasehub.firebasestorage.app",
    messagingSenderId: "316272091402",
    appId: "1:316272091402:web:729dbc02c259d4ca7f5af3",
    measurementId: "G-9XL8GQ147T"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log('✅ Connected to Firebase Cloud Firestore');

module.exports = db;
