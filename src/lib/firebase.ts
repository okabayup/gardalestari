import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDWxO8Wq6I6dVig1cocVwj8eSO_MqvlvFQ",
  authDomain: "garda-lestari-5gz3p.firebaseapp.com",
  projectId: "garda-lestari-5gz3p",
  storageBucket: "garda-lestari-5gz3p.appspot.com",
  messagingSenderId: "120282807854",
  appId: "1:120282807854:web:71c1d51656afb8af2929bf"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

export { app, auth };
