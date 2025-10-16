import { removeFcmToken } from "@/utils/fcm";
import { axiosConfig } from "../config";
import {
  AUTH_COOKIE_KEYS,
  clearAllCookies,
  getCookie,
} from "@/utils/authCookies";

export const login = async (data) => {
  try {
    let response = await axiosConfig.post("/auth/users/login/", data, {
      withCredentials: true,
    });
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const logout = async () => {
  try {
    const refreshToken = getCookie(AUTH_COOKIE_KEYS.refresh);
    let response = await axiosConfig.post("/auth/users/logout/", {
      refresh: refreshToken,
    });
    if (response) {
      try {
        await removeFcmToken();
      } catch (tokenError) {
        console.error("Failed to remove FCM token during logout:", tokenError);
      }
      // Clear user data from local storage
      localStorage.removeItem("presenceSelected");
      localStorage.removeItem("persist:notification");
      localStorage.removeItem("persist:loading");
      localStorage.removeItem("persist:layout");
      localStorage.removeItem("persist:auth");
      localStorage.removeItem("menuItems");
      clearAllCookies();
    }
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const register = async (data) => {
  try {
    let response = await axiosConfig.post("/auth/users/register/", data);
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};
