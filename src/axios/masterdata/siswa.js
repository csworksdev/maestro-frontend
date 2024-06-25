import { axiosConfig } from "../config";

export const getSiswaAll = async () => {
  try {
    let response = await axiosConfig.get("/student/");

    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const getSiswaByProduk = async () => {
  try {
    let response = await axiosConfig.get("/studentbyproduk/");

    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const AddSiswa = async (data) => {
  console.log(data);
  try {
    let response = await axiosConfig.post("/student/", data);
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const EditSiswa = async (id, data) => {
  try {
    let response = await axiosConfig.put("/student/" + id + "/", data);
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const DeleteSiswa = async (id) => {
  try {
    let response = await axiosConfig.delete("/student/" + id + "/");
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};
