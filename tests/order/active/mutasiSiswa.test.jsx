import React from "react";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import MutasiSiswaModal from "../../../src/pages/order/active/mutasiSiswa";

const { mockGetTrainerAll, mockMigrasiOrderById } = vi.hoisted(() => ({
  mockGetTrainerAll: vi.fn(),
  mockMigrasiOrderById: vi.fn(),
}));

const mockSwalFire = vi.fn();

vi.mock("@/axios/masterdata/trainer", () => ({
  getTrainerAll: (...args) => mockGetTrainerAll(...args),
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

describe("Mutasi siswa modal", () => {
  beforeEach(() => {
    mockGetTrainerAll.mockReset();
    mockMigrasiOrderById.mockReset();
    mockSwalFire.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("loads trainer options", async () => {
    mockGetTrainerAll.mockResolvedValue({
      data: { results: [{ trainer_id: 1, nickname: "Coach A" }] },
    });

    render(
      <MutasiSiswaModal
        defaultOrder={{ order_id: 11, trainer_id: 1, trainer_name: "Coach A" }}
      />
    );

    await waitFor(() => {
      expect(mockGetTrainerAll).toHaveBeenCalledWith({
        page: 1,
        page_size: 100,
      });
    });
  });

  it("updates trainer when selection changes", async () => {
    mockGetTrainerAll.mockResolvedValue({
      data: {
        results: [
          { trainer_id: 1, nickname: "Coach A" },
          { trainer_id: 2, nickname: "Coach B" },
        ],
      },
    });
    mockMigrasiOrderById.mockResolvedValue({ status: true });
    mockSwalFire.mockResolvedValue({});

    render(
      <MutasiSiswaModal
        defaultOrder={{ order_id: 11, trainer_id: 1, trainer_name: "Coach A" }}
      />
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Select Coach" }));
    await user.click(screen.getByRole("button", { name: "Ganti" }));

    await waitFor(() => {
      expect(mockMigrasiOrderById).toHaveBeenCalledWith(11, "mutasi", 2);
    });
  });
});
