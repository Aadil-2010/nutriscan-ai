import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAZdK7onGc30z66W4_KR3ujCJ57NUfO-mQ",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "foodwise-clinical.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "foodwise-clinical",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "foodwise-clinical.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "562667244202",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:562667244202:web:ecfc74b9a602ac45219ed3",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-BSZ3V1W2RQ"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();