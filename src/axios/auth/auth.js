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

export const logout = async (data) => {
  try {
    let response = await axiosConfig.post("/auth/users/logout/", data);
    removeFcmToken();
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
