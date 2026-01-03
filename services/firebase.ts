import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Configuration from environment variables
// In a real deployment, ensure these are set in your .env file
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "mock-key",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "mock-project.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "mock-project",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "mock-project.appspot.com",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };