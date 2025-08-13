// axiosConfig.js
import Roles from "@/pages/usermanagement/role";
import { logOut } from "@/store/api/auth/authSlice";
import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL;

export const axiosConfig = axios.create({
  baseURL,
});

export const setupInterceptors = (dispatch, getState) => {
  axiosConfig.interceptors.request.use(
    async (config) => {
      const state = getState();
      const { data, access } = state.auth || {};
      const { roles, user_name } = data || {};
      const bearer = access || sessionStorage.getItem("access");

      console.log(roles);
      const token = localStorage.getItem("access_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      if (user_name === "testuser" || roles === "Trainer") {
        // await removeFcmToken();
        dispatch(logOut());
        return Promise.reject("Logged out due to restricted username");
      }

      if (!config.url.includes("/auth/users/login/") && bearer) {
        config.headers.Authorization = `Bearer ${bearer}`;
      }

      return config;
    },
    (error) => Promise.reject(error)
  );
};
