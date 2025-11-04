import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// Gunakan env vars supaya kredensial mudah diputar dan tidak hard-coded.
const resolveConfigValue = (key, fallback = "") => {
  const envKey = `VITE_FIREBASE_${key}`;
  const value = import.meta.env?.[envKey];
  if (value && typeof value === "string" && value.trim().length > 0) {
    return value;
  }
  return fallback;
};

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

if (import.meta.env?.DEV) {
  const missingKeys = Object.entries(firebaseConfig)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missingKeys.length) {
    console.warn(
      `Firebase config is missing values for: ${missingKeys.join(
        ", "
      )}. Please provide VITE_FIREBASE_* entries in your environment.`
    );
  }
}

const firebaseApp = initializeApp(firebaseConfig);

// Inisialisasi messaging
const messaging = getMessaging(firebaseApp);

export { messaging, getToken, onMessage };
