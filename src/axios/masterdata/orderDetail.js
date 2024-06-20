import { axiosConfig } from "../config";

export const getOrderDetailAll = async () => {
  try {
    let response = await axiosConfig.get("/order/");
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const AddOrderDetail = async (data) => {
  try {
    let response = await axiosConfig.post("/order/", data);
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const EditOrderDetail = async (id, data) => {
  try {
    let response = await axiosConfig.put("/order/" + id + "/", data);
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const DeleteOrderDetail = async (id) => {
  try {
    let response = await axiosConfig.delete("/order/" + id + "/");
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};
