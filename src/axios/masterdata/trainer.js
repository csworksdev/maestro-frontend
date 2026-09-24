import { axiosConfig } from "../config";

const TRAINER_DOCUMENT_BASE_URL =
  "https://woven-affecting-accuracy.ngrok-free.dev";
const getTrainerDocumentUrl = (trainerId) => {
  const baseUrl = import.meta.env.DEV
    ? "/__trainer_documents_api"
    : TRAINER_DOCUMENT_BASE_URL;

  return `${baseUrl}/api/trainer/${encodeURIComponent(trainerId)}/documents/`;
};
const trainerDocumentRequestConfig = () =>
  import.meta.env.DEV ? { baseURL: window.location.origin } : {};

export const getTrainerAll = async (data) => {
  try {
    let response = await axiosConfig.get("/api/trainer/", {
      params: data,
    });
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const getTrainerAllNew = async (data) => {
  try {
    let response = await axiosConfig.get("/api/trainer/new/", {
      params: data,
    });
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const AddTrainer = async (data) => {
  try {
    let response = await axiosConfig.post("/api/trainer/", data);
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const EditTrainer = async (id, data) => {
  try {
    let response = await axiosConfig.put("/api/trainer/" + id + "/", data);
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const DeleteTrainer = async (id) => {
  try {
    let response = await axiosConfig.delete("/api/trainer/" + id + "/");
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const getTrainerDocuments = (trainerId) =>
  axiosConfig.get(
    getTrainerDocumentUrl(trainerId),
    trainerDocumentRequestConfig(),
  );

export const uploadTrainerDocuments = (trainerId, files) => {
  const formData = new FormData();

  if (files.identityCard) {
    formData.append("identity_card", files.identityCard);
  }

  if (files.employmentContract) {
    formData.append("employment_contract", files.employmentContract);
  }

  files.sertificates.forEach((file) => {
    formData.append("sertificates", file);
  });

  return axiosConfig.post(
    getTrainerDocumentUrl(trainerId),
    formData,
    trainerDocumentRequestConfig(),
  );
};
