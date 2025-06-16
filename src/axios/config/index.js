import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { logOut } from "@/store/api/auth/authSlice";
import { removeFcmToken } from "@/utils/fcm";
// Use a single env variable – set per environment
const baseURL = import.meta.env.VITE_API_URL;

export const axiosConfig = axios.create({
  baseURL,
});

export const setupInterceptors = () => {
  const dispatch = useDispatch();
  const { data, access } = useSelector((state) => state.auth);
  const { user_name } = data || {};
  const bearer = access || sessionStorage.getItem("access");

  axiosConfig.interceptors.request.use(
    async (config) => {
      const token = localStorage.getItem("access_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      if (user_name === "testuser") {
        // await removeFcmToken();
        dispatch(logOut());
        return Promise.reject("Logged out due to restricted username");
      }

      if (!config.url.includes("/auth/users/login/") && bearer) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${bearer}`,
        };
      }

      return config;
    },
    (error) => Promise.reject(error)
  );
};
