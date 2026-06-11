import { axiosConfig } from "../config";
import { getSubdomain } from "@/redux/slicers/subdomainSlice";

export const getOrderAll = async (data) => {
  try {
    let response = await axiosConfig.get(getSubdomain() + "/order/", {
      params: data,
    });
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const getOrderById = async (id) => {
  try {
    let response = await axiosConfig.get(getSubdomain() + "/order/" + id + "/");
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};
export const migrasiOrderById = async (orderId, key, value) => {
  try {
    let response = await axiosConfig.put(getSubdomain() + "/order/migrasi/", {
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
    let response = await axiosConfig.get(getSubdomain() + "/order/expired/", {
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
      getSubdomain() + "/orderfindtrainer/",
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
    let response = await axiosConfig.post(getSubdomain() + "/order/", data);
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const EditOrder = async (id, data) => {
  try {
    let response = await axiosConfig.put(
      getSubdomain() + "/order/" + id + "/",
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
      getSubdomain() + "/order/" + id + "/",
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
      getSubdomain() + "/order/" + id + "/perpanjang/",
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
      getSubdomain() + `/order/${orderId}/frequency/`,
    );
  } catch (error) {
    console.error("Error fetching order frequency:", error);
    throw error;
  }
};

export const updateOrderFrequency = async (orderId, data) => {
  try {
    return await axiosConfig.post(
      getSubdomain() + `/order/${orderId}/frequency/`,
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
      getSubdomain() + `/order/${orderId}/settled/`,
    );
  } catch (error) {
    console.error("Error settling order:", error);
    throw error;
  }
};
