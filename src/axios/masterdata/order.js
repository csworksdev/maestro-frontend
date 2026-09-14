import { axiosConfig } from "../config";

const ORDER_API_PREFIX = "/api";

export const getOrderAll = async (data) => {
  try {
    let response = await axiosConfig.get(`${ORDER_API_PREFIX}/order/`, {
      params: data,
    });
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const getOrderById = async (id) => {
  try {
    let response = await axiosConfig.get(`${ORDER_API_PREFIX}/order/${id}/`);
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};
export const migrasiOrderById = async (orderId, key, value, meet) => {
  try {
    const body = { order_id: orderId, key, value };
    if (meet !== undefined && meet !== null) body.meet = meet;
    let response = await axiosConfig.put(
      `${ORDER_API_PREFIX}/order/migrasi/`,
      body,
    );
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const getOrderExpired = async (data) => {
  try {
    let response = await axiosConfig.get(`${ORDER_API_PREFIX}/order/expired/`, {
      params: data,
    });
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const FindAvailableTrainer = async (data) => {
  try {
    let response = await axiosConfig.get(
      `${ORDER_API_PREFIX}/orderfindtrainer/`,
      {
        params: data,
      },
    );
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};
export const AddOrder = async (data) => {
  try {
    let response = await axiosConfig.post(`${ORDER_API_PREFIX}/order/`, data);
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const EditOrder = async (id, data) => {
  try {
    let response = await axiosConfig.put(
      `${ORDER_API_PREFIX}/order/${id}/`,
      data,
    );
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const DeleteOrder = async (id) => {
  try {
    const response = await axiosConfig.delete(
      `${ORDER_API_PREFIX}/order/${id}/`,
    );
    return response;
  } catch (error) {
    console.error("Error deleting order:", error);
    return { status: "error", message: error.message };
  }
};

export const PerpanjangOrder = async (id, order_date) => {
  try {
    const response = await axiosConfig.post(
      `${ORDER_API_PREFIX}/order/${id}/perpanjang/`,
      {
        order_date: order_date,
      },
    );
    return response;
  } catch (error) {
    console.error("Error deleting order:", error);
    return { status: "error", message: error.message };
  }
};

export const getOrderFrequency = async (orderId) => {
  try {
    return await axiosConfig.get(
      `${ORDER_API_PREFIX}/order/${orderId}/frequency/`,
    );
  } catch (error) {
    console.error("Error fetching order frequency:", error);
    throw error;
  }
};

export const updateOrderFrequency = async (orderId, data) => {
  try {
    return await axiosConfig.post(
      `${ORDER_API_PREFIX}/order/${orderId}/frequency/`,
      data,
    );
  } catch (error) {
    console.error("Error updating order frequency:", error);
    throw error;
  }
};

export const SettleOrder = async (orderId) => {
  try {
    return await axiosConfig.post(
      `${ORDER_API_PREFIX}/order/${orderId}/settled/`,
    );
  } catch (error) {
    console.error("Error settling order:", error);
    throw error;
  }
};
