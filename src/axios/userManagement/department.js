import { axiosAccessMutationConfig } from "../config";

const DEPARTMENT_BASE_URL = "/api/departments/";

export const getDepartmentsAll = async (params, config = {}) => {
  const response = await axiosAccessMutationConfig.get(DEPARTMENT_BASE_URL, {
    params,
    ...config,
  });
  return response;
};

export const AddDepartment = async (data) => {
  const response = await axiosAccessMutationConfig.post(
    DEPARTMENT_BASE_URL,
    data,
  );
  return response;
};

export const EditDepartment = async (departmentId, data) => {
  const response = await axiosAccessMutationConfig.put(
    `${DEPARTMENT_BASE_URL}${departmentId}/`,
    data,
  );
  return response;
};

export const DeleteDepartment = async (departmentId) => {
  const response = await axiosAccessMutationConfig.delete(
    `${DEPARTMENT_BASE_URL}${departmentId}/`,
  );
  return response;
};
