import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDCFJx4VQiIGeoqD9G8plAKo3w_gSTjzzI",
  authDomain: "ai-therapist-8104d.firebaseapp.com",
  projectId: "ai-therapist-8104d",
  storageBucket: "ai-therapist-8104d.firebasestorage.app",
  messagingSenderId: "839038915491",
  appId: "1:839038915491:web:aa0289bfabf4d7126c0016",
  measurementId: "G-NYBS4QHD1W"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
