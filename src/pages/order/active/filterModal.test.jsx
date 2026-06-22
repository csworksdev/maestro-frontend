/* @vitest-environment jsdom */

import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import FilterModal, { EMPTY_FILTERS } from "./filterModal";

describe("FilterModal", () => {
  it("mengirim filter yang diisi user ke onApply", () => {
    const onApply = vi.fn();
    const onClose = vi.fn();

    render(
      <FilterModal
        defaultFilters={EMPTY_FILTERS}
        onApply={onApply}
        onClose={onClose}
      />,
    );

    fireEvent.change(screen.getByLabelText("Tanggal Mulai"), {
      target: { value: "2026-06-12" },
    });
    fireEvent.change(screen.getByLabelText("Tanggal Akhir"), {
      target: { value: "2026-06-15" },
    });
    fireEvent.change(screen.getByLabelText("Status Pembayaran"), {
      target: { value: "settled" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Terapkan Filter" }));

    expect(onApply).toHaveBeenCalledWith({
      filter_start_date: "2026-06-12",
      filter_end_date: "2026-06-15",
      filter_payment_status: "settled",
    });
    expect(onClose).toHaveBeenCalled();
  });
});
