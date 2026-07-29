import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import {
  GlobalFilterProvider,
  useGlobalFilter,
} from "../../src/contexts/GlobalFilterContext";

const FilterConsumer = () => {
  const { filter, setFilterValue } = useGlobalFilter();

  return (
    <div>
      <div data-testid="type">{filter.filter_type}</div>
      <div data-testid="year">{filter.filter_year}</div>
      <button onClick={() => setFilterValue("filter_type", "quarter")}>
        set quarter
      </button>
    </div>
  );
};

describe("global filter context", () => {
  it("provides initial values and updates them", async () => {
    const user = userEvent.setup();

    render(
      <GlobalFilterProvider>
        <FilterConsumer />
      </GlobalFilterProvider>,
    );

    expect(screen.getByTestId("type")).toHaveTextContent("semester");
    expect(screen.getByTestId("year")).toHaveTextContent("2026");

    await user.click(screen.getByRole("button", { name: /set quarter/i }));

    expect(screen.getByTestId("type")).toHaveTextContent("quarter");
  });
});
