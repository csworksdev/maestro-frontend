import { axiosConfig } from "./axios";

export const getLpjDibuat = async () => {
  try {
    let response = await axiosConfig.get("/lpj/buatlpj");
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const getlistLpj = async () => {
  try {
    let response = await axiosConfig.get("/lpj/lpj");
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};
