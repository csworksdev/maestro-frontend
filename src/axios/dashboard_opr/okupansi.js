import { axiosConfig } from "../config";

export const getOkupansi = async () => {
  try {
    let response = await axiosConfig.get("/report/okupansi/");
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const getOkupansiBranch = async (branch_id) => {
  try {
    let response = await axiosConfig.get("/report/okupansi/" + branch_id);
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};
export const getOkupansiPool = async (pool_id) => {
  try {
    let response = await axiosConfig.get("/report/okupansi/pool/" + pool_id);
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};
