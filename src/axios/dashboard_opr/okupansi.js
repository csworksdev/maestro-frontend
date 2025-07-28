import { axiosConfig } from "../config";

export const getOkupansiBranch = async () => {
  try {
    let response = await axiosConfig.get("/report/okupansi/");
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};
