import { axiosConfig } from "../config";

export const getOrderDetailAll = async (data) => {
  try {
    let response = await axiosConfig.get("/orderdetail/", {
      params: data,
    });
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};
export const getOrderDetailByParent = async (id) => {
  try {
    let response = await axiosConfig.get("/api/orderdetail/" + id + "/");
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const AddOrderDetail = async (data) => {
  try {
    let response = await axiosConfig.post("/api/orderdetail/", data);
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const EditOrderDetail = async (id, data) => {
  try {
    let response = await axiosConfig.put("/api/orderdetail/" + id + "/", data);
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const DeleteOrderDetail = async (id) => {
  try {
    let response = await axiosConfig.delete("/api/orderdetail/" + id + "/");
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const EditOrderDetailByOrderId = async (id, data) => {
  try {
    let response = await axiosConfig.put(
      "/api/orderdetailbyorderid/" + id + "/",
      data
    );
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};
