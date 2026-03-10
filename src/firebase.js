import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDr35V5alqKbjLqGk2dCdkbSiJoE-9PkRI",
  authDomain: "swanthike-portal.firebaseapp.com",
  projectId: "swanthike-portal",
  appId: "1:105652035797:web:8aae2ee107dda0781bc25c"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();