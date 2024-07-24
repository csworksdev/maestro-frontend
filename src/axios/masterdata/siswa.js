import { axiosConfig } from "../config";

export const getSiswaAll = async (data) => {
  try {
    let response = await axiosConfig.get("/api/student/", {
      params: data,
    });
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const searchSiswa = async (data) => {
  try {
    let response = await axiosConfig.get("/api/student/", {
      params: data,
    });
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const getSiswaByProduk = async () => {
  try {
    let response = await axiosConfig.get("/api/studentbyproduk/");

    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const AddSiswa = async (data) => {
  try {
    let response = await axiosConfig.post("/api/student/", data);
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const EditSiswa = async (id, data) => {
  try {
    let response = await axiosConfig.put("/api/student/" + id + "/", data);
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const DeleteSiswa = async (id) => {
  try {
    let response = await axiosConfig.delete("/api/student/" + id + "/");
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};
