import { axiosConfig } from "../config";

export const getOrderByTrainer = async (id, data) => {
  try {
    let response = await axiosConfig.get("/api/orderbytrainer/" + id + "/", {
      params: data,
    });
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};
