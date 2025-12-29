import React from "react";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import OrderActive from "../../../src/pages/order/active/orderActive";

const mockNavigate = vi.fn();

const { mockGetOrderAll, mockDeleteOrder, mockPerpanjangOrder } = vi.hoisted(
  () => ({
    mockGetOrderAll: vi.fn(),
    mockDeleteOrder: vi.fn(),
    mockPerpanjangOrder: vi.fn(),
  })
);

const mockSwalFire = vi.fn();
const mockUseAuthStore = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    Link: ({ children }) => <div>{children}</div>,
  };
});

vi.mock("@/axios/masterdata/order", () => ({
  getOrderAll: (...args) => mockGetOrderAll(...args),
  DeleteOrder: (...args) => mockDeleteOrder(...args),
  PerpanjangOrder: (...args) => mockPerpanjangOrder(...args),
}));

vi.mock("@/redux/slicers/authSlice", () => ({
  useAuthStore: (selector) => mockUseAuthStore(selector),
}));

vi.mock("sweetalert2", () => ({
  default: {
    fire: (...args) => mockSwalFire(...args),
    getInput: () => ({ max: "" }),
  },
}));

vi.mock("@iconify/react", () => ({
  Icon: () => <span>Icon</span>,
}));

vi.mock("@/components/ui/Tooltip", () => ({
  default: ({ children }) => <span>{children}</span>,
}));

vi.mock("@/components/ui/Modal", () => ({
  default: ({ title, activeModal, children }) =>
    activeModal ? (
      <div>
        <h2>{title}</h2>
        {children}
      </div>
    ) : null,
}));

vi.mock("../../../src/pages/order/active/detail", () => ({
  default: () => <div>DetailOrder</div>,
}));

vi.mock("../../../src/pages/order/active/editModal", () => ({
  default: () => <div>EditModal</div>,
}));

vi.mock("../../../src/pages/order/active/mutasiSiswa", () => ({
  default: () => <div>MutasiSiswa</div>,
}));

vi.mock("../../../src/pages/order/active/frequencyModal", () => ({
  default: () => <div>FrequencyModal</div>,
}));

vi.mock("@/components/Loading", () => ({
  default: () => <div>Loading</div>,
}));

vi.mock("@/components/globals/table/search", () => ({
  default: () => <div>Search</div>,
}));

vi.mock("@/components/globals/table/pagination", () => ({
  default: () => <div>Pagination</div>,
}));

vi.mock("@/components/globals/table/tableAction", () => ({
  default: ({ action, row }) => (
    <button onClick={() => action.onClick(row)}>{action.name}</button>
  ),
}));

vi.mock("@/components/globals/table/table", () => ({
  default: ({ listData, listColumn }) => (
    <div>
      {listData?.results?.map((row) => (
        <div key={row.order_id}>
          {listColumn.map((column) => (
            <div key={column.id || column.accessor}>
              {column.accessor === "action"
                ? column.Cell({ row: { original: row } })
                : null}
            </div>
          ))}
        </div>
      ))}
    </div>
  ),
}));

describe("OrderActive", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockGetOrderAll.mockReset();
    mockDeleteOrder.mockReset();
    mockPerpanjangOrder.mockReset();
    mockSwalFire.mockReset();
    mockUseAuthStore.mockReset();

    mockUseAuthStore.mockImplementation((selector) =>
      selector({ data: { roles: "Staff" } })
    );
  });

  afterEach(() => {
    cleanup();
  });

  it("fetches order list on load", async () => {
    mockGetOrderAll.mockResolvedValue({
      data: { count: 0, results: [] },
    });

    render(<OrderActive is_finished={false} />);

    await waitFor(() => {
      expect(mockGetOrderAll).toHaveBeenCalledWith({
        page: 1,
        page_size: 10,
        is_finish: false,
        search: "",
      });
    });
  });

  it("deletes order after confirmation", async () => {
    mockGetOrderAll.mockResolvedValue({
      data: {
        count: 1,
        results: [{ order_id: 5, students: [] }],
      },
    });
    mockDeleteOrder.mockResolvedValue({ status: true });
    mockSwalFire
      .mockResolvedValueOnce({ isConfirmed: true })
      .mockResolvedValueOnce({});

    render(<OrderActive is_finished={false} />);

    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "delete" }));

    await waitFor(() => {
      expect(mockDeleteOrder).toHaveBeenCalledWith(5);
    });
  });
});
