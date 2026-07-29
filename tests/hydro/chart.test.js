import { beforeEach, describe, expect, it, vi } from "vitest";

import { getHydroDashboardChart } from "../../src/axios/hydro/chart";

const { mockGet } = vi.hoisted(() => ({
  mockGet: vi.fn(),
}));

vi.mock("../../src/axios/config", () => ({
  axiosConfig: {
    get: (...args) => mockGet(...args),
  },
}));

describe("hydro chart api", () => {
  beforeEach(() => {
    mockGet.mockReset();
  });

  it("requests hydro dashboard chart with semester filters", async () => {
    const response = { data: { results: [] } };
    mockGet.mockResolvedValue(response);

    const result = await getHydroDashboardChart({
      filter_type: "semester",
      filter_value: 1,
      filter_year: 2026,
      filter_branch_id: "branch-1",
      filter_pool_id: "pool-1",
    });

    expect(result).toBe(response);
    expect(mockGet).toHaveBeenCalledWith("/hydro/dashboard/chart/", {
      params: {
        filter_type: "semester",
        filter_value: 1,
        filter_year: 2026,
        filter_branch_id: "branch-1",
        filter_pool_id: "pool-1",
      },
    });
  });
});
