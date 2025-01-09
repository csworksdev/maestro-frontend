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
    let response = await axiosConfig
      .get("api/order-report/" + periode + "/", {
        responseType: "blob", // Important for handling binary data
      })
      .then((response) => {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "rekapbulanan.xlsx"); // File name
        document.body.appendChild(link);
        link.click();
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
