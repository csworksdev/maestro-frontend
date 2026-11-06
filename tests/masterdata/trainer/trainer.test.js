import { describe, expect, it, vi, beforeEach } from "vitest";

import {
  AddTrainer,
  DeleteTrainer,
  EditTrainer,
  getTrainerDocuments,
  deleteTrainerDocument,
  getTrainerAll,
  getTrainerAllNew,
} from "../../../src/axios/masterdata/trainer";

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

describe("trainer api", () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockPost.mockReset();
    mockPut.mockReset();
    mockDelete.mockReset();
  });

  it("requests trainer list with params", async () => {
    const response = { data: { results: [] } };
    mockGet.mockResolvedValue(response);

    const result = await getTrainerAll({ page: 1 });

    expect(result).toBe(response);
    expect(mockGet).toHaveBeenCalledWith("/api/trainer/", {
      params: { page: 1 },
    });
  });

  it("requests trainer list new with params", async () => {
    const response = { data: { results: [] } };
    mockGet.mockResolvedValue(response);

    const result = await getTrainerAllNew({ page: 1 });

    expect(result).toBe(response);
    expect(mockGet).toHaveBeenCalledWith("/api/trainer/new/", {
      params: { page: 1 },
    });
  });

  it("posts trainer data", async () => {
    const response = { status: 201 };
    mockPost.mockResolvedValue(response);

    const payload = { fullname: "Trainer A" };
    const result = await AddTrainer(payload);

    expect(result).toBe(response);
    expect(mockPost).toHaveBeenCalledWith("/api/trainer/", payload);
  });

  it("updates trainer data", async () => {
    const response = { status: 200 };
    mockPut.mockResolvedValue(response);

    const payload = { fullname: "Trainer B" };
    const result = await EditTrainer(9, payload);

    expect(result).toBe(response);
    expect(mockPut).toHaveBeenCalledWith("/api/trainer/9/", payload);
  });

  it("deletes trainer data", async () => {
    const response = { status: 204 };
    mockDelete.mockResolvedValue(response);

    const result = await DeleteTrainer(3);

    expect(result).toBe(response);
    expect(mockDelete).toHaveBeenCalledWith("/api/trainer/3/");
  });

  it("uses the configured production API for trainer documents", async () => {
    mockGet.mockResolvedValue({ data: { results: [] } });
    mockDelete.mockResolvedValue({ status: 204 });

    await getTrainerDocuments("trainer/1", { page: 2 });
    await deleteTrainerDocument("trainer/1", "document/2");

    expect(mockGet).toHaveBeenCalledWith(
      "/api/trainer/trainer%2F1/documents/",
      { params: { page: 2 } },
    );
    expect(mockDelete).toHaveBeenCalledWith(
      "/api/trainer/trainer%2F1/documents/document%2F2/",
    );
  });

  it("logs errors and returns undefined", async () => {
    const error = new Error("boom");
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockGet.mockRejectedValue(error);

    const result = await getTrainerAll({ page: 1 });

    expect(result).toBeUndefined();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
