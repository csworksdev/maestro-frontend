import { axiosConfig } from "../config";

export const getKolamAll = async (data) => {
  try {
    let response = await axiosConfig.get("/api/pool/", {
      params: data,
    });
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const AddKolam = async (data) => {
  try {
    let response = await axiosConfig.post("/api/pool/", data);
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const EditKolam = async (id, data) => {
  try {
    let response = await axiosConfig.put("/api/pool/" + id + "/", data);
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const DeleteKolam = async (id) => {
  try {
    let response = await axiosConfig.delete("/api/pool/" + id + "/");
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};
