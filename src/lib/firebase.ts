
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from "firebase/analytics";


const firebaseConfig = {
  apiKey: "AIzaSyDWxO8Wq6I6dVig1cocVwj8eSO_MqvlvFQ",
  authDomain: "garda-lestari-5gz3p.firebaseapp.com",
  projectId: "garda-lestari-5gz3p",
  storageBucket: "garda-lestari-5gz3p.firebasestorage.app",
  messagingSenderId: "120282807854",
  appId: "1:120282807854:web:71c1d51656afb8af2929bf",
  measurementId: "G-GSQGHSXR4J"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

const analytics = isSupported().then(yes => yes ? getAnalytics(app) : null);

export { app, auth, db, storage, analytics };
