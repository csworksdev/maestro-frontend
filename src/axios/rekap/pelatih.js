import { axiosConfig } from "../config";

export const getOrderByTrainer = async (params, trainer_id) => {
  try {
    let response = await axiosConfig.get(
      "/api/orderbytrainer/" + trainer_id + "/",
      params
    );
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};
