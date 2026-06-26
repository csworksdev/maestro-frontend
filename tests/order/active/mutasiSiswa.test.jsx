import React from "react";
import { render, screen, waitFor, cleanup, fireEvent } from "@testing-library/react";
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

vi.mock("@/components/ui/Select", () => ({
  default: ({ label, options = [], value, onChange, placeholder }) => (
    <label>
      {label}
      <select aria-label={label} value={value} onChange={onChange}>
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((opt, i) => (
          <option key={i} value={opt.value ?? opt}>
            {opt.label ?? opt}
          </option>
        ))}
      </select>
    </label>
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

const DEFAULT_ORDER = {
  order_id: 11,
  trainer_id: 1,
  trainer_name: "Coach A",
  detail: [
    { meet: 3, is_presence: false },
    { meet: 4, is_presence: false },
    { meet: 5, is_presence: true },
  ],
};

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

    render(<MutasiSiswaModal defaultOrder={DEFAULT_ORDER} />);

    await waitFor(() => {
      expect(mockGetTrainerAll).toHaveBeenCalledWith({
        page: 1,
        page_size: 100,
      });
    });
  });

  it("shows only pending meets (is_presence false) in the select", async () => {
    mockGetTrainerAll.mockResolvedValue({ data: { results: [] } });

    render(<MutasiSiswaModal defaultOrder={DEFAULT_ORDER} />);

    const select = await screen.findByLabelText("Mulai dari Pertemuan");
    const options = Array.from(select.querySelectorAll("option[value]")).map(
      (o) => o.value
    );

    expect(options).toContain("3");
    expect(options).toContain("4");
    expect(options).not.toContain("5");
  });

  it("updates trainer and meet when submitted", async () => {
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

    render(<MutasiSiswaModal defaultOrder={DEFAULT_ORDER} />);

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Select Coach" }));

    fireEvent.change(screen.getByLabelText("Mulai dari Pertemuan"), {
      target: { value: "3" },
    });

    await user.click(screen.getByRole("button", { name: "Ganti Pelatih" }));

    await waitFor(() => {
      expect(mockMigrasiOrderById).toHaveBeenCalledWith(11, "mutasi", 2, 3);
    });
  });
});
