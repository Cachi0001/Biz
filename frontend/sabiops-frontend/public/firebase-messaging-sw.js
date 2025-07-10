// firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBKWEYqHDwqfuA91yemTVHf7M9ppw5f7tw",
  authDomain: "sabiops-9984f.firebaseapp.com",
  projectId: "sabiops-9984f",
  storageBucket: "sabiops-9984f.firebasestorage.app",
  messagingSenderId: "618137895532",
  appId: "1:618137895532:web:cb694e56dc4d9ffdcd4e49",
  measurementId: "G-6SKFSYK3Q8"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  const notificationTitle = payload.notification?.title || 'SabiOps Notification';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/sabiops.jpg',
    data: payload.data || {}
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
}); 