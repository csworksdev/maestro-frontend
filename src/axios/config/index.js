import axios from "axios";

export const axiosConfig = axios.create({
  // baseURL: import.meta.env.VITE_API_URL,
  // baseURL: "https://api.maestroswim.com/", //change to https
  baseURL: "http://127.0.0.1:8000/",
});
