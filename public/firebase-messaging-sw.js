importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js");

// Initialize the Firebase app in the service worker
firebase.initializeApp({
    apiKey: "AIzaSyAaPUnX7EIs6ny0FQAUwzXyV-eIZ18YzFc",
    authDomain: "nomee-91730.firebaseapp.com",
    projectId: "nomee-91730",
    storageBucket: "nomee-91730.firebasestorage.app",
    messagingSenderId: "21701776655",
    appId: "1:21701776655:web:56baa6113087b30ebc9a7a",
    measurementId: "G-S3X5XH9MD7",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log("Received background message ", payload);

    self.registration.showNotification(payload.notification.title, {
        body: payload.notification.body,
        icon: "/logo192.png", // adjust if needed
    });
});
