import { axiosConfig } from "../config";

export const getKolamAll = async () => {
  try {
    let response = await axiosConfig.get("/pool/");
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const AddKolam = async (data) => {
  console.log(data);
  try {
    let response = await axiosConfig.post("/pool/", data);
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const EditKolam = async (id, data) => {
  try {
    let response = await axiosConfig.put("/pool/" + id + "/", data);
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const DeleteKolam = async (id) => {
  try {
    let response = await axiosConfig.delete("/pool/" + id + "/");
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};
