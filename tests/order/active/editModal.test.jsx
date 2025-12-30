import React from "react";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import EditModal from "../../../src/pages/order/active/editModal";

const {
  mockGetTrainerAll,
  mockGetKolamByBranch,
  mockGetProdukPool,
  mockMigrasiOrderById,
} = vi.hoisted(() => ({
  mockGetTrainerAll: vi.fn(),
  mockGetKolamByBranch: vi.fn(),
  mockGetProdukPool: vi.fn(),
  mockMigrasiOrderById: vi.fn(),
}));

const mockSwalFire = vi.fn();

vi.mock("@/axios/masterdata/trainer", () => ({
  getTrainerAll: (...args) => mockGetTrainerAll(...args),
}));

vi.mock("@/axios/referensi/kolam", () => ({
  getKolamByBranch: (...args) => mockGetKolamByBranch(...args),
}));

vi.mock("@/axios/masterdata/produk", () => ({
  getProdukPool: (...args) => mockGetProdukPool(...args),
}));

vi.mock("@/axios/masterdata/order", () => ({
  migrasiOrderById: (...args) => mockMigrasiOrderById(...args),
}));

vi.mock("@/utils", () => ({
  toProperCase: (value) => value,
}));

vi.mock("sweetalert2", () => ({
  default: {
    fire: (...args) => mockSwalFire(...args),
  },
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
  default: ({ defaultValue }) => (
    <input aria-label="readonly" defaultValue={defaultValue} />
  ),
}));

vi.mock("@/components/ui/Button", () => ({
  default: ({ children, onClick }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
}));

vi.mock("@/components/ui/Icon", () => ({
  default: () => <span>Icon</span>,
}));

vi.mock("react-flatpickr", () => ({
  default: ({ onChange }) => (
    <input
      type="date"
      onChange={(event) => onChange([new Date(event.target.value)])}
    />
  ),
}));

vi.mock("react-select/async", () => ({
  default: ({ placeholder, onChange }) => (
    <button
      type="button"
      onClick={() => onChange({ value: 2, label: `New ${placeholder}` })}
    >
      Select {placeholder}
    </button>
  ),
}));

describe("Edit order modal", () => {
  beforeEach(() => {
    mockGetTrainerAll.mockReset();
    mockGetKolamByBranch.mockReset();
    mockGetProdukPool.mockReset();
    mockMigrasiOrderById.mockReset();
    mockSwalFire.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("loads trainer, kolam, and product options", async () => {
    mockGetTrainerAll.mockResolvedValue({ data: { results: [] } });
    mockGetKolamByBranch.mockResolvedValue({ data: { results: [] } });
    mockGetProdukPool.mockResolvedValue({ data: { results: [] } });

    render(
      <EditModal
        defaultOrder={{
          order_id: 1,
          trainer_name: "Trainer A",
          pool_name: "Kolam A",
          branch: 3,
          pool: 9,
          order_date: "2024-01-01",
        }}
      />
    );

    await waitFor(() => {
      expect(mockGetTrainerAll).toHaveBeenCalledWith({ page: 1, page_size: 100 });
      expect(mockGetKolamByBranch).toHaveBeenCalledWith(3);
      expect(mockGetProdukPool).toHaveBeenCalledWith(9);
    });
  });

  it("updates trainer when selection changes", async () => {
    mockGetTrainerAll.mockResolvedValue({ data: { results: [] } });
    mockGetKolamByBranch.mockResolvedValue({ data: { results: [] } });
    mockGetProdukPool.mockResolvedValue({ data: { results: [] } });
    mockMigrasiOrderById.mockResolvedValue({ status: true });
    mockSwalFire.mockResolvedValue({});

    render(
      <EditModal
        defaultOrder={{
          order_id: 1,
          trainer_name: "Trainer A",
          pool_name: "Kolam A",
          branch: 3,
          pool: 9,
          order_date: "2024-01-01",
        }}
      />
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Select Coach" }));
    await user.click(screen.getByRole("button", { name: "Ganti" }));

    await waitFor(() => {
      expect(mockMigrasiOrderById).toHaveBeenCalledWith(1, "trainer", 2);
    });
  });
});
