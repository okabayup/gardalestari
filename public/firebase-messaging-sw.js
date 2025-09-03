
// This file needs to be in the public directory.
// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here, other Firebase libraries
// are not available in the service worker.
importScripts('https://www.gstatic.com/firebasejs/9.2.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.2.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// https://firebase.google.com/docs/web/setup#config-object
const firebaseConfig = {
  apiKey: "AIzaSyDWxO8Wq6I6dVig1cocVwj8eSO_MqvlvFQ",
  authDomain: "garda-lestari-5gz3p.firebaseapp.com",
  projectId: "garda-lestari-5gz3p",
  storageBucket: "garda-lestari-5gz3p.firebasestorage.app",
  messagingSenderId: "120282807854",
  appId: "1:120282807854:web:71c1d51656afb8af2929bf"
};

firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log(
    '[firebase-messaging-sw.js] Received background message ',
    payload
  );
  // Customize notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.image || '/logo.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
