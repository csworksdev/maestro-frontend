import React from "react";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import Paket from "../../../src/pages/referensi/paket/index";

const mockNavigate = vi.fn();

const { mockGetPaketAll, mockDeletePaket } = vi.hoisted(() => ({
  mockGetPaketAll: vi.fn(),
  mockDeletePaket: vi.fn(),
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

vi.mock("@/axios/referensi/paket", () => ({
  getPaketAll: (...args) => mockGetPaketAll(...args),
  DeletePaket: (...args) => mockDeletePaket(...args),
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
        <div key={row.package_id}>
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

describe("Paket list page", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockGetPaketAll.mockReset();
    mockDeletePaket.mockReset();
    mockSwalFire.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("fetches paket list on load", async () => {
    mockGetPaketAll.mockResolvedValue({
      data: { count: 0, results: [] },
    });

    render(<Paket />);

    await waitFor(() => {
      expect(mockGetPaketAll).toHaveBeenCalledWith({
        page: 1,
        page_size: 10,
        search: "",
      });
    });
  });

  it("navigates to edit when edit action clicked", async () => {
    mockGetPaketAll.mockResolvedValue({
      data: {
        count: 1,
        results: [{ package_id: 11, name: "Paket A" }],
      },
    });

    render(<Paket />);

    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "Edit" }));

    expect(mockNavigate).toHaveBeenCalledWith("Edit", {
      state: {
        isupdate: "true",
        data: { package_id: 11, name: "Paket A" },
      },
    });
  });

  it("deletes paket after confirmation", async () => {
    mockGetPaketAll.mockResolvedValue({
      data: {
        count: 1,
        results: [{ package_id: 5, name: "Paket B" }],
      },
    });
    mockDeletePaket.mockResolvedValue({ status: true });
    mockSwalFire
      .mockResolvedValueOnce({ isConfirmed: true })
      .mockResolvedValueOnce({});

    render(<Paket />);

    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(mockDeletePaket).toHaveBeenCalledWith(5);
    });
  });
});
