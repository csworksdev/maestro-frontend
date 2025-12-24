import { describe, expect, it, vi, beforeEach } from "vitest";

import {
  AddPeriodisasi,
  DeletePeriodisasi,
  EditPeriodisasi,
  getPeriodisasiAll,
  getPeriodisasiToday,
} from "../../../src/axios/referensi/periodisasi";

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

describe("periodisasi api", () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockPost.mockReset();
    mockPut.mockReset();
    mockDelete.mockReset();
  });

  it("requests periodisasi list with params", async () => {
    const response = { data: { results: [] } };
    mockGet.mockResolvedValue(response);

    const result = await getPeriodisasiAll({ page: 1 });

    expect(result).toBe(response);
    expect(mockGet).toHaveBeenCalledWith("/api/periodisasi/", {
      params: { page: 1 },
    });
  });

  it("requests periodisasi today", async () => {
    const response = { data: { results: [] } };
    mockGet.mockResolvedValue(response);

    const result = await getPeriodisasiToday();

    expect(result).toBe(response);
    expect(mockGet).toHaveBeenCalledWith("/api/periodisasi/today/");
  });

  it("posts periodisasi data", async () => {
    const response = { status: 201 };
    mockPost.mockResolvedValue(response);

    const payload = { name: "Periode A" };
    const result = await AddPeriodisasi(payload);

    expect(result).toBe(response);
    expect(mockPost).toHaveBeenCalledWith("/api/periodisasi/", payload);
  });

  it("updates periodisasi data", async () => {
    const response = { status: 200 };
    mockPut.mockResolvedValue(response);

    const payload = { name: "Periode B" };
    const result = await EditPeriodisasi(9, payload);

    expect(result).toBe(response);
    expect(mockPut).toHaveBeenCalledWith("/api/periodisasi/9/", payload);
  });

  it("deletes periodisasi data", async () => {
    const response = { status: 204 };
    mockDelete.mockResolvedValue(response);

    const result = await DeletePeriodisasi(3);

    expect(result).toBe(response);
    expect(mockDelete).toHaveBeenCalledWith("/api/periodisasi/3/");
  });

  it("logs errors and returns undefined", async () => {
    const error = new Error("boom");
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockGet.mockRejectedValue(error);

    const result = await getPeriodisasiAll({ page: 1 });

    expect(result).toBeUndefined();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
