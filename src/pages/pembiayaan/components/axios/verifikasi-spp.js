import { axiosConfig } from "./axios";

export const getVerifikasiSPP = async () => {
  try {
    let response = await axiosConfig.get("/SPP/verif");
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const getSPPTerverifikasi = async () => {
  try {
    let response = await axiosConfig.get("/SPP/terverif");
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};
