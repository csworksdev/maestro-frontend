import { axiosConfig } from "../config";

export const getOrderReportList = async (periode) => {
  try {
    const response = await axiosConfig.get(`api/order-report-list/${periode}/`);
    return response;
  } catch (error) {
    console.error("Error fetching order report list:", error);
    throw error;
  }
};

export const payTrainerAll = async (periode, trainer_id) => {
  try {
    const response = await axiosConfig.post(
      `api/pay-trainer-all/${periode}/${trainer_id}/`
    );
    return response;
  } catch (error) {
    console.error("Error paying trainer:", error);
    throw error;
  }
};
