import axios from "axios";

export const axiosConfig = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});
