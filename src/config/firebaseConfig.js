// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCNgdxHNSTJkLhJ_Uu1CKbb2boselLzhYs",
  authDomain: "blues-f26ec.firebaseapp.com",
  projectId: "blues-f26ec",
  storageBucket: "blues-f26ec.firebasestorage.app",
  messagingSenderId: "969909127011",
  appId: "1:969909127011:web:e753c6c51959777faff556",
  measurementId: "G-H4QQXDMBSN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Inicializar os serviços que você quer usar
export const auth = getAuth(app);
export const db = getFirestore(app);