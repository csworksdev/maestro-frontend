import { axiosAccessMutationConfig } from "../config";

const JOB_BASE_URL = "/api/career/jobs/";
const DEPARTMENT_BASE_URL = "/api/departments/";
const BRANCH_BASE_URL = "/api/branch/";

export const getJobsAll = async (params, config = {}) => {
  const response = await axiosAccessMutationConfig.get(JOB_BASE_URL, {
    params,
    ...config,
  });
  return response;
};

export const getJobById = async (jobId) => {
  const response = await axiosAccessMutationConfig.get(`${JOB_BASE_URL}${jobId}/`);
  return response;
};

export const AddJob = async (data) => {
  const response = await axiosAccessMutationConfig.post(JOB_BASE_URL, data);
  return response;
};

export const EditJob = async (jobId, data) => {
  const response = await axiosAccessMutationConfig.put(
    `${JOB_BASE_URL}${jobId}/`,
    data,
  );
  return response;
};

export const DeleteJob = async (jobId) => {
  const response = await axiosAccessMutationConfig.delete(`${JOB_BASE_URL}${jobId}/`);
  return response;
};

export const UpdateJobStatus = async (jobId, status) => {
  const response = await axiosAccessMutationConfig.put(
    `${JOB_BASE_URL}${jobId}/status/`,
    { status },
  );
  return response;
};

export const getJobDepartmentsAll = async (params, config = {}) => {
  const response = await axiosAccessMutationConfig.get(DEPARTMENT_BASE_URL, {
    params,
    ...config,
  });
  return response;
};

export const getJobBranchesAll = async (params, config = {}) => {
  const response = await axiosAccessMutationConfig.get(BRANCH_BASE_URL, {
    params,
    ...config,
  });
  return response;
};
