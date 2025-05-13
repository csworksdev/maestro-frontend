import { axiosConfig } from "../config";

export const GetOrderScheduleV2 = async (id) => {
  try {
    let response = await axiosConfig.get("/api/orderschedule/" + id + "/");
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const GetOrderScheduleByOrderIDV2 = async (id) => {
  try {
    let response = await axiosConfig.get("/api/orderschedule/" + id + "/");
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const AddOrderScheduleV2 = async (data) => {
  try {
    let response = await axiosConfig.post("/api/orderschedule/", data);
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const EditOrderScheduleV2 = async (id, data) => {
  try {
    let response = await axiosConfig.put(
      "/api/orderschedule/" + id + "/",
      data
    );
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const DeleteOrderScheduleV2 = async (id, data) => {
  try {
    let response = await axiosConfig.delete("/api/orderschedule/" + id + "/", {
      data: data,
    });
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};
