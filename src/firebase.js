import { initializeApp } from 'firebase/app';
import { getAuth,setPersistence, browserLocalPersistence, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

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
const auth = getAuth(app);

// Set persistence
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log("Auth persistence enabled");
  })
  .catch((error) => {
    console.error("Error enabling persistence:", error);
  });

const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();
const storage = getStorage(app);

export { auth, db, storage, googleProvider };