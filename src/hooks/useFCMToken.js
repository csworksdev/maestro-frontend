import { useEffect, useState } from "react";
import { getMessaging, getToken } from "firebase/messaging";
import { getApp, getApps, initializeApp } from "firebase/app";
import { firebaseConfig } from "@/firebase/firebase";
import {
  sendTokenToBackend,
  removeFcmToken as removeFcmTokenUtil,
} from "@/utils/fcm";
import {
  getFcmTokenCookie,
  setFcmTokenCookie,
} from "@/utils/authCookies";

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export const useFcmToken = () => {
  const [fcmToken, setFcmToken] = useState(getFcmTokenCookie());

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const permission = await Notification.requestPermission();

        if (permission !== "granted") {
          console.warn("🚫 Notification permission not granted:", permission);
          return;
        }

        const currentToken = await getToken(messaging, {
          vapidKey: import.meta.env.VITE_FCM_VAPID_KEY,
        });

        if (currentToken) {
          const storedToken = getFcmTokenCookie();
          if (currentToken !== storedToken) {
            setFcmTokenCookie(currentToken);
            setFcmToken(currentToken);
            await sendTokenToBackend(currentToken);
          } else {
            // refresh cookie expiry
            setFcmTokenCookie(currentToken);
            setFcmToken(currentToken);
          }
        } else {
          console.warn("⚠️ Tidak ada token FCM");
        }
      } catch (err) {
        console.error("🚨 Error ambil token FCM:", err);
      }
    };

    fetchToken();
  }, []);

  const removeFcmToken = async () => {
    try {
      const removed = await removeFcmTokenUtil();
      if (removed) {
        setFcmToken(null);
        console.log("🗑️ Token FCM berhasil dihapus");
      }
    } catch (err) {
      console.error("❌ Gagal hapus token FCM:", err);
    }
  };

  return { fcmToken, removeFcmToken };
};
