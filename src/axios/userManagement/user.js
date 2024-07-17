import { axiosConfig } from "../config";

export const getUsersAll = async (data) => {
  try {
    let response = await axiosConfig.get("/auth/users/", {
      params: data,
    });
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const AddUsers = async (data) => {
  try {
    let response = await axiosConfig.post("/auth/users/register/", data);
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const EditUsers = async (id, data) => {
  try {
    let response = await axiosConfig.put("/auth/users/" + id + "/", data);
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const DeleteUsers = async (id) => {
  try {
    let response = await axiosConfig.delete("/auth/users/" + id + "/");
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};
