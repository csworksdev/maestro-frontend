// hooks/useFcmToken.js
import { useEffect, useState } from "react";
import { getMessaging, getToken, deleteToken } from "firebase/messaging";
import { initializeApp } from "firebase/app";
import { firebaseConfig } from "@/firebase/firebase";
import { axiosConfig } from "@/axios/config";

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export const useFcmToken = () => {
  const [fcmToken, setFcmToken] = useState(localStorage.getItem("fcm_token"));

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
          if (currentToken !== localStorage.getItem("fcm_token")) {
            localStorage.setItem("fcm_token", currentToken);
            setFcmToken(currentToken);
            await sendTokenToBackend(currentToken);
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
      const token = localStorage.getItem("fcm_token");
      if (token) {
        await deleteToken(messaging);
        await axiosConfig.post("/api/notifikasi/remove-token/", { token });
        localStorage.removeItem("fcm_token");
        setFcmToken(null);
        console.log("🗑️ Token FCM berhasil dihapus");
      }
    } catch (err) {
      console.error("❌ Gagal hapus token FCM:", err);
    }
  };

  return { fcmToken, removeFcmToken };
};

// helper kirim token
const sendTokenToBackend = async (token) => {
  try {
    await axiosConfig.post("/api/notifikasi/save-token/", {
      token,
      device_type: "web",
    });
    console.log("✅ Token FCM dikirim ke backend");
  } catch (err) {
    console.error(
      "❌ Gagal kirim token ke backend:",
      err.response?.data || err.message
    );
  }
};
