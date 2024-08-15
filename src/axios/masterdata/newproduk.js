import { axiosConfig } from "../config";

export const getNewProdukAll = async (data) => {
  try {
    let response = await axiosConfig.get("/api/newproduct/", {
      params: data,
    });
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const getNewProdukAllPool = async (data) => {
  try {
    let response = await axiosConfig.get("/api/newproductallpool/", {
      params: data,
    });
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const getNewProdukPerPool = async (id) => {
  try {
    let response = await axiosConfig.get("/api/newproductperpool/" + id + "/");
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};
export const getNewProdukPool = async (id) => {
  try {
    let response = await axiosConfig.get("/api/productpool/" + id + "/");
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const AddNewProduk = async (data) => {
  try {
    let response = await axiosConfig.post("/api/newproduct/", data);
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const EditNewProduk = async (id, data) => {
  try {
    let response = await axiosConfig.put("/api/newproduct/" + id + "/", data);
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const DeleteNewProduk = async (id) => {
  try {
    let response = await axiosConfig.delete("/api/newproduct/" + id + "/");
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};
