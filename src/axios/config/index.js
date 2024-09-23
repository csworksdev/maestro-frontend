import axios from "axios";

export const axiosConfig = axios.create({
  // baseURL: import.meta.env.VITE_API_URL,
  baseURL: "https://34.50.65.227:8000/",
  // baseURL: "http://127.0.0.1:8000/",
});
