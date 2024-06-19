import { axiosConfig } from "./axios";

export const getSppDibuat = async () => {
  try {
    let response = await axiosConfig.get("/spp/buat");
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};
export const getSppDiterima = async () => {
  try {
    let response = axiosConfig.get("/spp/terima");
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};
export const getSppDitolak = async () => {
  try {
    let response = axiosConfig.get("/spp/tolak");
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};
export const getSppBatal = async () => {
  try {
    let response = axiosConfig.get("/spp/batal");
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};
