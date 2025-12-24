import { describe, expect, it, vi, beforeEach } from "vitest";

import {
  AddKolam,
  DeleteKolam,
  EditKolam,
  getKolamAll,
  getKolamByBranch,
} from "../../../src/axios/referensi/kolam";

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

describe("kolam api", () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockPost.mockReset();
    mockPut.mockReset();
    mockDelete.mockReset();
  });

  it("requests kolam list with params", async () => {
    const response = { data: { results: [] } };
    mockGet.mockResolvedValue(response);

    const result = await getKolamAll({ page: 1 });

    expect(result).toBe(response);
    expect(mockGet).toHaveBeenCalledWith("/api/pool/", {
      params: { page: 1 },
    });
  });

  it("requests kolam by branch with params", async () => {
    const response = { data: { results: [] } };
    mockGet.mockResolvedValue(response);

    const params = { page: 1 };
    const result = await getKolamByBranch(3, params);

    expect(result).toBe(response);
    expect(mockGet).toHaveBeenCalledWith("/api/pool/branch/3/", {
      params,
    });
  });

  it("posts kolam data", async () => {
    const response = { status: 201 };
    mockPost.mockResolvedValue(response);

    const payload = { name: "Kolam A" };
    const result = await AddKolam(payload);

    expect(result).toBe(response);
    expect(mockPost).toHaveBeenCalledWith("/api/pool/", payload);
  });

  it("updates kolam data", async () => {
    const response = { status: 200 };
    mockPut.mockResolvedValue(response);

    const payload = { name: "Kolam B" };
    const result = await EditKolam(9, payload);

    expect(result).toBe(response);
    expect(mockPut).toHaveBeenCalledWith("/api/pool/9/", payload);
  });

  it("deletes kolam data", async () => {
    const response = { status: 204 };
    mockDelete.mockResolvedValue(response);

    const result = await DeleteKolam(3);

    expect(result).toBe(response);
    expect(mockDelete).toHaveBeenCalledWith("/api/pool/3/");
  });

  it("logs errors and returns undefined", async () => {
    const error = new Error("boom");
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockGet.mockRejectedValue(error);

    const result = await getKolamAll({ page: 1 });

    expect(result).toBeUndefined();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
