import React from "react";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import Periodisasi from "../../../src/pages/referensi/periodisasi/index";

const mockNavigate = vi.fn();

const { mockGetPeriodisasiAll, mockDeletePeriodisasi } = vi.hoisted(() => ({
  mockGetPeriodisasiAll: vi.fn(),
  mockDeletePeriodisasi: vi.fn(),
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

vi.mock("@/axios/referensi/periodisasi", () => ({
  getPeriodisasiAll: (...args) => mockGetPeriodisasiAll(...args),
  DeletePeriodisasi: (...args) => mockDeletePeriodisasi(...args),
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
        <div key={row.periode_id}>
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

describe("Periodisasi list page", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockGetPeriodisasiAll.mockReset();
    mockDeletePeriodisasi.mockReset();
    mockSwalFire.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("fetches periodisasi list on load", async () => {
    mockGetPeriodisasiAll.mockResolvedValue({
      data: { count: 0, results: [] },
    });

    render(<Periodisasi />);

    await waitFor(() => {
      expect(mockGetPeriodisasiAll).toHaveBeenCalledWith({
        page: 1,
        page_size: 10,
        search: "",
      });
    });
  });

  it("navigates to edit when edit action clicked", async () => {
    mockGetPeriodisasiAll.mockResolvedValue({
      data: {
        count: 1,
        results: [{ periode_id: 11, name: "Periode A" }],
      },
    });

    render(<Periodisasi />);

    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "edit" }));

    expect(mockNavigate).toHaveBeenCalledWith("edit", {
      state: {
        isupdate: "true",
        data: { periode_id: 11, name: "Periode A" },
      },
    });
  });

  it("deletes periodisasi after confirmation", async () => {
    mockGetPeriodisasiAll.mockResolvedValue({
      data: {
        count: 1,
        results: [{ periode_id: 5, name: "Periode B" }],
      },
    });
    mockDeletePeriodisasi.mockResolvedValue({ status: true });
    mockSwalFire
      .mockResolvedValueOnce({ isConfirmed: true })
      .mockResolvedValueOnce({});

    render(<Periodisasi />);

    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "delete" }));

    await waitFor(() => {
      expect(mockDeletePeriodisasi).toHaveBeenCalledWith(5);
    });
  });
});
