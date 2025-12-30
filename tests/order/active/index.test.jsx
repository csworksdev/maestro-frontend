import React from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { describe, expect, it, afterEach, vi } from "vitest";

import Order from "../../../src/pages/order/active/index";

vi.mock("@/components/ui/Card", () => ({
  default: ({ title, children }) => (
    <section>
      <h1>{title}</h1>
      {children}
    </section>
  ),
}));

vi.mock("../../../src/pages/order/active/orderActive", () => ({
  default: ({ is_finished }) => (
    <div>OrderActive {String(is_finished)}</div>
  ),
}));

describe("Order active index page", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders OrderActive with active flag", () => {
    render(<Order />);

    expect(screen.getByText("Order")).toBeInTheDocument();
    expect(screen.getByText("OrderActive false")).toBeInTheDocument();
  });
});
