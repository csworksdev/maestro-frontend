import { axiosConfig } from "../config";

export const getMenusAll = async (data) => {
  try {
    let response = await axiosConfig.get("/auth/menus/", {
      params: data,
    });
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const AddMenus = async (data) => {
  try {
    let response = await axiosConfig.post("/auth/menus/", data);
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const EditMenus = async (id, data) => {
  try {
    let response = await axiosConfig.put("/auth/menus/" + id + "/", data);
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const DeleteMenus = async (id) => {
  try {
    let response = await axiosConfig.delete("/auth/menus/" + id + "/");
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};
