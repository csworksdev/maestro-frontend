import { describe, expect, it, vi, beforeEach } from "vitest";

import {
  AddSiswa,
  CheckDuplicateSiswa,
  DeleteSiswa,
  EditSiswa,
  getSiswaAll,
  getSiswaByBranch,
  getSiswaByProduk,
  searchSiswa,
} from "../../../src/axios/masterdata/siswa";

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

describe("siswa api", () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockPost.mockReset();
    mockPut.mockReset();
    mockDelete.mockReset();
  });

  it("requests siswa list with params and ids", async () => {
    const response = { data: { results: [] } };
    mockGet.mockResolvedValue(response);

    const result = await getSiswaAll({ page: 1 }, [1, 2]);

    expect(result).toBe(response);
    expect(mockGet).toHaveBeenCalledWith("/api/student/", {
      params: { page: 1, student_ids: "1,2" },
    });
  });

  it("requests siswa by branch with data", async () => {
    const response = { data: { results: [] } };
    mockGet.mockResolvedValue(response);

    const result = await getSiswaByBranch(3, { page: 1 });

    expect(result).toBe(response);
    expect(mockGet).toHaveBeenCalledWith("/api/student/branch/3/", {
      data: { page: 1 },
    });
  });

  it("searches siswa with params", async () => {
    const response = { data: { results: [] } };
    mockGet.mockResolvedValue(response);

    const result = await searchSiswa({ search: "andi" });

    expect(result).toBe(response);
    expect(mockGet).toHaveBeenCalledWith("/api/student/", {
      params: { search: "andi" },
    });
  });

  it("requests siswa by produk", async () => {
    const response = { data: { results: [] } };
    mockGet.mockResolvedValue(response);

    const result = await getSiswaByProduk();

    expect(result).toBe(response);
    expect(mockGet).toHaveBeenCalledWith("/api/studentbyproduk/");
  });

  it("posts siswa data", async () => {
    const response = { status: 201 };
    mockPost.mockResolvedValue(response);

    const payload = { fullname: "Siswa A" };
    const result = await AddSiswa(payload);

    expect(result).toBe(response);
    expect(mockPost).toHaveBeenCalledWith("/api/student/", payload);
  });

  it("updates siswa data", async () => {
    const response = { status: 200 };
    mockPut.mockResolvedValue(response);

    const payload = { fullname: "Siswa B" };
    const result = await EditSiswa(9, payload);

    expect(result).toBe(response);
    expect(mockPut).toHaveBeenCalledWith("/api/student/9/", payload);
  });

  it("deletes siswa data", async () => {
    const response = { status: 204 };
    mockDelete.mockResolvedValue(response);

    const result = await DeleteSiswa(3);

    expect(result).toBe(response);
    expect(mockDelete).toHaveBeenCalledWith("/api/student/3/");
  });

  it("checks duplicate siswa", async () => {
    const response = { status: 200 };
    mockPost.mockResolvedValue(response);

    const payload = { fullname: "Siswa A" };
    const result = await CheckDuplicateSiswa(payload);

    expect(result).toBe(response);
    expect(mockPost).toHaveBeenCalledWith(
      "/api/student/checkduplicate/",
      payload
    );
  });

  it("logs errors and returns undefined", async () => {
    const error = new Error("boom");
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockGet.mockRejectedValue(error);

    const result = await getSiswaAll({ page: 1 });

    expect(result).toBeUndefined();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
