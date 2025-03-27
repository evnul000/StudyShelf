import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCwWIZQRJRFjKU90uu-X0hnvmaeVc3hDjU",
  authDomain: "studyshelf-a03d9.firebaseapp.com",
  projectId: "studyshelf-a03d9",
  storageBucket: "studyshelf-a03d9.firebasestorage.app",
  messagingSenderId: "894759049644",
  appId: "1:894759049644:web:9eccf7f036b006ababc209",
  measurementId: "G-W0K3JBL5G3"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);