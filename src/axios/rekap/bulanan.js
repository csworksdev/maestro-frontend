import { axiosConfig } from "../config";

export const getRekapByTrainer = async (periode, trainer_id) => {
  try {
    let response = await axiosConfig.get(
      "api/order-report-trainer/" + periode + "/" + trainer_id + "/"
    );
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const BayarPelatihByTrainer = async (trainer_id) => {
  try {
    let response = await axiosConfig.put("api/pay-trainer/", {
      order_detail_ids: trainer_id,
    });
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};
