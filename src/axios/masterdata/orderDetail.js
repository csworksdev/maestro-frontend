import { axiosConfig } from "../config";

export const getOrderDetailAll = async () => {
  try {
    let response = await axiosConfig.get("/orderdetail/");
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};
export const getOrderDetailByParent = async (id) => {
  try {
    let response = await axiosConfig.get("/orderdetail/" + id + "/");
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const AddOrderDetail = async (data) => {
  try {
    let response = await axiosConfig.post("/orderdetail/", data);
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const EditOrderDetail = async (id, data) => {
  try {
    let response = await axiosConfig.put("/orderdetail/" + id + "/", data);
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const DeleteOrderDetail = async (id) => {
  try {
    let response = await axiosConfig.delete("/orderdetail/" + id + "/");
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};
