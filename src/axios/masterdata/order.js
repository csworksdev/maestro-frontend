import { axiosConfig } from "../config";

export const getOrderAll = async (data) => {
  try {
    let response = await axiosConfig.get("/api/order/", {
      params: data,
    });
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const FindAvailableTrainer = async (data) => {
  try {
    let response = await axiosConfig.get("/api/orderfindtrainer/", {
      params: data,
    });
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
    const response = await axiosConfig.delete(`/api/order/${id}/`);
    return response;
  } catch (error) {
    console.error("Error deleting order:", error);
    return { status: "error", message: error.message };
  }
};
