import { axiosConfig } from "./axios";

export const getLPJTerverifikasi = async () => {
  try {
    let response = await axiosConfig.get("/lpj/veriflpj");
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const getVerifikasiLPJ = async () => {
  try {
    let response = await axiosConfig.get("/lpj/lpjTerverif");
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};
