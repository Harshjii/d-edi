// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// import { getAnalytics } from "firebase/analytics"; // Optional: only if you use analytics
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC-Ama6KwacG1CjEcp-cRMatc7qsmTQMJY",
  authDomain: "d-edi-e6d9d.firebaseapp.com",
  projectId: "d-edi-e6d9d",
  storageBucket: "d-edi-e6d9d.firebasestorage.app",
  messagingSenderId: "84948402359",
  appId: "1:84948402359:web:e7dd9a6d301fbc0fbe0d32",
  measurementId: "G-5VRNZYX0SP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
// export const analytics = getAnalytics(app); // Optional