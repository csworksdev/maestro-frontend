// src/firebase.js
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// 🔐 Ambil dari Firebase Console > Project Settings
export const firebaseConfig = {
  apiKey: "AIzaSyAxA0Mm6WnMnUGaZuMUprFDzMJv_V63Gck",
  authDomain: "maestro-front.firebaseapp.com",
  projectId: "maestro-front",
  storageBucket: "maestro-front.appspot.com",
  messagingSenderId: "988318550591",
  appId: "1:988318550591:web:c266ba0a71387fe5de468a",
};

const firebaseApp = initializeApp(firebaseConfig);

// Inisialisasi messaging
const messaging = getMessaging(firebaseApp);

export { messaging, getToken, onMessage };
