import { axiosConfig } from "../config";

export const getEarningAll = async () => {
  try {
    let response = await axiosConfig.get("/api/earning/");
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};
export const getEarningById = async (trainer_id) => {
  try {
    let response = await axiosConfig.get("/api/earning/" + trainer_id + "/");
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};
