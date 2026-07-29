import { axiosConfig } from "../config";

export const getHydroDashboardTherapy = async (params = {}) => {
  const query = {
    filter_type: undefined,
    filter_value: undefined,
    filter_year: undefined,
    filter_branch_id: undefined,
    filter_pool_id: undefined,
    ...params,
  };

  try {
    const response = await axiosConfig.get("/hydro/dashboard/therapy/", {
      params: query,
    });
    return response;
  } catch (error) {
    console.error("Error fetching hydro dashboard therapy:", error);
  }
};
