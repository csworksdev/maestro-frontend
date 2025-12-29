import React from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import OrderDetail from "../../../src/pages/order/active/orderDetail";

vi.mock("@/components/Loading", () => ({
  default: () => <div>Loading</div>,
}));

vi.mock("@/components/ui/Card", () => ({
  default: ({ title, children }) => (
    <section>
      <h2>{title}</h2>
      {children}
    </section>
  ),
}));

vi.mock("@/components/ui/Textinput", () => ({
  default: ({ label, defaultValue }) => (
    <label>
      {label}
      <input aria-label={label} defaultValue={defaultValue} />
    </label>
  ),
}));

vi.mock("react-flatpickr", () => ({
  default: ({ defaultValue }) => (
    <input type="date" defaultValue={defaultValue} />
  ),
}));

describe("OrderDetail component", () => {
  beforeEach(() => {
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

  it("shows loading when params are empty", () => {
    render(<OrderDetail params={[]} />);

    expect(screen.getByText("Loading")).toBeInTheDocument();
  });

  it("renders meeting cards when params provided", () => {
    render(
      <OrderDetail
        params={[
          {
            index: 0,
            meetings: 0,
            day: "2024-02-01",
            time: "08:00",
            is_presence: false,
          },
        ]}
      />
    );

    expect(screen.getByText("Pertemuan 1")).toBeInTheDocument();
    expect(screen.getByLabelText("Jam")).toBeInTheDocument();
  });
});
