import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAZdK7onGc3Oz66W4_KR3ujCJ57NUfO-mQ",
  authDomain: "foodwise-clinical.firebaseapp.com",
  projectId: "foodwise-clinical",
  storageBucket: "foodwise-clinical.firebasestorage.app",
  messagingSenderId: "562667244202",
  appId: "1:562667244202:web:ecfc74b9a602ac45219ed3",
  measurementId: "G-BSZ3V1W2RQ"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();