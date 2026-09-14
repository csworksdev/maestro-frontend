import { axiosAccessMutationConfig } from "../config";

const APPLICATION_BASE_URL = "/api/career/applications/";

export const getApplicationsAll = async (params, config = {}) => {
  const response = await axiosAccessMutationConfig.get(APPLICATION_BASE_URL, {
    params,
    ...config,
  });
  return response;
};

export const getApplicationById = async (applicationId) => {
  const response = await axiosAccessMutationConfig.get(
    `${APPLICATION_BASE_URL}${applicationId}/`,
  );
  return response;
};

export const startApplicationProcess = async (
  applicationId,
  { notes } = {},
) => {
  const payload = notes?.trim() ? { notes: notes.trim() } : {};
  const response = await axiosAccessMutationConfig.post(
    `${APPLICATION_BASE_URL}${applicationId}/start/`,
    payload,
  );
  return response;
};

export const submitApplicationDecision = async (
  applicationId,
  { stageId, status, notes } = {},
) => {
  const response = await axiosAccessMutationConfig.post(
    `${APPLICATION_BASE_URL}${applicationId}/stage-process/`,
    {
      stage_id: stageId,
      status,
      notes: notes || "",
    },
  );
  return response;
};
