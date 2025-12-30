import React from "react";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import Kolam from "../../../src/pages/referensi/kolam/index";

const mockNavigate = vi.fn();

const { mockGetKolamAll, mockDeleteKolam } = vi.hoisted(() => ({
  mockGetKolamAll: vi.fn(),
  mockDeleteKolam: vi.fn(),
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

vi.mock("@/axios/referensi/kolam", () => ({
  getKolamAll: (...args) => mockGetKolamAll(...args),
  DeleteKolam: (...args) => mockDeleteKolam(...args),
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
        <div key={row.pool_id}>
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

describe("Kolam list page", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockGetKolamAll.mockReset();
    mockDeleteKolam.mockReset();
    mockSwalFire.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("fetches kolam list on load", async () => {
    mockGetKolamAll.mockResolvedValue({
      data: { count: 0, results: [] },
    });

    render(<Kolam />);

    await waitFor(() => {
      expect(mockGetKolamAll).toHaveBeenCalledWith({
        page: 1,
        page_size: 10,
        search: "",
      });
    });
  });

  it("navigates to edit when edit action clicked", async () => {
    mockGetKolamAll.mockResolvedValue({
      data: {
        count: 1,
        results: [{ pool_id: 11, name: "Kolam A" }],
      },
    });

    render(<Kolam />);

    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "Edit" }));

    expect(mockNavigate).toHaveBeenCalledWith("Edit", {
      state: {
        isupdate: "true",
        data: { pool_id: 11, name: "Kolam A" },
      },
    });
  });

  it("deletes kolam after confirmation", async () => {
    mockGetKolamAll.mockResolvedValue({
      data: {
        count: 1,
        results: [{ pool_id: 5, name: "Kolam B" }],
      },
    });
    mockDeleteKolam.mockResolvedValue({ status: true });
    mockSwalFire
      .mockResolvedValueOnce({ isConfirmed: true })
      .mockResolvedValueOnce({});

    render(<Kolam />);

    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(mockDeleteKolam).toHaveBeenCalledWith(5);
    });
  });
});
