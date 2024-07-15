import { axiosConfig } from "../config";

export const getPaketAll = async (data) => {
  try {
    let response = await axiosConfig.get("/api/package/", {
      params: data,
    });
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};
export const getPaketByProduct = async (product_id) => {
  try {
    let response = await axiosConfig.get("/api/package/", product_id, "/");
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const AddPaket = async (data) => {
  try {
    let response = await axiosConfig.post("/api/package/", data);
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const EditPaket = async (id, data) => {
  try {
    let response = await axiosConfig.put("/api/package/" + id + "/", data);
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const DeletePaket = async (id) => {
  try {
    let response = await axiosConfig.delete("/api/package/" + id + "/");
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};
