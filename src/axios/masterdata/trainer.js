import { axiosConfig } from "../config";

export const getTrainerAll = async () => {
  try {
    let response = await axiosConfig.get("/trainer/");
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const AddTrainer = async (data) => {
  try {
    let response = await axiosConfig.post("/trainer/", data);
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const EditTrainer = async (id, data) => {
  try {
    let response = await axiosConfig.put("/trainer/" + id + "/", data);
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const DeleteTrainer = async (id) => {
  try {
    let response = await axiosConfig.delete("/trainer/" + id + "/");
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};
