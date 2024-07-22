import { axiosConfig } from "../config";

export const getRoleMenusAll = async (data) => {
  try {
    let response = await axiosConfig.get("/auth/rolemenus/", {
      params: data,
    });
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const AddRoleMenus = async (data) => {
  try {
    let response = await axiosConfig.post("/auth/rolemenus/", data);
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const EditRoleMenus = async (id, data) => {
  try {
    let response = await axiosConfig.put("/auth/rolemenus/" + id + "/", data);
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const DeleteRoleMenus = async (id) => {
  try {
    let response = await axiosConfig.delete("/auth/rolemenus/" + id + "/");
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};
