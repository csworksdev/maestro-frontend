import { axiosConfig } from "../config";

export const getRolesAll = async (data) => {
  try {
    let response = await axiosConfig.get("/auth/roles/", {
      params: data,
    });
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const AddRoles = async (data) => {
  try {
    let response = await axiosConfig.post("/auth/roles/", data);
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const EditRoles = async (id, data) => {
  try {
    let response = await axiosConfig.put("/auth/roles/" + id + "/", data);
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const DeleteRoles = async (id) => {
  try {
    let response = await axiosConfig.delete("/auth/roles/" + id + "/");
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};
