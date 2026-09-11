import { axiosAccessMutationConfig } from "../config";

const STAGE_BASE_URL = "/api/career/stages/";

export const getStagesByDepartment = async (departmentId, params, config = {}) => {
  const response = await axiosAccessMutationConfig.get(
    `${STAGE_BASE_URL}${departmentId}/`,
    { params, ...config },
  );
  return response;
};

export const addStage = async (departmentId, data) => {
  const response = await axiosAccessMutationConfig.post(
    `${STAGE_BASE_URL}${departmentId}/`,
    data,
  );
  return response;
};

export const getStageById = async (departmentId, stageId) => {
  const response = await axiosAccessMutationConfig.get(
    `${STAGE_BASE_URL}${departmentId}/${stageId}/`,
  );
  return response;
};

export const editStage = async (departmentId, stageId, data) => {
  const response = await axiosAccessMutationConfig.put(
    `${STAGE_BASE_URL}${departmentId}/${stageId}/`,
    data,
  );
  return response;
};

export const deleteStage = async (departmentId, stageId) => {
  const response = await axiosAccessMutationConfig.delete(
    `${STAGE_BASE_URL}${departmentId}/${stageId}/`,
  );
  return response;
};
