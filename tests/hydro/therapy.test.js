import { beforeEach, describe, expect, it, vi } from "vitest";

import { getHydroDashboardTherapy } from "../../src/axios/hydro/therapy";

const { mockGet } = vi.hoisted(() => ({
  mockGet: vi.fn(),
}));

vi.mock("../../src/axios/config", () => ({
  axiosConfig: {
    get: (...args) => mockGet(...args),
  },
}));

describe("hydro therapy api", () => {
  beforeEach(() => {
    mockGet.mockReset();
  });

  it("requests hydro therapy chart with semester filters", async () => {
    const response = { data: { results: [] } };
    mockGet.mockResolvedValue(response);

    const result = await getHydroDashboardTherapy({
      filter_type: "semester",
      filter_value: 1,
      filter_year: 2026,
      filter_branch_id: "branch-1",
      filter_pool_id: "pool-1",
    });

    expect(result).toBe(response);
    expect(mockGet).toHaveBeenCalledWith("/hydro/dashboard/therapy/", {
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
