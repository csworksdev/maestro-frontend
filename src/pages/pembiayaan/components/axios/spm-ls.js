import { axiosConfig } from "./axios";

export const getSpmDibuat = async () => {
  try {
    let response = await axiosConfig.get("/spm/buat");
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};
export const getSpmDiterima = async () => {
  try {
    let response = axiosConfig.get("/spm/diterima");
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};
export const getSpmDitolak = async () => {
  try {
    let response = axiosConfig.get("/spm/tolak");
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};
export const getSpmBatal = async () => {
  try {
    let response = axiosConfig.get("/spm/batal");
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const getSpmList = async () => {
    try {
      let response = axiosConfig.get("/spm/ls");
      return response;
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };
