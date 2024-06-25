import { axiosConfig } from "../config";

export const getProdukAll = async () => {
  try {
    let response = await axiosConfig.get("/api/product/");
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};
export const getProdukPool = async (id) => {
  try {
    let response = await axiosConfig.get("/api/productpool/" + id + "/");
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const AddProduk = async (data) => {
  try {
    let response = await axiosConfig.post("/api/product/", data);
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const EditProduk = async (id, data) => {
  try {
    let response = await axiosConfig.put("/api/product/" + id + "/", data);
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const DeleteProduk = async (id) => {
  try {
    let response = await axiosConfig.delete("/api/product/" + id + "/");
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};
