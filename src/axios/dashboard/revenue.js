import { axiosConfig } from "../config";
const prefix = "/dashboard";

export const getRevenueAll = async () => {
  try {
    let response = await axiosConfig.get(prefix + "/revenue/all/");
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};
