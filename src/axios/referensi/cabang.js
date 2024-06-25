import { axiosConfig } from "../config";

export const getCabangAll = async () => {
  try {
    let response = await axiosConfig.get("/api/branch/");
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const AddCabang = async (data) => {
  try {
    let response = await axiosConfig.post("/api/branch/", data);
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const EditCabang = async (id, data) => {
  try {
    let response = await axiosConfig.put("/api/branch/" + id + "/", data);
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const DeleteCabang = async (id) => {
  try {
    let response = await axiosConfig.delete("/api/branch/" + id + "/");
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};
