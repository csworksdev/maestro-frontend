import { axiosConfig } from "../config";

export const getReminderById = async (trainer_id, data) => {
  try {
    let response = await axiosConfig.get(
      "/api/course/reminder/" + trainer_id + "/",
      data
    );
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const getReminderAll = async (data) => {
  try {
    let response = await axiosConfig.get("/api/course/reminder/", data);
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};
