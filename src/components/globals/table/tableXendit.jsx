import React, { memo, useMemo, useRef, useEffect } from "react";
import Card from "@/components/ui/Card";
import {
  useTable,
  usePagination,
  useSortBy,
  useGlobalFilter,
  useFilters,
} from "react-table";

const TableXendit = memo(
  ({ listData, listColumn, handleSearch }) => {
    const columns = useMemo(
      () =>
        listColumn.map((col) => ({
          ...col,
          width: col.width || 120,
        })),
      [listColumn]
    );

    const data = useMemo(() => listData, [listData]);

    const tableInstance = useTable(
      {
        columns,
        data,
        manualPagination: true,
        manualFilters: true,
        pageCount: 0,
      },
      useFilters,
      useGlobalFilter,
      useSortBy,
      usePagination
    );

    const { getTableProps, getTableBodyProps, headerGroups, page, prepareRow } =
      tableInstance;

    const scrollableRowsRef = useRef([]);
    const fixedRowsRef = useRef([]);

    return (
      <Card noborder>
        <div className="flex">
          {/* Scrollable Table */}
          <div className="overflow-x-auto flex-grow -mx-1 scrollable-body">
            <table
              {...getTableProps()}
              className="table table-fixed divide-y divide-slate-100 dark:divide-slate-700"
            >
              <thead className="border-t border-slate-100 dark:border-slate-800">
                {headerGroups.map((headerGroup, index) => (
                  <tr
                    {...headerGroup.getHeaderGroupProps()}
                    ref={(el) => (scrollableRowsRef.current[index] = el)}
                  >
                    {headerGroup.headers.map((column) => (
                      <th
                        {...column.getHeaderProps(
                          column.getSortByToggleProps()
                        )}
                        className="table-th text-center text-wrap"
                      >
                        {column.render("Header")}
                        <span>
                          {column.isSorted
                            ? column.isSortedDesc
                              ? " 🔽"
                              : " 🔼"
                            : ""}
                        </span>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody
                {...getTableBodyProps()}
                className="bg-white divide-y divide-slate-100 dark:bg-slate-800 dark:divide-slate-700"
              >
                {page.map((row, index) => {
                  prepareRow(row);
                  return (
                    <tr
                      {...row.getRowProps()}
                      ref={(el) => (scrollableRowsRef.current[index] = el)}
                      className={`h-auto ${
                        index % 2 === 0 ? "bg-blue-100" : ""
                      }`}
                    >
                      {row.cells.map((cell) => (
                        <td
                          style={{ textTransform: "none" }}
                          {...cell.getCellProps()}
                          className="table-td text-wrap p-3 align-middle"
                        >
                          {cell.render("Cell")}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    );
  },
  (prevProps, nextProps) =>
    JSON.stringify(prevProps.listData) === JSON.stringify(nextProps.listData) &&
    JSON.stringify(prevProps.listColumn) ===
      JSON.stringify(nextProps.listColumn) &&
    prevProps.handleSearch === nextProps.handleSearch
);

export default TableXendit;
