import React, { memo, useMemo, useRef, useEffect } from "react";
import Card from "@/components/ui/Card";
import {
  useTable,
  usePagination,
  useSortBy,
  useGlobalFilter,
  useFilters,
} from "react-table";

const Table = memo(
  ({ listData, listColumn, handleSearch }) => {
    const columns = useMemo(
      () =>
        listColumn.map((col) => ({
          ...col,
          width: col.width || 150,
        })),
      [listColumn]
    );

    const data = useMemo(() => listData.results, [listData.results]);

    const tableInstance = useTable(
      {
        columns,
        data,
        manualPagination: true,
        manualFilters: true,
        pageCount: Math.ceil(listData.count / data.length),
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

    const synchronizeHeights = () => {
      requestAnimationFrame(() => {
        if (scrollableRowsRef.current.length && fixedRowsRef.current.length) {
          scrollableRowsRef.current.forEach((scrollableRow, index) => {
            const scrollableHeight = scrollableRow?.offsetHeight || 0;
            const fixedRow = fixedRowsRef.current[index];

            if (fixedRow) {
              fixedRow.style.height = `${scrollableHeight}px`;
            }
          });

          // Ensure first row explicitly matches
          if (scrollableRowsRef.current[1] && fixedRowsRef.current[0]) {
            const firstRowHeight = scrollableRowsRef.current[1].offsetHeight;
            fixedRowsRef.current[0].style.height = `${firstRowHeight}px`;
          }
        }

        // Ensure headers align
        const scrollableHeader = document.querySelector(
          ".scrollable-body thead tr"
        );
        const fixedHeader = document.querySelector(".fixed-body thead tr");

        if (scrollableHeader && fixedHeader) {
          fixedHeader.style.height = `${scrollableHeader.offsetHeight}px`;
        }
      });
    };

    useEffect(() => {
      synchronizeHeights();

      const resizeObserver = new ResizeObserver(synchronizeHeights);

      [...scrollableRowsRef.current, ...fixedRowsRef.current].forEach((row) => {
        if (row) resizeObserver.observe(row);
      });

      return () => {
        resizeObserver.disconnect();
      };
    }, [page, listData.results]);

    return (
      <>
        <Card noborder>
          <div className="flex">
            {/* Main Scrollable Table */}
            <div className="overflow-x-auto flex-grow -mx-1 scrollable-body">
              <table
                {...getTableProps()}
                className="table  divide-y divide-slate-100 dark:divide-slate-700 table-fixed"
              >
                <thead className="border-t border-slate-100 dark:border-slate-800 h-[73]">
                  {headerGroups.map((headerGroup, index) => (
                    <tr
                      {...headerGroup.getHeaderGroupProps?.()}
                      ref={(el) => (scrollableRowsRef.current[index] = el)}
                    >
                      {headerGroup.headers
                        .slice(0, -1) // Exclude the last column
                        .map((column) => (
                          <th
                            {...column.getHeaderProps?.(
                              column.getSortByToggleProps?.()
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
                        {...row.getRowProps?.()}
                        ref={(el) => (scrollableRowsRef.current[index] = el)}
                        className={`h-auto min-h-[50px] ${
                          index % 2 == 0 ? "bg-blue-100" : ""
                        }`}
                      >
                        {row.cells.slice(0, -1).map((cell) => (
                          <td
                            {...cell.getCellProps?.()}
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

            {/* Fixed Last Column */}
            <div className="min-w-[150px] bg-white border-t border-slate-100 dark:border-slate-800 fixed-body">
              <table className="table min-w-full table-fixed">
                <thead className="border-t border-slate-100 dark:border-slate-800 h-[73]">
                  {headerGroups.map((headerGroup, index) => (
                    <tr
                      {...headerGroup.getHeaderGroupProps?.()}
                      ref={(el) => (scrollableRowsRef.current[index] = el)}
                    >
                      <th className="table-th text-center text-nowrap">
                        {
                          headerGroup.headers[
                            headerGroup.headers.length - 1
                          ].render("Header") // Render only the last column
                        }
                      </th>
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
                        {...row.getRowProps?.()}
                        ref={(el) => (fixedRowsRef.current[index] = el)}
                        className={`h-auto min-h-[50px] ${
                          index % 2 == 0 ? "bg-blue-100" : ""
                        }`}
                      >
                        <td className="table-td text-nowrap p-3 align-middle">
                          {row.cells[row.cells.length - 1].render("Cell")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      </>
    );
  },
  (prevProps, nextProps) =>
    JSON.stringify(prevProps.listData) === JSON.stringify(nextProps.listData) &&
    JSON.stringify(prevProps.listColumn) ===
      JSON.stringify(nextProps.listColumn) &&
    prevProps.handleSearch === nextProps.handleSearch
);

export default Table;
