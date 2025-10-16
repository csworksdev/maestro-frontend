import { removeFcmToken } from "@/utils/fcm";
import { axiosConfig } from "../config";

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
    let response = await axiosConfig.post("/auth/users/logout/", {
      request: localStorage.removeItem("refresh_token"),
    });
    if (response) {
      try {
        await removeFcmToken();
      } catch (tokenError) {
        console.error("Failed to remove FCM token during logout:", tokenError);
      }
      // Clear user data from local storage
      localStorage.removeItem("user_data");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("presenceSelected");
      localStorage.removeItem("persist:notification");
      localStorage.removeItem("persist:loading");
      localStorage.removeItem("persist:layout");
      localStorage.removeItem("persist:auth");
      localStorage.removeItem("menuItems");
      localStorage.removeItem("access_token");
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
