import { axiosConfig } from "../config";

export const getUserRolesAll = async (data) => {
  try {
    let response = await axiosConfig.get("/auth/userroles/", {
      params: data,
    });
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const AddUserRoles = async (data) => {
  try {
    let response = await axiosConfig.post("/auth/userroles/", data);
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const EditUserRoles = async (id, data) => {
  try {
    let response = await axiosConfig.put("/auth/userroles/" + id + "/", data);
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const DeleteUserRoles = async (id) => {
  try {
    let response = await axiosConfig.delete("/auth/userroles/" + id + "/");
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};
