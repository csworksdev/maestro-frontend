/* @vitest-environment jsdom */

import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import FrequencyModal from "./frequencyModal";
import {
  getOrderFrequency,
  updateOrderFrequency,
} from "@/axios/masterdata/order";

vi.mock("@/axios/masterdata/order", () => ({
  getOrderFrequency: vi.fn(),
  updateOrderFrequency: vi.fn(),
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
  default: ({ children, ...props }) => <button {...props}>{children}</button>,
}));

vi.mock("@/components/ui/Select", () => ({
  default: ({ label, options = [], value = "", onChange }) => (
    <label>
      {label}
      <select value={value} onChange={onChange}>
        <option value="">Select Option</option>
        {options.map((option, index) => (
          <option
            key={`${option.value || option}-${index}`}
            value={option.value || option}
          >
            {option.label || option}
          </option>
        ))}
      </select>
    </label>
  ),
}));

vi.mock("@/components/ui/Textinput", () => ({
  default: ({ label, value = "", onChange, ...props }) => (
    <label>
      {label}
      <input value={value} onChange={onChange} {...props} />
    </label>
  ),
}));

vi.mock("@/components/Loading", () => ({
  default: () => <div>Loading...</div>,
}));

vi.mock("@/components/ui/Icon", () => ({
  default: () => <span />,
}));

vi.mock("react-flatpickr", () => ({
  default: ({ value = "", onChange, className }) => (
    <input
      aria-label="Mulai Tanggal"
      className={className}
      value={value}
      onChange={(event) => onChange?.([new Date(event.target.value)])}
    />
  ),
}));

vi.mock("sweetalert2", () => ({
  default: {
    fire: vi.fn(),
  },
}));

describe("FrequencyModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    getOrderFrequency.mockResolvedValue({
      data: {
        order: {
          order_id: "ORDER-1",
          trainer_name: "john doe",
          product_name: "Private",
          students: [{ fullname: "jane" }],
        },
        current_weekly_slots: [{ day: "Senin", time: "06.00" }],
        pending_meets: [
          { meet: "1", schedule_date: "2026-04-01", day: "Senin", time: "06.00" },
          { meet: "2", schedule_date: "2026-04-08", day: "Selasa", time: "07.00" },
          { meet: "3", schedule_date: "2026-04-15", day: "Senin", time: "08.00" },
          { meet: "4", schedule_date: "2026-04-22", day: "Selasa", time: "09.00" },
        ],
        trainer_slots: [],
      },
    });

    updateOrderFrequency.mockResolvedValue({
      data: { ok: true },
    });
  });

  it("mengirim payload slots sesuai urutan input user", async () => {
    render(
      <FrequencyModal
        defaultOrder={{ order_id: "ORDER-1" }}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(getOrderFrequency).toHaveBeenCalledWith("ORDER-1");
    });

    fireEvent.change(screen.getByLabelText("Frekuensi per Minggu"), {
      target: { value: "4" },
    });

    await waitFor(() => {
      expect(screen.getAllByRole("combobox")).toHaveLength(8);
    });

    const selects = screen.getAllByRole("combobox");

    fireEvent.change(selects[0], { target: { value: "Senin" } });
    fireEvent.change(selects[1], { target: { value: "06.00" } });
    fireEvent.change(selects[2], { target: { value: "Selasa" } });
    fireEvent.change(selects[3], { target: { value: "07.00" } });
    fireEvent.change(selects[4], { target: { value: "Senin" } });
    fireEvent.change(selects[5], { target: { value: "08.00" } });
    fireEvent.change(selects[6], { target: { value: "Selasa" } });
    fireEvent.change(selects[7], { target: { value: "09.00" } });

    fireEvent.click(screen.getByRole("button", { name: "Simpan Pengaturan" }));

    await waitFor(() => {
      expect(updateOrderFrequency).toHaveBeenCalledWith("ORDER-1", {
        frequency_per_week: 4,
        start_date: "2026-04-01",
        slots: [
          { day: "Senin", time: "06.00" },
          { day: "Selasa", time: "07.00" },
          { day: "Senin", time: "08.00" },
          { day: "Selasa", time: "09.00" },
        ],
      });
    });
  });
});
