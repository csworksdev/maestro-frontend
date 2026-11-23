import { beforeEach, describe, expect, it, vi } from "vitest";
import { saveCareerApplicationStageCustomData } from "../../src/axios/career/jobs";

const { mockPost } = vi.hoisted(() => ({ mockPost: vi.fn() }));

vi.mock("../../src/axios/config", () => ({
  axiosConfig: {
    post: (...args) => mockPost(...args),
  },
}));

describe("career custom data API", () => {
  beforeEach(() => mockPost.mockReset());

  it("sends stage values inside custom_data", async () => {
    const response = { status: 200 };
    mockPost.mockResolvedValue(response);
    const customData = {
      interview_date: "2026-09-20",
      link_zoom: "https://zoom.us",
      upload_ktp: "/file/ktp.jpg/",
    };

    const result = await saveCareerApplicationStageCustomData(
      "application-1",
      "stage-1",
      customData,
    );

    expect(result).toBe(response);
    expect(mockPost).toHaveBeenCalledWith(
      "/api/career/applications/application-1/stages/stage-1/custom-data/",
      { custom_data: customData },
    );
  });
});
