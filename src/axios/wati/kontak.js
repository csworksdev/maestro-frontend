import { axiosConfig } from "../config";

export const getKontakAll = async (data) => {
  try {
    let response = await axiosConfig.get("/wati/newcontact/", {
      params: data,
    });
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const EditKontak = async (id, data) => {
  try {
    let response = await axiosConfig.patch(
      "/wati/newcontact/" + id + "/",
      data
    );
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const batchEditKontak = async (ids, data) => {
  try {
    let response = await axiosConfig.patch(
      "/wati/newcontact/claim/",
      { ids, data } // ✅ kirim ids + data
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
};
