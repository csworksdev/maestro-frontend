import { describe, expect, it, vi, beforeEach } from "vitest";

import {
  AddProduk,
  DeleteProduk,
  EditProduk,
  getProdukAll,
  getProdukPool,
} from "../../../src/axios/masterdata/produk";

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

describe("produk api", () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockPost.mockReset();
    mockPut.mockReset();
    mockDelete.mockReset();
  });

  it("requests produk list with params", async () => {
    const response = { data: { results: [] } };
    mockGet.mockResolvedValue(response);

    const result = await getProdukAll({ page: 1 });

    expect(result).toBe(response);
    expect(mockGet).toHaveBeenCalledWith("/api/product/", {
      params: { page: 1 },
    });
  });

  it("requests produk pool by id with params", async () => {
    const response = { data: { results: [] } };
    mockGet.mockResolvedValue(response);

    const params = { page: 1 };
    const result = await getProdukPool(7, params);

    expect(result).toBe(response);
    expect(mockGet).toHaveBeenCalledWith("/api/productpool/7/", params);
  });

  it("posts produk data", async () => {
    const response = { status: 201 };
    mockPost.mockResolvedValue(response);

    const payload = { name: "Produk A" };
    const result = await AddProduk(payload);

    expect(result).toBe(response);
    expect(mockPost).toHaveBeenCalledWith("/api/product/", payload);
  });

  it("updates produk data", async () => {
    const response = { status: 200 };
    mockPut.mockResolvedValue(response);

    const payload = { name: "Produk B" };
    const result = await EditProduk(9, payload);

    expect(result).toBe(response);
    expect(mockPut).toHaveBeenCalledWith("/api/product/9/", payload);
  });

  it("deletes produk data", async () => {
    const response = { status: 204 };
    mockDelete.mockResolvedValue(response);

    const result = await DeleteProduk(3);

    expect(result).toBe(response);
    expect(mockDelete).toHaveBeenCalledWith("/api/product/3/");
  });

  it("logs errors and returns undefined", async () => {
    const error = new Error("boom");
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockGet.mockRejectedValue(error);

    const result = await getProdukAll({ page: 1 });

    expect(result).toBeUndefined();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
