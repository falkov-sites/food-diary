import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Замените значения на конфиг вашего проекта Firebase.
const firebaseConfig = {
  apiKey: "AIzaSyDPtwBkKijqRoYRSpRYiXw28XaemuKU41w",
  authDomain: "food-diary-ivan.firebaseapp.com",
  projectId: "food-diary-ivan",
  storageBucket: "food-diary-ivan.firebasestorage.app",
  messagingSenderId: "835371645197",
  appId: "1:835371645197:web:b2e2bda2fba33b2ad75844",
  measurementId: "G-ZHQZYGF3DG",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
