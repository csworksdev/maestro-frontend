import React from "react";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import Cabang from "../../../src/pages/referensi/cabang/index";

const mockNavigate = vi.fn();

const { mockGetCabangAll, mockDeleteCabang } = vi.hoisted(() => ({
  mockGetCabangAll: vi.fn(),
  mockDeleteCabang: vi.fn(),
}));

const mockSwalFire = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    Link: ({ children }) => <div>{children}</div>,
  };
});

vi.mock("@/axios/referensi/cabang", () => ({
  getCabangAll: (...args) => mockGetCabangAll(...args),
  DeleteCabang: (...args) => mockDeleteCabang(...args),
}));

vi.mock("sweetalert2", () => ({
  default: {
    fire: (...args) => mockSwalFire(...args),
  },
}));

vi.mock("@/components/ui/Card", () => ({
  default: ({ title, headerslot, children }) => (
    <section>
      <h1>{title}</h1>
      {headerslot}
      {children}
    </section>
  ),
}));

vi.mock("@/components/ui/Button", () => ({
  default: ({ children }) => <div>{children}</div>,
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
        <div key={row.branch_id}>
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

describe("Cabang list page", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockGetCabangAll.mockReset();
    mockDeleteCabang.mockReset();
    mockSwalFire.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("fetches cabang list on load", async () => {
    mockGetCabangAll.mockResolvedValue({
      data: { count: 0, results: [] },
    });

    render(<Cabang />);

    await waitFor(() => {
      expect(mockGetCabangAll).toHaveBeenCalledWith({
        page: 1,
        page_size: 10,
        search: "",
      });
    });
  });

  it("navigates to edit when edit action clicked", async () => {
    mockGetCabangAll.mockResolvedValue({
      data: {
        count: 1,
        results: [{ branch_id: 11, name: "Cabang A" }],
      },
    });

    render(<Cabang />);

    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "Edit" }));

    expect(mockNavigate).toHaveBeenCalledWith("Edit", {
      state: {
        isupdate: "true",
        data: { branch_id: 11, name: "Cabang A" },
      },
    });
  });

  it("deletes cabang after confirmation", async () => {
    mockGetCabangAll.mockResolvedValue({
      data: {
        count: 1,
        results: [{ branch_id: 5, name: "Cabang B" }],
      },
    });
    mockDeleteCabang.mockResolvedValue({ status: true });
    mockSwalFire
      .mockResolvedValueOnce({ isConfirmed: true })
      .mockResolvedValueOnce({});

    render(<Cabang />);

    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(mockDeleteCabang).toHaveBeenCalledWith(5);
    });
  });
});
