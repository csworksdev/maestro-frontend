import { axiosConfig } from "./axios";

export const getLpjDisahkan = async () => {
  try {
    let response = await axiosConfig.get("/lpj/disahkan");
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const getListPengesahanLpj = async () => {
  try {
    let response = await axiosConfig.get("/lpj/pengesahan");
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};
