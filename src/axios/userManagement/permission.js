import { axiosConfig } from "../config";

export const getPermissionsAll = async (data) => {
  try {
    let response = await axiosConfig.get("/auth/permissions/", {
      params: data,
    });
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const AddPermissions = async (data) => {
  try {
    let response = await axiosConfig.post("/auth/permissions/", data);
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const EditPermissions = async (id, data) => {
  try {
    let response = await axiosConfig.put("/auth/permissions/" + id + "/", data);
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const DeletePermissions = async (id) => {
  try {
    let response = await axiosConfig.delete("/auth/permissions/" + id + "/");
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};
