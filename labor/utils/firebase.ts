// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCnIzgJGwzAxx-XUW2XH7OkyIa6sDRmMs0",
  authDomain: "labordemo-623a1.firebaseapp.com",
  projectId: "labordemo-623a1",
  storageBucket: "labordemo-623a1.firebasestorage.app",
  messagingSenderId: "513722954297",
  appId: "1:513722954297:web:31af2c8999ac9a4f49d3e8",
  measurementId: "G-S6EXV2HKZG"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const db = getFirestore(app);