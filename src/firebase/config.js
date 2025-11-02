import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// TODO: Replace with your Firebase config
// Get these values from Firebase Console > Project Settings > General > Your apps
const firebaseConfig = {
    apiKey: "AIzaSyB6ko3gcfsh4VahPEcJ9byE2zuKJc_-wyE",
    authDomain: "prezento-1b937.firebaseapp.com",
    projectId: "prezento-1b937",
    storageBucket: "prezento-1b937.firebasestorage.app",
    messagingSenderId: "64106129151",
    appId: "1:64106129151:web:daec0c948437a15d970eca"
  };

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;

