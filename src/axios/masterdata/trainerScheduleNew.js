import { axiosConfig } from "../config";

export const getTrainerScheduleAllNew = async () => {
  try {
    let response = await axiosConfig.get("/api/trainer-schedule-new/", {
      params: data,
    });
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};
export const getTrainerScheduleByTrainerNew = async (id) => {
  try {
    let response = await axiosConfig.get(
      "/api/trainer-schedule-new/" + id + "/"
    );
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const AddTrainerScheduleNew = async (data) => {
  try {
    let response = await axiosConfig.post("/api/trainer-schedule-new/", data);
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const EditTrainerScheduleNew = async (id, data) => {
  try {
    let response = await axiosConfig.put(
      "/api/trainer-schedule-new/" + id + "/",
      data
    );
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const DeleteTrainerScheduleNew = async (id) => {
  try {
    let response = await axiosConfig.delete(
      "/api/trainer-schedule-new/" + id + "/"
    );
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const UpdateTrainerScheduleNew = async (data) => {
  try {
    let response = await axiosConfig.put("/api/traineravailupdate/", data);
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};
