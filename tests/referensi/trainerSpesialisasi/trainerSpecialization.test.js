import { describe, expect, it, vi, beforeEach } from "vitest";

import {
  AddTrainerSpecialization,
  DeleteTrainerSpecialization,
  EditTrainerSpecialization,
  getTrainerSpecialization,
} from "../../../src/axios/referensi/trainerSpecialization";

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

describe("trainer specialization api", () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockPost.mockReset();
    mockPut.mockReset();
    mockDelete.mockReset();
  });

  it("requests trainer specializations with params", async () => {
    const response = { data: { results: [] } };
    mockGet.mockResolvedValue(response);

    const result = await getTrainerSpecialization(9, { page: 1 });

    expect(result).toBe(response);
    expect(mockGet).toHaveBeenCalledWith(
      "/api/trainer-specialization/9/",
      { params: { page: 1 } }
    );
  });

  it("posts trainer specialization data", async () => {
    const response = { status: 201 };
    mockPost.mockResolvedValue(response);

    const payload = { specialization: "1" };
    const result = await AddTrainerSpecialization(9, payload);

    expect(result).toBe(response);
    expect(mockPost).toHaveBeenCalledWith(
      "/api/trainer-specialization/9/",
      payload
    );
  });

  it("updates trainer specialization data", async () => {
    const response = { status: 200 };
    mockPut.mockResolvedValue(response);

    const payload = { specialization: "2" };
    const result = await EditTrainerSpecialization(9, payload);

    expect(result).toBe(response);
    expect(mockPut).toHaveBeenCalledWith(
      "/api/trainer-specialization/9/",
      payload
    );
  });

  it("deletes trainer specialization data", async () => {
    const response = { status: 204 };
    mockDelete.mockResolvedValue(response);

    const result = await DeleteTrainerSpecialization(9);

    expect(result).toBe(response);
    expect(mockDelete).toHaveBeenCalledWith(
      "/api/trainer-specialization/9/"
    );
  });

  it("logs errors and returns undefined", async () => {
    const error = new Error("boom");
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockGet.mockRejectedValue(error);

    const result = await getTrainerSpecialization(9, { page: 1 });

    expect(result).toBeUndefined();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
