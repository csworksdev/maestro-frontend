import { initializeApp } from "firebase/app";
import {
  getMessaging,
  getToken,
  onMessage,
  isSupported as isMessagingSupported,
} from "firebase/messaging";

const getFirebaseEnvValue = (key) => {
  const value = import.meta.env?.[key];
  return typeof value === "string" && value.trim().length > 0 ? value : "";
};

const getRuntimeFirebaseConfig = () => {
  if (typeof window === "undefined") {
    return null;
  }

  const runtimeConfig = window.__FIREBASE_CONFIG__;
  if (
    runtimeConfig &&
    typeof runtimeConfig === "object" &&
    Object.values(runtimeConfig).every((value) => Boolean(value))
  ) {
    return runtimeConfig;
  }

  return null;
};

export const firebaseConfig = {
  apiKey: getFirebaseEnvValue("VITE_FIREBASE_API_KEY"),
  authDomain: getFirebaseEnvValue("VITE_FIREBASE_AUTH_DOMAIN"),
  projectId: getFirebaseEnvValue("VITE_FIREBASE_PROJECT_ID"),
  storageBucket: getFirebaseEnvValue("VITE_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: getFirebaseEnvValue("VITE_FIREBASE_MESSAGING_SENDER_ID"),
  appId: getFirebaseEnvValue("VITE_FIREBASE_APP_ID"),
};

const getMissingFirebaseConfigKeys = () => {
  const configSource = getRuntimeFirebaseConfig() || firebaseConfig;

  return Object.entries(configSource)
    .filter(([, value]) => !value)
    .map(([key]) => key);
};

const hasRequiredFirebaseConfig = () => {
  return getMissingFirebaseConfigKeys().length === 0;
};

if (import.meta.env?.DEV) {
  const missingKeys = getMissingFirebaseConfigKeys();

  if (missingKeys.length) {
    console.warn(
      `Firebase config is missing values for: ${missingKeys.join(
        ", ",
      )}. Please provide VITE_FIREBASE_* entries in your environment.`,
    );
  }
}

let firebaseApp = null;
let messagingPromise = null;

if (hasRequiredFirebaseConfig()) {
  const configToUse = getRuntimeFirebaseConfig() || firebaseConfig;
  firebaseApp = initializeApp(configToUse);
}

export const getMessagingInstance = () => {
  if (typeof window === "undefined") {
    return Promise.resolve(null);
  }

  if (!hasRequiredFirebaseConfig()) {
    const missingKeys = getMissingFirebaseConfigKeys();
    console.warn(
      `[FCM] Konfigurasi Firebase belum lengkap (${missingKeys.join(
        ", ",
      )}). FCM dilewati.`,
    );
    return Promise.resolve(null);
  }

  if (!messagingPromise) {
    messagingPromise = isMessagingSupported()
      .then((supported) => {
        if (!supported) {
          console.warn(
            "[FCM] Browser tidak mendukung Firebase Messaging (misal Safari iOS).",
          );
          return null;
        }
        if (!firebaseApp) {
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
