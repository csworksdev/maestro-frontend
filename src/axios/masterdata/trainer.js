import { axiosConfig } from "../config";

const TRAINER_DOCUMENT_BASE_URL =
  "https://woven-affecting-accuracy.ngrok-free.dev";
const getTrainerDocumentUrl = (trainerId) => {
  const baseUrl = import.meta.env.DEV
    ? "/__trainer_documents_api"
    : TRAINER_DOCUMENT_BASE_URL;

  return `${baseUrl}/api/trainer/${encodeURIComponent(trainerId)}/documents/`;
};
const getTrainerDocumentDetailUrl = (trainerId, documentId) =>
  `${getTrainerDocumentUrl(trainerId)}${encodeURIComponent(documentId)}/`;
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

export const getTrainerDocuments = (trainerId, params = {}) =>
  axiosConfig.get(
    getTrainerDocumentUrl(trainerId),
    {
      ...trainerDocumentRequestConfig(),
      params,
    },
  );

const createTrainerDocumentFormData = (data) => {
  const formData = new FormData();
  formData.append("type", data.type);
  if (data.file) formData.append("file", data.file);
  formData.append("file_name", data.file_name || "");
  formData.append("document_number", data.document_number || "");
  formData.append("document_date", data.document_date || "");
  return formData;
};

export const createTrainerDocument = (trainerId, data) =>
  axiosConfig.post(
    getTrainerDocumentUrl(trainerId),
    createTrainerDocumentFormData(data),
    trainerDocumentRequestConfig(),
  );

export const getTrainerDocumentDetail = (trainerId, documentId) =>
  axiosConfig.get(
    getTrainerDocumentDetailUrl(trainerId, documentId),
    trainerDocumentRequestConfig(),
  );

export const updateTrainerDocument = (trainerId, documentId, data) =>
  axiosConfig.put(
    getTrainerDocumentDetailUrl(trainerId, documentId),
    createTrainerDocumentFormData(data),
    trainerDocumentRequestConfig(),
  );

export const deleteTrainerDocument = (trainerId, documentId) =>
  axiosConfig.delete(
    getTrainerDocumentDetailUrl(trainerId, documentId),
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
