import { getToken, deleteToken } from "firebase/messaging";
import { getMessagingInstance } from "@/firebase/firebase";
import { axiosConfig } from "@/axios/config";
import {
  deleteFcmTokenCookie,
  getFcmTokenCookie,
  setFcmTokenCookie,
} from "@/utils/authCookies";

const needsUserActivation = () =>
  typeof navigator !== "undefined" &&
  !!navigator.userActivation &&
  navigator.userActivation.isActive === false;

export const requestNotificationPermissionSafely = async () => {
  if (typeof Notification === "undefined") {
    console.warn("[FCM] Notification API tidak tersedia di browser.");
    return "denied";
  }

  if (Notification.permission === "granted") {
    return "granted";
  }

  if (
    Notification.permission === "default" &&
    needsUserActivation()
  ) {
    console.warn(
      "[FCM] Browser memerlukan interaksi user (klik/tap) sebelum memunculkan prompt notifikasi."
    );
    return "default";
  }

  try {
    return await Notification.requestPermission();
  } catch (err) {
    console.error("[FCM] Gagal meminta izin notifikasi:", err);
    return "denied";
  }
};

// ✅ Cek permission dulu
export const requestAndSendToken = async (onTokenSaved) => {
  const messaging = await getMessagingInstance();
  if (!messaging) {
    console.warn("[FCM] Browser ini tidak mendukung push notification web.");
    return null;
  }

  const permission = await requestNotificationPermissionSafely();

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
    const messaging = await getMessagingInstance();
    if (messaging) {
      await deleteToken(messaging);
    }
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
