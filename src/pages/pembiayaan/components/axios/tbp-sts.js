import { axiosConfig } from "./axios";

export const getTbpStsDibuat = async () => {
  try {
    let response = await axiosConfig.get("/tbpsts/buat");
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const getListSts = async () => {
  try {
    let response = await axiosConfig.get("/tbp-sts/sts");
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const getListTbp = async () => {
  try {
    let response = await axiosConfig.get("/tbp-sts/tbp");
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};
