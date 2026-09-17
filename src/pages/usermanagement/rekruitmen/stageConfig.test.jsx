import { describe, expect, it } from "vitest";
import {
  getApplicationStages,
  getLatestApplicationStage,
  getStageName,
  getStageStatus,
  getStageStatusDisplay,
  isRejectedStage,
  sortStages,
} from "./stageConfig";

describe("recruitment stage helpers", () => {
  it("handles newly submitted applications without stages", () => {
    const application = { application_id: "application-1", stages: [] };

    expect(getApplicationStages(application)).toEqual([]);
    expect(getLatestApplicationStage(application)).toBeNull();
    expect(getStageName(null)).toBe("");
    expect(getStageStatus(null)).toBe("");
    expect(isRejectedStage(null)).toBe(false);
  });

  it("uses current_stage from started applications", () => {
    const currentStage = {
      stage_order: 1,
      stage_name: "Cek CV",
      status: "in_progress",
    };
    const application = {
      application_id: "application-2",
      current_stage: currentStage,
    };

    expect(getApplicationStages(application)).toEqual([currentStage]);
    expect(getLatestApplicationStage(application)).toEqual(currentStage);
    expect(getStageName(currentStage)).toBe("Cek CV");
    expect(getStageStatus(currentStage)).toBe("in_progress");
  });

  it("shows user friendly stage status labels", () => {
    expect(
      getStageStatusDisplay({
        stage_name: "Cek CV",
        status_display: "Dalam Proses",
      }),
    ).toBe("Sedang Cek CV");

    expect(
      getStageStatusDisplay({
        stage_name: "Interview User",
        status: "approved",
      }),
    ).toBe("Lulus");

    expect(
      getStageStatusDisplay({
        stage_name: "Kontrak",
        status_display: "Tidak Lulus",
      }),
    ).toBe("Tidak Lulus");
  });

  it("handles invalid stage arrays defensively", () => {
    expect(sortStages(null)).toEqual([]);
    expect(sortStages({})).toEqual([]);
  });
});
