import React from "react";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import TrainerSpesialisasi from "../../../src/pages/referensi/trainerSpesialisasi/index";

const mockNavigate = vi.fn();

const { mockGetTrainerSpecialization, mockDeleteTrainerSpecialization } =
  vi.hoisted(() => ({
    mockGetTrainerSpecialization: vi.fn(),
    mockDeleteTrainerSpecialization: vi.fn(),
  }));

const mockSwalFire = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: {} }),
  };
});

vi.mock("@/axios/referensi/trainerSpecialization", () => ({
  getTrainerSpecialization: (...args) => mockGetTrainerSpecialization(...args),
  DeleteTrainerSpecialization: (...args) =>
    mockDeleteTrainerSpecialization(...args),
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
  default: ({ children, onClick, disabled }) => (
    <button type="button" onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
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
        <div key={row.specialization_id || row.id}>
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

describe("Trainer specialization list", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockGetTrainerSpecialization.mockReset();
    mockDeleteTrainerSpecialization.mockReset();
    mockSwalFire.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("fetches trainer specializations on load", async () => {
    mockGetTrainerSpecialization.mockResolvedValue({
      data: { count: 0, results: [] },
    });

    render(<TrainerSpesialisasi trainerId={7} />);

    await waitFor(() => {
      expect(mockGetTrainerSpecialization).toHaveBeenCalledWith(7, {
        page: 1,
        page_size: 10,
        search: "",
      });
    });
  });

  it("calls onEdit when edit action clicked", async () => {
    const onEdit = vi.fn();
    mockGetTrainerSpecialization.mockResolvedValue({
      data: {
        count: 1,
        results: [
          {
            specialization_id: 11,
            specialization_name: "Spec A",
          },
        ],
      },
    });

    render(<TrainerSpesialisasi trainerId={7} onEdit={onEdit} />);

    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "Edit" }));

    expect(onEdit).toHaveBeenCalledWith(
      expect.objectContaining({
        isupdate: "true",
        trainer_id: 7,
      })
    );
  });

  it("calls onAdd when tambah clicked", async () => {
    const onAdd = vi.fn();
    mockGetTrainerSpecialization.mockResolvedValue({
      data: { count: 0, results: [] },
    });

    render(<TrainerSpesialisasi trainerId={7} onAdd={onAdd} />);

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Tambah" }));

    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        isupdate: "false",
        trainer_id: 7,
      })
    );
  });

  it("deletes trainer specialization after confirmation", async () => {
    mockGetTrainerSpecialization.mockResolvedValue({
      data: {
        count: 1,
        results: [{ specialization_id: 5, specialization_name: "Spec B" }],
      },
    });
    mockDeleteTrainerSpecialization.mockResolvedValue({ status: true });
    mockSwalFire
      .mockResolvedValueOnce({ isConfirmed: true })
      .mockResolvedValueOnce({});

    render(<TrainerSpesialisasi trainerId={7} />);

    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(mockDeleteTrainerSpecialization).toHaveBeenCalledWith(7);
    });
  });
});
