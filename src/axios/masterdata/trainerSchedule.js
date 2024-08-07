import { axiosConfig } from "../config";

export const getTrainerScheduleAll = async () => {
  try {
    let response = await axiosConfig.get("/api/trainer-schedule/", {
      params: data,
    });
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};
export const getTrainerScheduleByTrainer = async (id) => {
  try {
    let response = await axiosConfig.get("/api/trainer-schedule/" + id + "/");
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const AddTrainerSchedule = async (data) => {
  try {
    let response = await axiosConfig.post("/api/trainer-schedule/", data);
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const EditTrainerSchedule = async (id, data) => {
  try {
    let response = await axiosConfig.put(
      "/api/trainer-schedule/" + id + "/",
      data
    );
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const DeleteTrainerSchedule = async (id) => {
  try {
    let response = await axiosConfig.delete(
      "/api/trainer-schedule/" + id + "/"
    );
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const UpdateTrainerSchedule = async (data) => {
  try {
    let response = await axiosConfig.put("/api/traineravailupdate/", data);
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};
