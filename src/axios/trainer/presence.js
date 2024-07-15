import { axiosConfig } from "../config";

export const getPresenceAll = async () => {
  try {
    let response = await axiosConfig.get("/api/presence/");
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};
export const getPresenceById = async (trainer_id) => {
  try {
    let response = await axiosConfig.get("/api/presence/" + trainer_id + "/");
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};
