import { axiosAccessMutationConfig } from "../config";

export const getPermissionsAll = async (data) => {
  try {
    let response = await axiosAccessMutationConfig.get("/auth/permissions/", {
      params: data,
    });
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const AddPermissions = async (data) => {
  try {
    let response = await axiosAccessMutationConfig.post("/auth/permissions/", data);
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const EditPermissions = async (id, data) => {
  try {
    let response = await axiosAccessMutationConfig.put(
      "/auth/permissions/" + id + "/",
      data,
    );
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const DeletePermissions = async (id) => {
  try {
    let response = await axiosAccessMutationConfig.delete(
      "/auth/permissions/" + id + "/",
    );
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};
