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

export const getOrderById = async (id) => {
  try {
    let response = await axiosConfig.get("/api/order/" + id + "/");
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};
export const migrasiOrderById = async (orderId, key, value) => {
  try {
    let response = await axiosConfig.put("/api/order/migrasi/", {
      order_id: orderId,
      key: key,
      value: value,
    });
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const getOrderExpired = async (data) => {
  try {
    let response = await axiosConfig.get("/api/order/expired/", {
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

export const PerpanjangOrder = async (id, order_date) => {
  try {
    const response = await axiosConfig.post(`/api/order/${id}/perpanjang/`, {
      order_date: order_date,
    });
    return response;
  } catch (error) {
    console.error("Error deleting order:", error);
    return { status: "error", message: error.message };
  }
};

export const getOrderFrequency = async (orderId) => {
  try {
    return await axiosConfig.get(`/api/order/${orderId}/frequency/`);
  } catch (error) {
    console.error("Error fetching order frequency:", error);
    throw error;
  }
};

export const updateOrderFrequency = async (orderId, data) => {
  try {
    return await axiosConfig.post(`/api/order/${orderId}/frequency/`, data);
  } catch (error) {
    console.error("Error updating order frequency:", error);
    throw error;
  }
};
