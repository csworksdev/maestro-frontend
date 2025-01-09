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

export const ExportRekapBulanan = async (periode) => {
  try {
    let response = await axiosConfig.get("api/order-report/" + periode + "/", {
      responseType: "blob", // Important for handling binary data
      headers: {
        "Content-Type": "application/vnd.ms-excel", // Optional, depends on API
      },
    });

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
