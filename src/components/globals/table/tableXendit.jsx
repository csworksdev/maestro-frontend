import React, { memo, useMemo, useRef, useEffect } from "react";
import Card from "@/components/ui/Card";
import {
  useTable,
  usePagination,
  useSortBy,
  useGlobalFilter,
  useFilters,
} from "react-table";

const toCssSize = (value) =>
  typeof value === "number" ? `${value}px` : value;

const TableXendit = memo(
  ({ listData, listColumn, handleSearch, autoColumnMaxWidth = 320 }) => {
    const columns = useMemo(
      () =>
        listColumn.map((col) => ({
          ...col,
          width: col.width || 120,
          autoWidthStyle: {
            minWidth: toCssSize(col.minWidth),
            maxWidth: toCssSize(col.maxWidth ?? autoColumnMaxWidth),
          },
        })),
      [listColumn, autoColumnMaxWidth]
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
        <div className="min-w-0 max-w-full">
          {/* Scrollable Table */}
          <div className="min-w-0 max-w-full overflow-x-auto scrollable-body">
            <table
              {...getTableProps()}
              className="table w-full table-auto divide-y divide-slate-100 dark:divide-slate-700"
              style={{ minWidth: `${Math.max(640, columns.length * 150)}px` }}
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
                        style={column.autoWidthStyle}
                        className="table-th !px-4 whitespace-normal break-words text-center"
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
                          {...cell.getCellProps()}
                          style={{
                            ...cell.column.autoWidthStyle,
                            textTransform: "none",
                          }}
                          className="table-td !px-3 !py-3 whitespace-normal break-words align-middle"
                        >
                          <div
                            className="max-w-full whitespace-normal break-words"
                            style={cell.column.autoWidthStyle}
                          >
                            {cell.render("Cell")}
                          </div>
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
    prevProps.handleSearch === nextProps.handleSearch &&
    prevProps.autoColumnMaxWidth === nextProps.autoColumnMaxWidth
);

export default TableXendit;
