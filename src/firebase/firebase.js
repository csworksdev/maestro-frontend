import { initializeApp } from "firebase/app";
import {
  getMessaging,
  getToken,
  onMessage,
  isSupported as isMessagingSupported,
} from "firebase/messaging";

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

let messagingPromise;

export const getMessagingInstance = () => {
  if (typeof window === "undefined") {
    return Promise.resolve(null);
  }

  if (!messagingPromise) {
    messagingPromise = isMessagingSupported()
      .then((supported) => {
        if (!supported) {
          console.warn(
            "[FCM] Browser tidak mendukung Firebase Messaging (misal Safari iOS)."
          );
          return null;
        }
        return getMessaging(firebaseApp);
      })
      .catch((err) => {
        console.warn("[FCM] Gagal inisialisasi messaging:", err);
        return null;
      });
  }

  return messagingPromise;
};

export { getToken, onMessage };
