// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD-pgOKpAvO3R4rKaHM7uXzfcC5l41oreI",
  authDomain: "poachcoachmobile.firebaseapp.com",
  projectId: "poachcoachmobile",
  storageBucket: "poachcoachmobile.firebasestorage.app",
  messagingSenderId: "97113922202",
  appId: "1:97113922202:web:110568d0d5d062dd7cdd23",
  measurementId: "G-XJEDZWN3C8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);