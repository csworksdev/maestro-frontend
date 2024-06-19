import { axiosConfig } from "../config";

export const getCabangAll = async () => {
  try {
    let response = await axiosConfig.get("/branch/");
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const AddCabang = async (data) => {
  try {
    let response = await axiosConfig.post("/branch/", data);
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const EditCabang = async (id, data) => {
  try {
    let response = await axiosConfig.put("/branch/" + id + "/", data);
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const DeleteCabang = async (id) => {
  try {
    let response = await axiosConfig.delete("/branch/" + id + "/");
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};
