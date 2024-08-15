import { axiosConfig } from "../config";

export const getNewProdukPool = async (data) => {
  try {
    let response = await axiosConfig.get("/api/newproductallpool/", {
      params: data,
    });
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const AddNewProdukPool = async (data) => {
  try {
    let response = await axiosConfig.post("/api/newproductpool/", data);
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const EditNewProdukPool = async (id, data) => {
  try {
    let response = await axiosConfig.put(
      "/api/newproductperpool/" + id + "/",
      data
    );
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const DeleteNewProdukPool = async (id) => {
  try {
    let response = await axiosConfig.delete("/api/newproductpool/" + id + "/");
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};
