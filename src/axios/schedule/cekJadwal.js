import { axiosConfig } from "../config";

export const CJGetPool = async (id) => {
  try {
    let response = await axiosConfig.get("/api/cekjadwal/getpool/" + id + "/");
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const CJGetTrainer = async (id) => {
  try {
    let response = await axiosConfig.get(
      "/api/cekjadwal/gettrainer/" + id + "/"
    );
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const CJGetEmptySchedule = async (id) => {
  try {
    let response = await axiosConfig.get("/api/cekjadwal/getempty/" + id + "/");
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const CJGetBranchDay = async (branch_id, day) => {
  try {
    let response = await axiosConfig.get(
      "/api/cekjadwal/getschedule/?branch=" + branch_id + "&day=" + day
    );
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};
