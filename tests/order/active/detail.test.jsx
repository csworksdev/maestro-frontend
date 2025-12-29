import React from "react";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import DetailOrder from "../../../src/pages/order/active/detail";

const { mockGetOrderById, mockGetOrderDetailByOrderId, mockEditOrderDetail } =
  vi.hoisted(() => ({
    mockGetOrderById: vi.fn(),
    mockGetOrderDetailByOrderId: vi.fn(),
    mockEditOrderDetail: vi.fn(),
  }));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useLocation: () => ({ state: null }),
  };
});

vi.mock("@/axios/masterdata/order", () => ({
  getOrderById: (...args) => mockGetOrderById(...args),
}));

vi.mock("@/axios/masterdata/orderDetail", () => ({
  GetOrderDetailByOrderId: (...args) =>
    mockGetOrderDetailByOrderId(...args),
  EditOrderDetail: (...args) => mockEditOrderDetail(...args),
}));

vi.mock("@/components/Loading", () => ({
  default: () => <div>Loading</div>,
}));

vi.mock("@/components/ui/Card", () => ({
  default: ({ title, children }) => (
    <section>
      <h1>{title}</h1>
      {children}
    </section>
  ),
}));

vi.mock("@/components/ui/Textinput", () => ({
  default: ({ label }) => (
    <label>
      {label}
      <input aria-label={label} />
    </label>
  ),
}));

vi.mock("@/components/ui/Select", () => ({
  default: ({ label }) => (
    <label>
      {label}
      <select aria-label={label} />
    </label>
  ),
}));

vi.mock("@/components/ui/Checkbox", () => ({
  default: ({ label }) => (
    <label>
      <input type="checkbox" />
      {label}
    </label>
  ),
}));

vi.mock("@/components/ui/Textarea", () => ({
  default: ({ label }) => (
    <label>
      {label}
      <textarea aria-label={label} />
    </label>
  ),
}));

vi.mock("@/components/ui/Button", () => ({
  default: ({ children }) => <button>{children}</button>,
}));

vi.mock("react-flatpickr", () => ({
  default: () => <input type="date" />,
}));

describe("Order detail", () => {
  beforeEach(() => {
    mockGetOrderById.mockReset();
    mockGetOrderDetailByOrderId.mockReset();
    mockEditOrderDetail.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("loads order details and renders meet cards", async () => {
    mockGetOrderDetailByOrderId.mockResolvedValue({
      data: {
        results: [
          {
            order_detail_id: 1,
            meet: 1,
            schedule_date: "2024-01-01",
            real_date: null,
            jam: "06.00",
            is_presence: false,
            is_paid: false,
          },
        ],
      },
    });

    render(
      <DetailOrder
        state={{ data: { order_id: 5 } }}
        updateParentData={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(mockGetOrderDetailByOrderId).toHaveBeenCalledWith(5);
    });

    expect(screen.getByText("Pertemuan Ke: 1")).toBeInTheDocument();
  });
});
