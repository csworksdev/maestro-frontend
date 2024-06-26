import { axiosConfig } from "../config";

export const getOrderAll = async () => {
  try {
    let response = await axiosConfig.get("/api/order/");
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const AddOrder = async (data) => {
  try {
    let response = await axiosConfig.post("/api/order/", data);
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const EditOrder = async (id, data) => {
  try {
    let response = await axiosConfig.put("/api/order/" + id + "/", data);
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const DeleteOrder = async (id) => {
  try {
    let response = await axiosConfig.delete("/api/order/" + id + "/");
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};
