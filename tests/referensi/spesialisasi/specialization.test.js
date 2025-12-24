import { describe, expect, it, vi, beforeEach } from "vitest";

import {
  AddSpecialization,
  DeleteSpecialization,
  EditSpecialization,
  getSpecializationAll,
} from "../../../src/axios/referensi/specialization";

const { mockGet, mockPost, mockPut, mockDelete } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPost: vi.fn(),
  mockPut: vi.fn(),
  mockDelete: vi.fn(),
}));

vi.mock("../../../src/axios/config", () => {
  return {
    axiosConfig: {
      get: (...args) => mockGet(...args),
      post: (...args) => mockPost(...args),
      put: (...args) => mockPut(...args),
      delete: (...args) => mockDelete(...args),
    },
  };
});

describe("specialization api", () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockPost.mockReset();
    mockPut.mockReset();
    mockDelete.mockReset();
  });

  it("requests specialization list with params", async () => {
    const response = { data: { results: [] } };
    mockGet.mockResolvedValue(response);

    const result = await getSpecializationAll({ page: 1 });

    expect(result).toBe(response);
    expect(mockGet).toHaveBeenCalledWith("/api/spesialisasi/", {
      params: { page: 1 },
    });
  });

  it("posts specialization data", async () => {
    const response = { status: 201 };
    mockPost.mockResolvedValue(response);

    const payload = { name: "Specialization A" };
    const result = await AddSpecialization(payload);

    expect(result).toBe(response);
    expect(mockPost).toHaveBeenCalledWith("/api/spesialisasi/", payload);
  });

  it("updates specialization data", async () => {
    const response = { status: 200 };
    mockPut.mockResolvedValue(response);

    const payload = { name: "Specialization B" };
    const result = await EditSpecialization(9, payload);

    expect(result).toBe(response);
    expect(mockPut).toHaveBeenCalledWith("/api/spesialisasi/9/", payload);
  });

  it("deletes specialization data", async () => {
    const response = { status: 204 };
    mockDelete.mockResolvedValue(response);

    const result = await DeleteSpecialization(3);

    expect(result).toBe(response);
    expect(mockDelete).toHaveBeenCalledWith("/api/spesialisasi/3/");
  });

  it("logs errors and returns undefined", async () => {
    const error = new Error("boom");
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockGet.mockRejectedValue(error);

    const result = await getSpecializationAll({ page: 1 });

    expect(result).toBeUndefined();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
