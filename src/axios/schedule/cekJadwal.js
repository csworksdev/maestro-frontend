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

export const CJGetBranchDay = async (selectedBranch, poolName, dayName) => {
  try {
    let response = await axiosConfig.get(
      "/api/cekjadwal/getschedule/?branch=" +
        selectedBranch +
        "&pool=" +
        poolName +
        "&day=" +
        dayName
    );
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};
