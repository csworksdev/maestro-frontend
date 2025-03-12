import { axiosConfig } from "../config";

export const getTrainerPoolAll = async (data) => {
  try {
    let response = await axiosConfig.get("/api/trainer-pool/", {
      params: data,
    });
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const GetTrainerPool = async (id) => {
  try {
    let response = await axiosConfig.get("/api/trainer-pool/" + id + "/");
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const AddTrainerPool = async (id, data) => {
  try {
    let response = await axiosConfig.post(
      "/api/trainer-pool/" + id + "/",
      data
    );
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const EditTrainerPool = async (id, data) => {
  try {
    let response = await axiosConfig.put("/api/trainer-pool/" + id + "/", data);
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const DeleteTrainerPool = async (id, data) => {
  try {
    let response = await axiosConfig.delete("/api/trainer-pool/" + id + "/", {
      data: data,
    });
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};
