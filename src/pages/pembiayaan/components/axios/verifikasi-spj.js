import { axiosConfig } from "./axios";

export const getVerifikasiSPJ = async () => {
  try {
    let response = await axiosConfig.get("/SPJ/verif");
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const getSPJTerverifikasi = async () => {
  try {
    let response = await axiosConfig.get("/SPJ/terverifikasi");
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};
