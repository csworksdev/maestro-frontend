import {axiosConfig} from "./axios";

export const getListSpj = async () => {
  try {
    let response = await axiosConfig.get("/spj/spj");
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};