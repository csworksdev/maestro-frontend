import { axiosConfig } from "../config";

export const CJGetPool = async (id) => {
  try {
    let response = await axiosConfig.delete(
      "/api/cekjadwal/getpool/" + id + "/"
    );
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};
