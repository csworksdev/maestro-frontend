import { axiosConfig } from "../config";

export const getCareerJobs = (params) => {
  return axiosConfig.get("/api/career/jobs/", { params });
};

export const getCareerJob = (id) => {
  return axiosConfig.get(`/api/career/jobs/${id}/`);
};

export const addCareerJob = (data) => {
  return axiosConfig.post("/api/career/jobs/", data);
};

export const editCareerJob = (id, data) => {
  return axiosConfig.put(`/api/career/jobs/${id}/`, data);
};

export const deleteCareerJob = (id) => {
  return axiosConfig.delete(`/api/career/jobs/${id}/`);
};

export const updateCareerJobStatus = (id, data) => {
  return axiosConfig.put(`/api/career/jobs/${id}/status/`, data);
};

export const getCareerDashboard = (params, options = {}) => {
  return axiosConfig.get("/api/career/dashboard/", { ...options, params });
};

export const getCareerDashboardJobs = (params, options = {}) => {
  return axiosConfig.get("/api/career/dashboard/jobs/", { ...options, params });
};

export const getCareerDashboardApplications = (params, options = {}) => {
  return axiosConfig.get("/api/career/dashboard/applications/", { ...options, params });
};

export const getCareerDashboardDepartments = (params, options = {}) => {
  return axiosConfig.get("/api/career/dashboard/departments/", { ...options, params });
};

export const getCareerDashboardBranches = (params, options = {}) => {
  return axiosConfig.get("/api/career/dashboard/branches/", { ...options, params });
};

export const getCareerApplications = (params) => {
  return axiosConfig.get("/api/career/applications/", { params });
};

export const getCareerApplication = (id) => {
  return axiosConfig.get(`/api/career/applications/${id}/`);
};

export const startCareerApplication = (id) => {
  return axiosConfig.post(`/api/career/applications/${id}/start/`);
};

export const processCareerApplicationStage = (id, data) => {
  return axiosConfig.post(`/api/career/applications/${id}/stage-process/`, data);
};

export const saveCareerApplicationStageCustomData = (
  applicationId,
  stageId,
  customData
) => {
  return axiosConfig.post(
    `/api/career/applications/${applicationId}/stages/${stageId}/custom-data/`,
    { custom_data: customData }
  );
};

export const startCareerApplications = (data) => {
  return axiosConfig.post("/api/career/applications/start-bulk/", data);
};

export const createCareerApplicationTrainer = (applicationId) => {
  return axiosConfig.post(
    `/api/career/applications/${applicationId}/create-trainer/`,
    { application_id: [applicationId] }
  );
};

export const createCareerApplicationTrainersBulk = (data) => {
  return axiosConfig.post(
    "/api/career/applications/create-trainer-bulk/",
    data
  );
};

export const getCareerStages = (departmentId, params) => {
  return axiosConfig.get(`/api/career/stages/${departmentId}/`, { params });
};

export const getCareerStage = (departmentId, stageId) => {
  return axiosConfig.get(`/api/career/stages/${departmentId}/${stageId}/`);
};

export const addCareerStage = (departmentId, data) => {
  return axiosConfig.post(`/api/career/stages/${departmentId}/`, data);
};

export const editCareerStage = (departmentId, stageId, data) => {
  return axiosConfig.put(`/api/career/stages/${departmentId}/${stageId}/`, data);
};

export const deleteCareerStage = (departmentId, stageId) => {
  return axiosConfig.delete(`/api/career/stages/${departmentId}/${stageId}/`);
};

export const getDepartments = (params, options = {}) => {
  return axiosConfig.get("/api/departments/", { ...options, params });
};

export const getBranches = (params, options = {}) => {
  return axiosConfig.get("/api/branch/", { ...options, params });
};
