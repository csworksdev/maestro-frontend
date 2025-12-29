import React from "react";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import FrequencyModal from "../../../src/pages/order/active/frequencyModal";

const { mockGetOrderFrequency, mockUpdateOrderFrequency } = vi.hoisted(() => ({
  mockGetOrderFrequency: vi.fn(),
  mockUpdateOrderFrequency: vi.fn(),
}));

const mockSwalFire = vi.fn();

vi.mock("@/axios/masterdata/order", () => ({
  getOrderFrequency: (...args) => mockGetOrderFrequency(...args),
  updateOrderFrequency: (...args) => mockUpdateOrderFrequency(...args),
}));

vi.mock("@/utils", () => ({
  toProperCase: (value) => value,
}));

vi.mock("sweetalert2", () => ({
  default: {
    fire: (...args) => mockSwalFire(...args),
  },
}));

vi.mock("@/components/Loading", () => ({
  default: () => <div>Loading</div>,
}));

vi.mock("@/components/ui/Icon", () => ({
  default: ({ className }) => <span>{className ?? "Icon"}</span>,
}));

vi.mock("@/components/ui/Card", () => ({
  default: ({ title, children }) => (
    <section>
      <h2>{title}</h2>
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

vi.mock("@/components/ui/Textinput", () => ({
  default: ({ label, type = "text", value, onChange }) => (
    <label>
      {label}
      <input
        aria-label={label}
        type={type}
        value={value ?? ""}
        onChange={onChange}
      />
    </label>
  ),
}));

vi.mock("@/components/ui/Select", () => ({
  default: ({ label, options = [], value, onChange }) => (
    <label>
      {label}
      <select aria-label={label} value={value ?? ""} onChange={onChange}>
        {options.map((option) => (
          <option key={option.value ?? option} value={option.value ?? option}>
            {option.label ?? option}
          </option>
        ))}
      </select>
    </label>
  ),
}));

vi.mock("react-flatpickr", () => ({
  default: ({ onChange, value, defaultValue, name }) => (
    <input
      aria-label={name}
      type="date"
      defaultValue={value ?? defaultValue}
      onChange={(event) => onChange([new Date(event.target.value)])}
    />
  ),
}));

describe("Frequency modal", () => {
  beforeEach(() => {
    mockGetOrderFrequency.mockReset();
    mockUpdateOrderFrequency.mockReset();
    mockSwalFire.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("loads frequency data and submits update", async () => {
    mockGetOrderFrequency.mockResolvedValue({
      data: {
        order: {
          order_id: 99,
          trainer_name: "Trainer A",
          product_name: "Produk A",
          students: [{ fullname: "Student A" }],
        },
        current_weekly_slots: [{ day: "Senin", time: "06.00" }],
        pending_meets: [
          {
            meet: 1,
            day: "Senin",
            time: "06.00",
            schedule_date: "2024-02-01",
          },
        ],
        trainer_slots: [
          { ts_id: 1, day: "Senin", time: "06.00", is_avail: true },
        ],
      },
    });
    mockUpdateOrderFrequency.mockResolvedValue({ data: { ok: true } });
    mockSwalFire.mockResolvedValue({});

    const onClose = vi.fn();
    const onSuccess = vi.fn();

    render(
      <FrequencyModal
        defaultOrder={{ order_id: 99 }}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );

    await screen.findByText("Pertemuan Belum Diabsen");

    const user = userEvent.setup();
    await user.click(
      screen.getByRole("button", { name: "Simpan Pengaturan" })
    );

    await waitFor(() => {
      expect(mockUpdateOrderFrequency).toHaveBeenCalledWith(
        99,
        expect.objectContaining({
          frequency_per_week: 1,
          slots: [{ day: "Senin", time: "06.00" }],
          start_date: "2024-02-01",
        })
      );
    });

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });
});
