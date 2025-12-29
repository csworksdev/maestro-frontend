import { describe, expect, it, vi, beforeEach } from "vitest";

import {
  AddOrder,
  DeleteOrder,
  EditOrder,
  FindAvailableTrainer,
  PerpanjangOrder,
  getOrderAll,
  getOrderById,
  getOrderExpired,
  getOrderFrequency,
  migrasiOrderById,
  updateOrderFrequency,
} from "../../../src/axios/masterdata/order";

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

describe("order api", () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockPost.mockReset();
    mockPut.mockReset();
    mockDelete.mockReset();
  });

  it("requests order list with params", async () => {
    const response = { data: { results: [] } };
    mockGet.mockResolvedValue(response);

    const result = await getOrderAll({ page: 1 });

    expect(result).toBe(response);
    expect(mockGet).toHaveBeenCalledWith("/api/order/", {
      params: { page: 1 },
    });
  });

  it("requests order by id", async () => {
    const response = { data: { results: [] } };
    mockGet.mockResolvedValue(response);

    const result = await getOrderById(7);

    expect(result).toBe(response);
    expect(mockGet).toHaveBeenCalledWith("/api/order/7/");
  });

  it("requests expired orders", async () => {
    const response = { data: { results: [] } };
    mockGet.mockResolvedValue(response);

    const result = await getOrderExpired({ page: 1 });

    expect(result).toBe(response);
    expect(mockGet).toHaveBeenCalledWith("/api/order/expired/", {
      params: { page: 1 },
    });
  });

  it("requests available trainers", async () => {
    const response = { data: { results: [] } };
    mockGet.mockResolvedValue(response);

    const result = await FindAvailableTrainer({ search: "a" });

    expect(result).toBe(response);
    expect(mockGet).toHaveBeenCalledWith("/api/orderfindtrainer/", {
      params: { search: "a" },
    });
  });

  it("posts order data", async () => {
    const response = { status: 201 };
    mockPost.mockResolvedValue(response);

    const payload = { product: 1 };
    const result = await AddOrder(payload);

    expect(result).toBe(response);
    expect(mockPost).toHaveBeenCalledWith("/api/order/", payload);
  });

  it("updates order data", async () => {
    const response = { status: 200 };
    mockPut.mockResolvedValue(response);

    const payload = { product: 2 };
    const result = await EditOrder(9, payload);

    expect(result).toBe(response);
    expect(mockPut).toHaveBeenCalledWith("/api/order/9/", payload);
  });

  it("migrates order field", async () => {
    const response = { status: 200 };
    mockPut.mockResolvedValue(response);

    const result = await migrasiOrderById(5, "trainer", 2);

    expect(result).toBe(response);
    expect(mockPut).toHaveBeenCalledWith("/api/order/migrasi/", {
      order_id: 5,
      key: "trainer",
      value: 2,
    });
  });

  it("deletes order data", async () => {
    const response = { status: 204 };
    mockDelete.mockResolvedValue(response);

    const result = await DeleteOrder(3);

    expect(result).toBe(response);
    expect(mockDelete).toHaveBeenCalledWith("/api/order/3/");
  });

  it("extends order", async () => {
    const response = { status: 200 };
    mockPost.mockResolvedValue(response);

    const result = await PerpanjangOrder(4, "2024-02-01");

    expect(result).toBe(response);
    expect(mockPost).toHaveBeenCalledWith("/api/order/4/perpanjang/", {
      order_date: "2024-02-01",
    });
  });

  it("requests order frequency", async () => {
    const response = { data: { frequency: 1 } };
    mockGet.mockResolvedValue(response);

    const result = await getOrderFrequency(2);

    expect(result).toBe(response);
    expect(mockGet).toHaveBeenCalledWith("/api/order/2/frequency/");
  });

  it("updates order frequency", async () => {
    const response = { status: 200 };
    mockPost.mockResolvedValue(response);

    const payload = { frequency_per_week: 1 };
    const result = await updateOrderFrequency(2, payload);

    expect(result).toBe(response);
    expect(mockPost).toHaveBeenCalledWith("/api/order/2/frequency/", payload);
  });

  it("logs errors and returns undefined", async () => {
    const error = new Error("boom");
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockGet.mockRejectedValue(error);

    const result = await getOrderAll({ page: 1 });

    expect(result).toBeUndefined();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
