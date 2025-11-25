import { axiosConfig } from "../config";

export const getDashboardDaily = async (params = {}) => {
  const now = new Date();
  const defaultParams = {
    page: 1,
    page_size: 31,
    filter_start_date: undefined,
    filter_end_date: undefined,
    filter_branch_id: undefined,
    filter_pool_id: undefined,
    filter_quarter: undefined,
    filter_semester: undefined,
    // default to current month & year if not provided
    filter_month: String(now.getMonth() + 1).padStart(2, "0"),
    filter_year: now.getFullYear(),
  };

  const query = { ...defaultParams, ...params };

  try {
    let response = await axiosConfig.get("/opx/dashboard/", {
      params: query,
    });
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const getDashboardDailySchedules = async (params = {}) => {
  const now = new Date();
  const defaultParams = {
    page: 1,
    page_size: 20,
    filter_start_date: "2025-06-01",
    filter_end_date: "2025-06-30",
    filter_branch_id: undefined,
    filter_pool_id: undefined,
    filter_quarter: undefined,
    filter_semester: undefined,
    filter_month: undefined,
    filter_year: undefined,
    search: undefined,
  };

  const query = { ...defaultParams, ...params };

  try {
    const response = await axiosConfig.get("/opx/dashboard/schedules/", {
      params: query,
    });
    return response;
  } catch (error) {
    console.error("Error fetching schedules data:", error);
  }
};

export const getDashboardDailyChart = async (params = {}) => {
  const now = new Date();
  const defaultParams = {
    page: 1,
    page_size: 20,
    filter_start_date: undefined,
    filter_end_date: undefined,
    filter_branch_id: undefined,
    filter_pool_id: undefined,
    filter_quarter: undefined,
    filter_semester: undefined,
    filter_month: undefined,
    filter_year: now.getFullYear(),
    search: undefined,
  };

  const query = { ...defaultParams, ...params };

  try {
    const response = await axiosConfig.get("/opx/dashboard/chart/", {
      params: query,
    });
    return response;
  } catch (error) {
    console.error("Error fetching schedules data:", error);
  }
};
