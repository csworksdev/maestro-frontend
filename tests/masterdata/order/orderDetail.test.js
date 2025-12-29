import { describe, expect, it, vi, beforeEach } from "vitest";

import {
  AddOrderDetail,
  DeleteOrderDetail,
  EditOrderDetail,
  EditOrderDetailByOrderId,
  GetOrderDetailByOrderId,
  getOrderDetailAll,
  getOrderDetailByParent,
} from "../../../src/axios/masterdata/orderDetail";

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

describe("order detail api", () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockPost.mockReset();
    mockPut.mockReset();
    mockDelete.mockReset();
  });

  it("requests order detail list with params", async () => {
    const response = { data: { results: [] } };
    mockGet.mockResolvedValue(response);

    const result = await getOrderDetailAll({ page: 1 });

    expect(result).toBe(response);
    expect(mockGet).toHaveBeenCalledWith("/orderdetail/", {
      params: { page: 1 },
    });
  });

  it("requests order detail by parent", async () => {
    const response = { data: { results: [] } };
    mockGet.mockResolvedValue(response);

    const result = await getOrderDetailByParent(7);

    expect(result).toBe(response);
    expect(mockGet).toHaveBeenCalledWith("/api/orderdetail/7/");
  });

  it("posts order detail data", async () => {
    const response = { status: 201 };
    mockPost.mockResolvedValue(response);

    const payload = { meet: 1 };
    const result = await AddOrderDetail(payload);

    expect(result).toBe(response);
    expect(mockPost).toHaveBeenCalledWith("/api/orderdetail/", payload);
  });

  it("updates order detail data", async () => {
    const response = { status: 200 };
    mockPut.mockResolvedValue(response);

    const payload = { meet: 2 };
    const result = await EditOrderDetail(9, payload);

    expect(result).toBe(response);
    expect(mockPut).toHaveBeenCalledWith("/api/orderdetail/9/", payload);
  });

  it("deletes order detail data", async () => {
    const response = { status: 204 };
    mockDelete.mockResolvedValue(response);

    const result = await DeleteOrderDetail(3);

    expect(result).toBe(response);
    expect(mockDelete).toHaveBeenCalledWith("/api/orderdetail/3/");
  });

  it("updates order detail by order id", async () => {
    const response = { status: 200 };
    mockPut.mockResolvedValue(response);

    const payload = { meet: 1 };
    const result = await EditOrderDetailByOrderId(5, payload);

    expect(result).toBe(response);
    expect(mockPut).toHaveBeenCalledWith("/api/orderdetailbyorderid/5/", payload);
  });

  it("gets order detail by order id", async () => {
    const response = { data: { results: [] } };
    mockGet.mockResolvedValue(response);

    const result = await GetOrderDetailByOrderId(5);

    expect(result).toBe(response);
    expect(mockGet).toHaveBeenCalledWith("/api/orderdetailbyorderid/5/");
  });

  it("logs errors and returns undefined", async () => {
    const error = new Error("boom");
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockGet.mockRejectedValue(error);

    const result = await getOrderDetailAll({ page: 1 });

    expect(result).toBeUndefined();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
