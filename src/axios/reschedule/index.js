import { axiosConfig } from "../config";

export const getRescheduleAllOpx = async (params = {}) => {
  try {
    let response = await axiosConfig.get("/opx/reschedules/", {
      params,
    });
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const approveRescheduleOpx = async (id, data) => {
  try {
    const response = await axiosConfig.put(`/opx/reschedules/${id}/`, data);
    return response;
  } catch (error) {
    console.error("Error approving reschedule:", error);
    throw error;
  }
};
