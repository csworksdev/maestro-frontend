/* @vitest-environment jsdom */

import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import FilterSidebar, { EMPTY_FILTERS } from "./filterModal";

describe("FilterSidebar", () => {
  afterEach(() => cleanup());

  it("langsung mengirim filter setiap nilai berubah tanpa tombol terapkan", () => {
    const onChange = vi.fn();
    const onClose = vi.fn();

    render(
      <FilterSidebar
        defaultFilters={EMPTY_FILTERS}
        isOpen
        onChange={onChange}
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

    expect(screen.queryByRole("button", { name: "Terapkan Filter" })).not.toBeInTheDocument();
    expect(onChange).toHaveBeenLastCalledWith({
      filter_start_date: "2026-06-12",
      filter_end_date: "2026-06-15",
      filter_payment_status: "settled",
    });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("tidak mengirim rentang tanggal yang tidak valid ke API", () => {
    const onChange = vi.fn();
    render(<FilterSidebar isOpen onChange={onChange} />);

    fireEvent.change(screen.getByLabelText("Tanggal Mulai"), {
      target: { value: "2026-06-15" },
    });
    fireEvent.change(screen.getByLabelText("Tanggal Akhir"), {
      target: { value: "2026-06-12" },
    });

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
