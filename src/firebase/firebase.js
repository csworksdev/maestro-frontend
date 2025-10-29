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
  apiKey: resolveConfigValue("API_KEY"),
  authDomain: resolveConfigValue("AUTH_DOMAIN"),
  projectId: resolveConfigValue("PROJECT_ID"),
  storageBucket: resolveConfigValue("STORAGE_BUCKET"),
  messagingSenderId: resolveConfigValue("MESSAGING_SENDER_ID"),
  appId: resolveConfigValue("APP_ID"),
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
