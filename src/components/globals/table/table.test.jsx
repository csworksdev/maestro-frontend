import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { afterEach, expect, it } from "vitest";
import store from "@/store";
import Table from "./table";
import TableXendit from "./tableXendit";

afterEach(cleanup);

it("keeps data columns and actions in one responsive scroll area", () => {
  const columns = [
    { Header: "Nama", accessor: "name" },
    { Header: "Cabang", accessor: "branch" },
    { Header: "Status", accessor: "status" },
    { Header: "Aksi", accessor: "action", Cell: () => "Edit" },
  ];
  const { container } = render(
    <Provider store={store}>
      <Table listData={{ count: 1, results: [{ name: "Kolam A", branch: "Bandung", status: "Aktif" }] }} listColumn={columns} />
    </Provider>,
  );

  const viewport = container.querySelector(".responsive-table-viewport");
  expect(viewport).toBeTruthy();
  expect(viewport.querySelector(".responsive-table-main")).toContainElement(screen.getByText("Kolam A"));
  expect(viewport.querySelector(".fixed-body")).toContainElement(screen.getByText("Edit"));
  expect(viewport.style.getPropertyValue("--responsive-table-total-min-width")).toBe("784px");
});

it("keeps the Xendit table wider than a mobile viewport inside its scroll area", () => {
  const { container } = render(
    <TableXendit
      listData={[{ name: "Transaksi A", status: "Lunas" }]}
      listColumn={[{ Header: "Nama", accessor: "name" }, { Header: "Status", accessor: "status" }]}
    />,
  );

  const scrollArea = container.querySelector(".scrollable-body");
  expect(scrollArea).toHaveClass("overflow-x-auto");
  expect(scrollArea.querySelector("table")).toHaveStyle("min-width: 640px");
});
