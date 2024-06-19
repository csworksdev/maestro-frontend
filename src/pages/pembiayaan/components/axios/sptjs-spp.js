import { axiosConfig } from "./axios";

export const getPembuatanSPP = async () => {
  try {
    let response = await axiosConfig.get("/sptjmspp/buat");
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const getListSPP = async () => {
  try {
    let response = await axiosConfig.get("/sptjm/spp");
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};
