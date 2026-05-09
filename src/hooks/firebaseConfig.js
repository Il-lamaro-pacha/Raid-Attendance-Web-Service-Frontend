// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDDCBXLE2zTTQwCGD8UISl3W_oPfrOvfmE",
  authDomain: "attendance-web-server-service.firebaseapp.com",
  projectId: "attendance-web-server-service",
  storageBucket: "attendance-web-server-service.firebasestorage.app",
  messagingSenderId: "826175883245",
  appId: "1:826175883245:web:2f998189f87b6071d249e4",
  measurementId: "G-1M2MWFFHC5"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth(app);