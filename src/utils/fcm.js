import { getMessaging, getToken, deleteToken } from "firebase/messaging";
import { getApp, getApps, initializeApp } from "firebase/app";
import { firebaseConfig } from "@/firebase/firebase";
import { axiosConfig } from "@/axios/config";
import {
  deleteFcmTokenCookie,
  getFcmTokenCookie,
  setFcmTokenCookie,
} from "@/utils/authCookies";

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// ✅ Cek permission dulu
export const requestAndSendToken = async (onTokenSaved) => {
  const permission = await Notification.requestPermission();

  if (permission === "granted") {
    try {
      const currentToken = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_FCM_VAPID_KEY,
      });

      if (currentToken) {
        const tokenHandler =
          typeof onTokenSaved === "function"
            ? onTokenSaved
            : async (tokenValue) => {
                await sendTokenToBackend(tokenValue);
              };

        const existingToken = getFcmTokenCookie();
        if (existingToken !== currentToken) {
          setFcmTokenCookie(currentToken);
        } else {
          // refresh cookie expiry
          setFcmTokenCookie(currentToken);
        }

        await tokenHandler(currentToken);
        return currentToken;
      } else {
        console.warn("⚠️ Tidak ada token.");
      }
    } catch (err) {
      console.error("🚨 Error ambil token:", err);
    }
  } else {
    console.warn("🚫 Permission not granted:", permission);
  }

  return null;
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
  const token = getFcmTokenCookie();

  if (!token) {
    return false;
  }

  try {
    await deleteToken(messaging);
  } catch (firebaseError) {
    console.error("❌ Gagal hapus token dari Firebase:", firebaseError);
  }

  // try {
  //   await axiosConfig.delete("/api/notifikasi/remove-token/", {
  //     data: { token },
  //     headers: { "Content-Type": "application/json" },
  //   });
  // } catch (backendError) {
  //   console.error(
  //     "❌ Gagal hapus token FCM di backend:",
  //     backendError.response?.data || backendError.message
  //   );
  // }

  deleteFcmTokenCookie();
  return true;
};
