import { useEffect, useState } from "react";
import { getToken } from "firebase/messaging";
import { getMessagingInstance } from "@/firebase/firebase";
import {
  sendTokenToBackend,
  removeFcmToken as removeFcmTokenUtil,
  requestNotificationPermissionSafely,
} from "@/utils/fcm";
import {
  getFcmTokenCookie,
  setFcmTokenCookie,
} from "@/utils/authCookies";

export const useFcmToken = () => {
  const [fcmToken, setFcmToken] = useState(getFcmTokenCookie());

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const messaging = await getMessagingInstance();
        if (!messaging) {
          console.warn(
            "[FCM] Browser ini tidak mendukung push notification web."
          );
          return;
        }

        const permission = await requestNotificationPermissionSafely();

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
