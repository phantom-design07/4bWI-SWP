// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAYmbPlcxJF7vZpK5TMgXfBZPFjvfDM_EQ",
  authDomain: "wichtel-8f4fb.firebaseapp.com",
  projectId: "wichtel-8f4fb",
  storageBucket: "wichtel-8f4fb.firebasestorage.app",
  messagingSenderId: "610916611322",
  appId: "1:610916611322:web:ab4945059bb1d1212a8543",
  measurementId: "G-2VYY1HRF1M"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);