import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Замените значения на конфиг вашего проекта Firebase.
const firebaseConfig = {
  apiKey: "*******************",
  authDomain: "*******.firebaseapp.com",
  projectId: "*******",
  storageBucket: "*******.firebasestorage.app",
  messagingSenderId: "*****",
  appId: "*****:web:*****",
  measurementId: "*****",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
