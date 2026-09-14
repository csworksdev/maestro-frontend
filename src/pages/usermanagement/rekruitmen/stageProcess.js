import { getJobById } from "@/axios/career/job";
import { getStagesByDepartment } from "@/axios/career/stage";
import {
  startApplicationProcess,
  submitApplicationDecision,
} from "@/axios/career/application";
import {
  findNextStage,
  getApplicationStages,
  getLatestApplicationStage,
  getStageId,
  sortStages,
} from "./stageConfig";

export const getApplicationDepartmentId = async (application = {}) => {
  const directDepartment =
    application.department ||
    application.department_id ||
    application.job_department ||
    application.job_department_id;

  if (directDepartment) return directDepartment;

  const stages = getApplicationStages(application);
  const stageDepartment = stages.find(
    (stage) => stage?.department || stage?.department_id,
  );

  if (stageDepartment) {
    return stageDepartment.department || stageDepartment.department_id;
  }

  if (!application.job) return "";

  const response = await getJobById(application.job);
  const job = response?.data || {};
  return job.department || job.department_id || "";
};

export const getDepartmentStages = async (departmentId) => {
  if (!departmentId) return [];

  const response = await getStagesByDepartment(departmentId, {
    page: 1,
    page_size: 100,
    ordering: "stage_order",
  });

  return sortStages(response?.data?.results || []);
};

export const processApplicationStage = async ({
  application,
  applicationId,
  status,
  notes,
}) => {
  const targetApplicationId = applicationId || application?.application_id;
  if (!targetApplicationId) {
    throw new Error("Application ID tidak ditemukan.");
  }

  const latestStage = getLatestApplicationStage(application);
  if (!latestStage) {
    const startResponse = await startApplicationProcess(targetApplicationId, {
      notes,
    });
    const startedStage = startResponse?.data?.data?.current_stage || null;

    if (status === "rejected") {
      const startedStageId = getStageId(startedStage);
      if (!startedStageId) {
        throw new Error("Tahap awal pelamar tidak ditemukan dari response start.");
      }

      await submitApplicationDecision(targetApplicationId, {
        stageId: startedStageId,
        status,
        notes,
      });
    }

    return {
      departmentId:
        application?.department ||
        application?.department_id ||
        startedStage?.department ||
        startedStage?.department_id ||
        "",
      stage: startedStage,
    };
  }

  const departmentId = await getApplicationDepartmentId(application);
  if (!departmentId) {
    throw new Error("Department pelamar tidak ditemukan dari data loker.");
  }

  const departmentStages = await getDepartmentStages(departmentId);
  if (!departmentStages.length) {
    throw new Error("Tahapan rekrutmen untuk department ini belum tersedia.");
  }

  const targetStage =
    status === "rejected"
      ? latestStage || departmentStages[0]
      : findNextStage(departmentStages, latestStage);

  if (!targetStage) {
    throw new Error("Pelamar sudah berada di tahap terakhir.");
  }

  await submitApplicationDecision(targetApplicationId, {
    stageId: getStageId(targetStage),
    status,
    notes,
  });

  return {
    departmentId,
    stage: targetStage,
  };
};
