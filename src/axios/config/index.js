import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { logOut } from "@/store/api/auth/authSlice";
import Swal from "sweetalert2";

// const { bearer } =
//   useSelector((state) => state.auth.access) || sessionStorage.getItem("access");

export const axiosConfig = axios.create({
  // baseURL: import.meta.env.VITE_API_URL,
  // baseURL: "https://api.maestroswim.com/",
  baseURL: "http://127.0.0.1:8000/",
});

export const setupInterceptors = () => {
  const dispatch = useDispatch();
  const { user_name } = useSelector((state) => state.auth.data);
  axiosConfig.interceptors.request.use(
    (config) => {
      // If username is 'testuser', dispatch logout
      if (user_name === "testuser") {
        dispatch(logOut()); // Log out the user
        return Promise.reject("Logged out due to restricted username");
      }

      // if (!config.url.includes("login")) {
      //   // const { bearer } =
      //   //   useSelector((state) => state.auth.access) ||
      //   //   sessionStorage.getItem("access");
      //   config.headers = {
      //     Authorization: bearer,
      //   };
      // }

      return config;
    },
    (error) => Promise.reject(error)
  );
};
