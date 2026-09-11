import { axiosAccessMutationConfig } from "../config";

const DEPARTMENT_BASE_URL = "/api/departments/";

export const getDepartmentsAll = async (data, config = {}) => {
  try {
    const response = await axiosAccessMutationConfig.get(DEPARTMENT_BASE_URL, {
      params: data,
      ...config,
    });
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const AddDepartment = async (data) => {
  try {
    const response = await axiosAccessMutationConfig.post(DEPARTMENT_BASE_URL, data);
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const EditDepartment = async (id, data) => {
  try {
    const response = await axiosAccessMutationConfig.put(
      `${DEPARTMENT_BASE_URL}${id}/`,
      data,
    );
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const DeleteDepartment = async (id) => {
  try {
    const response = await axiosAccessMutationConfig.delete(
      `${DEPARTMENT_BASE_URL}${id}/`,
    );
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};
