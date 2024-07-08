import { axiosConfig } from "../config";

export const getTrainerAll = async (data) => {
  try {
    let response = await axiosConfig.get("/api/trainer/", {
      params: data,
    });
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const AddTrainer = async (data) => {
  try {
    let response = await axiosConfig.post("/api/trainer/", data);
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const EditTrainer = async (id, data) => {
  try {
    let response = await axiosConfig.put("/api/trainer/" + id + "/", data);
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const DeleteTrainer = async (id) => {
  try {
    let response = await axiosConfig.delete("/api/trainer/" + id + "/");
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};
