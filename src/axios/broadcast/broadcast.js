import { axiosConfig } from "../config";

export const getBroadcast = async (params) => {
  try {
    let response = await axiosConfig.get("/api/broadcast/", { params });
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const BroadcastExport = async (params) => {
  try {
    const response = await axiosConfig.get("/api/broadcast/export/", {
      responseType: "blob", // Important!
      params,
    });

    const url = window.URL.createObjectURL(
      new Blob([response.data], { type: "text/csv" })
    );
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "student_broadcast.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};
