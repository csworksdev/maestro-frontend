import { axiosConfig } from "../config";

export const getPaketAll = async () => {
  try {
    let response = await axiosConfig.get("/package/");
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const AddPaket = async (data) => {
  try {
    let response = await axiosConfig.post("/package/", data);
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const EditPaket = async (id, data) => {
  try {
    let response = await axiosConfig.put("/package/" + id + "/", data);
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const DeletePaket = async (id) => {
  try {
    let response = await axiosConfig.delete("/package/" + id + "/");
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};
