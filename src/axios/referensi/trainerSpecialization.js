import { axiosConfig } from "../config";

export const getTrainerSpecialization = async (trainer_id, params) => {
  try {
    let response = await axiosConfig.get(
      "/api/trainer-specialization/" + trainer_id + "/",
      { params }
    );
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const AddTrainerSpecialization = async (trainer_id, data) => {
  try {
    let response = await axiosConfig.post(
      "/api/trainer-specialization/" + trainer_id + "/",
      data
    );
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const EditTrainerSpecialization = async (trainer_id, data) => {
  try {
    let response = await axiosConfig.put(
      "/api/trainer-specialization/" + trainer_id + "/",
      data
    );
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const DeleteTrainerSpecialization = async (trainer_id) => {
  try {
    let response = await axiosConfig.delete(
      "/api/trainer-specialization/" + trainer_id + "/"
    );
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};
