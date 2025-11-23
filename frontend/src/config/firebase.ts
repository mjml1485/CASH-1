import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_CASH_FIREBASE_API_KEY || "AIzaSyD2J_zrI9omnjqpj5eq9QqTAiO0w9uhma0",
  authDomain: import.meta.env.VITE_CASH_FIREBASE_AUTH_DOMAIN || "cash-485fd.firebaseapp.com",
  projectId: import.meta.env.VITE_CASH_FIREBASE_PROJECT_ID || "cash-485fd",
  storageBucket: import.meta.env.VITE_CASH_FIREBASE_STORAGE_BUCKET || "cash-485fd.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_CASH_FIREBASE_MESSAGING_SENDER_ID || "144836518326",
  appId: import.meta.env.VITE_CASH_FIREBASE_APP_ID || "1:144836518326:web:b9fc264dd5fcf470dfe117",
  measurementId: import.meta.env.VITE_CASH_FIREBASE_MEASUREMENT_ID || "G-J2W3TX7JQZ"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const db = getFirestore(app);

let analytics;
if (typeof window !== 'undefined') {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    console.warn('Firebase Analytics initialization failed:', error);
  }
}

export { analytics };
export default app;

