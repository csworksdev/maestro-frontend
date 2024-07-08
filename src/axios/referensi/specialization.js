import { axiosConfig } from "../config";

export const getSpecializationAll = async (data) => {
  try {
    let response = await axiosConfig.get("/api/spesialisasi/", {
      params: data,
    });
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const AddSpecialization = async (data) => {
  try {
    let response = await axiosConfig.post("/api/spesialisasi/", data);
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const EditSpecialization = async (id, data) => {
  try {
    let response = await axiosConfig.put("/api/spesialisasi/" + id + "/", data);
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const DeleteSpecialization = async (id) => {
  try {
    let response = await axiosConfig.delete("/api/spesialisasi/" + id + "/");
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};
