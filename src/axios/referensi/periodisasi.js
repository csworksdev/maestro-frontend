import { axiosConfig } from "../config";

export const getPeriodisasiAll = async (data) => {
  try {
    let response = await axiosConfig.get("/api/periodisasi/", {
      params: data,
    });
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const AddPeriodisasi = async (data) => {
  try {
    let response = await axiosConfig.post("/api/periodisasi/", data);
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const EditPeriodisasi = async (id, data) => {
  try {
    let response = await axiosConfig.put("/api/periodisasi/" + id + "/", data);
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const DeletePeriodisasi = async (id) => {
  try {
    let response = await axiosConfig.delete("/api/periodisasi/" + id + "/");
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};
