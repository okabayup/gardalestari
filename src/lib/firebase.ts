import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDXbT8iT_B5w0rLeYpa6yIh8kYBGXITcF8",
  authDomain: "garda-lestari.firebaseapp.com",
  projectId: "garda-lestari",
  storageBucket: "garda-lestari.appspot.com",
  messagingSenderId: "1036757381415",
  appId: "1:1036757381415:web:d5353e06ce7da43336f902"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

export { app, auth };
