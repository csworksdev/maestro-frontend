import { axiosConfig } from "../config";

export const GetTrainerScheduleV2 = async (id) => {
  try {
    let response = await axiosConfig.get(
      "/api/trainer-schedule/v2/" + id + "/"
    );
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const AddTrainerScheduleV2 = async (id, data) => {
  try {
    let response = await axiosConfig.post(
      "/api/trainer-schedule/v2/" + id + "/",
      data
    );
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const EditTrainerScheduleV2 = async (id, data) => {
  try {
    let response = await axiosConfig.put(
      "/api/trainer-schedule/v2/" + id + "/",
      data
    );
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const DeleteTrainerScheduleV2 = async (id, data) => {
  try {
    let response = await axiosConfig.delete(
      "/api/trainer-schedule/v2/" + id + "/",
      {
        data: data,
      }
    );
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};
