import { describe, expect, it, vi, beforeEach } from "vitest";

import {
  AddCabang,
  DeleteCabang,
  EditCabang,
  getCabangAll,
} from "../../../src/axios/referensi/cabang";

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

describe("cabang api", () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockPost.mockReset();
    mockPut.mockReset();
    mockDelete.mockReset();
  });

  it("requests cabang list with params", async () => {
    const response = { data: { results: [] } };
    mockGet.mockResolvedValue(response);

    const result = await getCabangAll({ page: 1 });

    expect(result).toBe(response);
    expect(mockGet).toHaveBeenCalledWith("/api/branch/", {
      params: { page: 1 },
    });
  });

  it("posts cabang data", async () => {
    const response = { status: 201 };
    mockPost.mockResolvedValue(response);

    const payload = { name: "Cabang A" };
    const result = await AddCabang(payload);

    expect(result).toBe(response);
    expect(mockPost).toHaveBeenCalledWith("/api/branch/", payload);
  });

  it("updates cabang data", async () => {
    const response = { status: 200 };
    mockPut.mockResolvedValue(response);

    const payload = { name: "Cabang B" };
    const result = await EditCabang(9, payload);

    expect(result).toBe(response);
    expect(mockPut).toHaveBeenCalledWith("/api/branch/9/", payload);
  });

  it("deletes cabang data", async () => {
    const response = { status: 204 };
    mockDelete.mockResolvedValue(response);

    const result = await DeleteCabang(3);

    expect(result).toBe(response);
    expect(mockDelete).toHaveBeenCalledWith("/api/branch/3/");
  });

  it("logs errors and returns undefined", async () => {
    const error = new Error("boom");
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockGet.mockRejectedValue(error);

    const result = await getCabangAll({ page: 1 });

    expect(result).toBeUndefined();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
