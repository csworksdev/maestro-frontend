import { axiosConfig } from "./axios";

export const getPembuatanSPM = async () => {
  try {
    let response = await axiosConfig.get("/sptjmspm/buat");
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const getListSPM = async () => {
  try {
    let response = await axiosConfig.get("/sptjm/spm");
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};
