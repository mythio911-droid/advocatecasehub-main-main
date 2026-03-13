import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

export const firebaseConfig = {
  apiKey: "AIzaSyD3FNeNCSm2Q7JX4vZ_3Akfb-aLS-8Kbao",
  authDomain: "advocatecasehub.firebaseapp.com",
  projectId: "advocatecasehub",
  storageBucket: "advocatecasehub.firebasestorage.app",
  messagingSenderId: "316272091402",
  appId: "1:316272091402:web:729dbc02c259d4ca7f5af3",
  measurementId: "G-9XL8GQ147T"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
