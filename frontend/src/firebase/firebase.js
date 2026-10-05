// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA7MOkL5z3a9VnCA_7i6l3mueyX0USH9iQ",
  authDomain: "quickfix-3cc5b.firebaseapp.com",
  projectId: "quickfix-3cc5b",
  storageBucket: "quickfix-3cc5b.firebasestorage.app",
  messagingSenderId: "253986474577",
  appId: "1:253986474577:web:d56849c289ea2356dd4670",
  measurementId: "G-P7QK0EQ278"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);