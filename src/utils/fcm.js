import {
  getMessaging,
  getToken,
  onMessage,
  deleteToken,
} from "firebase/messaging";
import { initializeApp } from "firebase/app";
import { firebaseConfig } from "../../src/firebase/firebase";
import { axiosConfig } from "@/axios/config";

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// ✅ Cek permission dulu
export const requestAndSendToken = async () => {
  const permission = await Notification.requestPermission();

  if (permission === "granted") {
    try {
      const currentToken = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_FCM_VAPID_KEY,
      });

      if (currentToken) {
        console.log("🎯 Token berhasil:", currentToken);
        // Kirim ke backend di sini
        if (localStorage.getItem("fcm_token") !== currentToken) {
          sendTokenToBackend(currentToken);
          localStorage.setItem("fcm_token", currentToken);
        }
        sendTokenToBackend(currentToken);
      } else {
        console.warn("⚠️ Tidak ada token.");
      }
    } catch (err) {
      console.error("🚨 Error ambil token:", err);
    }
  } else {
    console.warn("🚫 Permission not granted:", permission);
  }
};

export const sendTokenToBackend = async (fcmToken) => {
  try {
    await axiosConfig.post("/api/notifikasi/save-token/", {
      token: fcmToken,
      device_type: "web",
    });
    console.log("✅ Token FCM dikirim ke backend");
  } catch (err) {
    console.error(
      "❌ Gagal kirim token FCM ke backend:",
      err.response?.data || err.message
    );
  }
};

// 👇 Fungsi bantu untuk hapus token dari Firebase dan server
export const removeFcmToken = async () => {
  try {
    const token = await localStorage.getItem("fcm_token");

    if (token) {
      // Hapus dari Firebase
      await deleteToken(messaging);
      console.log("🗑️ Token FCM berhasil dihapus dari Firebase");

      // Hapus dari backend
      await axiosConfig.post("/api/notifikasi/remove-token/", {
        token,
      });
      console.log("✅ Token FCM berhasil dihapus dari server");

      localStorage.removeItem("fcm_token");
    }
  } catch (error) {
    console.error("❌ Gagal hapus FCM token:", error);
  }
};
