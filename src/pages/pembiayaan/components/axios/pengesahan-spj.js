import { axiosConfig } from "./axios";

export const getSpjDisahkan = async () => {
  try {
    let response = await axiosConfig.get("/spj/disahkan");
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const getListPengesahanSpj = async () => {
  try {
    let response = await axiosConfig.get("/spj/pengesahan");
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};
