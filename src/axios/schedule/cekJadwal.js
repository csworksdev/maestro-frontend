import { axiosConfig } from "../config";

export const CJGetPool = async (id, options = {}) => {
  return axiosConfig.get("/api/cekjadwal/getpool/" + id + "/", {
    params: { summary: true },
    signal: options.signal,
    headers: { "Cache-Control": "no-cache" },
  });
};

export const CJGetTrainer = async (id) => {
  try {
    let response = await axiosConfig.get(
      "/api/cekjadwal/gettrainer/" + id + "/",
    );
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const CJGetEmptySchedule = async (id) => {
  try {
    let response = await axiosConfig.get("/api/cekjadwal/getempty/" + id + "/");
    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

const createRevalidationConfig = ({
  selectedBranch,
  poolName,
  dayName,
  signal,
  etag,
}) => ({
  params: {
    branch: selectedBranch,
    pool: poolName,
    day: dayName,
  },
  signal,
  headers: {
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
    ...(etag ? { "If-None-Match": etag } : {}),
  },
  validateStatus: (status) => (status >= 200 && status < 300) || status === 304,
});

export const CJGetBranchDay = async (
  selectedBranch,
  poolName,
  dayName,
  options = {},
) => {
  return axiosConfig.get("/api/cekjadwal/getschedule/", {
    ...createRevalidationConfig({
      selectedBranch,
      poolName,
      dayName,
      ...options,
    }),
  });
};

export const CJCompletedSchedule = async (
  selectedBranch,
  poolName,
  dayName,
  options = {},
) => {
  return axiosConfig.get("/api/cekjadwal/gecompleted-schedule/", {
    ...createRevalidationConfig({
      selectedBranch,
      poolName,
      dayName,
      ...options,
    }),
  });
};
