import React from "react";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import Specialization from "../../../src/pages/referensi/spesialisasi/index";

const mockNavigate = vi.fn();

const { mockGetSpecializationAll, mockDeleteSpecialization } = vi.hoisted(
  () => ({
    mockGetSpecializationAll: vi.fn(),
    mockDeleteSpecialization: vi.fn(),
  })
);

const mockSwalFire = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    Link: ({ children }) => <div>{children}</div>,
  };
});

vi.mock("@/axios/referensi/specialization", () => ({
  getSpecializationAll: (...args) => mockGetSpecializationAll(...args),
  DeleteSpecialization: (...args) => mockDeleteSpecialization(...args),
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
        <div key={row.specialization_id}>
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

describe("Specialization list page", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockGetSpecializationAll.mockReset();
    mockDeleteSpecialization.mockReset();
    mockSwalFire.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("fetches specialization list on load", async () => {
    mockGetSpecializationAll.mockResolvedValue({
      data: { count: 0, results: [] },
    });

    render(<Specialization />);

    await waitFor(() => {
      expect(mockGetSpecializationAll).toHaveBeenCalledWith({
        page: 1,
        page_size: 10,
        search: "",
      });
    });
  });

  it("navigates to edit when edit action clicked", async () => {
    mockGetSpecializationAll.mockResolvedValue({
      data: {
        count: 1,
        results: [{ specialization_id: 11, name: "Spec A" }],
      },
    });

    render(<Specialization />);

    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "Edit" }));

    expect(mockNavigate).toHaveBeenCalledWith("Edit", {
      state: {
        isupdate: "true",
        data: { specialization_id: 11, name: "Spec A" },
      },
    });
  });

  it("deletes specialization after confirmation", async () => {
    mockGetSpecializationAll.mockResolvedValue({
      data: {
        count: 1,
        results: [{ specialization_id: 5, name: "Spec B" }],
      },
    });
    mockDeleteSpecialization.mockResolvedValue({ status: true });
    mockSwalFire
      .mockResolvedValueOnce({ isConfirmed: true })
      .mockResolvedValueOnce({});

    render(<Specialization />);

    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(mockDeleteSpecialization).toHaveBeenCalledWith(5);
    });
  });
});
