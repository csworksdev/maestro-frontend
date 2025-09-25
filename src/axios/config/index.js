// axios/config.js
import axios from "axios";
import store from "@/redux/store"; // pastikan ini import store redux kamu

const baseURL = import.meta.env.VITE_API_URL;

// Helper ambil token
const getToken = () => {
  const state = store.getState();
  const access = state.auth?.access;
  if (access) return access;
  return localStorage.getItem("access_token"); // fallback
};

export const axiosConfig = axios.create({
  baseURL,
});

// Request interceptor → inject token
axiosConfig.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// refresh token
axiosConfig.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const state = store.getState();
        const refresh =
          state.auth?.refresh || localStorage.getItem("refresh_token");

        if (!refresh) {
          // kalau refresh kosong → logout
          store.dispatch({ type: "auth/logOut" });
          return Promise.reject(error);
        }

        // panggil endpoint refresh
        const res = await axios.post(`${baseURL}/auth/token/refresh/`, {
          refresh,
        });

        const newAccess = res.data.access;

        // simpan ke Redux
        store.dispatch({
          type: "auth/setUser",
          payload: {
            refresh,
            access: newAccess,
            data: state.auth.data,
          },
        });

        // update header request lama
        originalRequest.headers["Authorization"] = `Bearer ${newAccess}`;

        return axiosConfig(originalRequest);
      } catch (err) {
        store.dispatch({ type: "auth/logOut" });
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);
