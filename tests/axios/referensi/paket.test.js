import { describe, expect, it, vi, beforeEach } from "vitest";

import {
  AddPaket,
  DeletePaket,
  EditPaket,
  getPaketAll,
  getPaketByProduct,
} from "../../../src/axios/referensi/paket";

const { mockGet, mockPost, mockPut, mockDelete } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPost: vi.fn(),
  mockPut: vi.fn(),
  mockDelete: vi.fn(),
}));

vi.mock("../config", () => {
  return {
    axiosConfig: {
      get: (...args) => mockGet(...args),
      post: (...args) => mockPost(...args),
      put: (...args) => mockPut(...args),
      delete: (...args) => mockDelete(...args),
    },
  };
});

describe("paket api", () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockPost.mockReset();
    mockPut.mockReset();
    mockDelete.mockReset();
  });

  it("requests paket list with params", async () => {
    const response = { data: { results: [] } };
    mockGet.mockResolvedValue(response);

    const result = await getPaketAll({ page: 1 });

    expect(result).toBe(response);
    expect(mockGet).toHaveBeenCalledWith("/api/package/", {
      params: { page: 1 },
    });
  });

  it("requests paket by product id", async () => {
    const response = { data: { id: 12 } };
    mockGet.mockResolvedValue(response);

    const result = await getPaketByProduct(12);

    expect(result).toBe(response);
    expect(mockGet).toHaveBeenCalledWith("/api/package/12/");
  });

  it("posts paket data", async () => {
    const response = { status: 201 };
    mockPost.mockResolvedValue(response);

    const payload = { name: "Paket A" };
    const result = await AddPaket(payload);

    expect(result).toBe(response);
    expect(mockPost).toHaveBeenCalledWith("/api/package/", payload);
  });

  it("updates paket data", async () => {
    const response = { status: 200 };
    mockPut.mockResolvedValue(response);

    const payload = { name: "Paket B" };
    const result = await EditPaket(9, payload);

    expect(result).toBe(response);
    expect(mockPut).toHaveBeenCalledWith("/api/package/9/", payload);
  });

  it("deletes paket data", async () => {
    const response = { status: 204 };
    mockDelete.mockResolvedValue(response);

    const result = await DeletePaket(3);

    expect(result).toBe(response);
    expect(mockDelete).toHaveBeenCalledWith("/api/package/3/");
  });

  it("logs errors and returns undefined", async () => {
    const error = new Error("boom");
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockGet.mockRejectedValue(error);

    const result = await getPaketAll({ page: 1 });

    expect(result).toBeUndefined();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
