// Firebase initialization for SabiOps push notifications
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyBKWEYqHDwqfuA91yemTVHf7M9ppw5f7tw",
  authDomain: "sabiops-9984f.firebaseapp.com",
  projectId: "sabiops-9984f",
  storageBucket: "sabiops-9984f.firebasestorage.app",
  messagingSenderId: "618137895532",
  appId: "1:618137895532:web:cb694e56dc4d9ffdcd4e49",
  measurementId: "G-6SKFSYK3Q8"
};

const VAPID_KEY = "BP2VpcX0H9VuYD8t-QWwFAyup3ikw1CqNdtlIkKhu4vxAabiqCjEcDCfj0K9-eXvr6NLmzrKUjQoTL2eSxxvOyI";

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export { app, messaging, getToken, onMessage, VAPID_KEY }; 