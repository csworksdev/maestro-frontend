import React, { useMemo } from "react";
import Card from "@/components/ui/Card";
import {
  useTable,
  usePagination,
  useSortBy,
  useGlobalFilter,
  useFilters, // Import useFilters
} from "react-table";

const Table = ({ listData, listColumn, handleSearch }) => {
  const columns = useMemo(
    () =>
      listColumn.map((col) => ({
        ...col,
      })),
    [listColumn, handleSearch]
  );

  const data = useMemo(() => listData.results, [listData.results]);

  const tableInstance = useTable(
    {
      columns,
      data,
      manualPagination: true,
      manualFilters: true, // Enable manual filtering
      pageCount: Math.ceil(listData.count / data.length),
    },
    useFilters, // Add useFilters hook
    useGlobalFilter,
    useSortBy,
    usePagination
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page,
    prepareRow,
    state,
  } = tableInstance;

  // Inline styles for sticky column
  const stickyRightStyle = {
    position: "sticky",
    right: 0,
    backgroundColor: "#fff",
    zIndex: 1,
  };

  return (
    <>
      <Card noborder>
        <div className="overflow-x-auto -mx-6">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-x-auto">
              <table
                {...getTableProps()}
                className="table min-w-full divide-y divide-slate-100 dark:divide-slate-700"
              >
                <thead className="border-t border-slate-100 dark:border-slate-800">
                  {headerGroups.map((headerGroup) => (
                    <tr {...headerGroup.getHeaderGroupProps?.()}>
                      {headerGroup.headers.map((column, i) => (
                        <th
                          {...(column.getHeaderProps?.(
                            column.getSortByToggleProps?.()
                          ) || {})}
                          className={`table-th text-center text-nowrap w-auto ${
                            i === headerGroup.headers.length - 1
                              ? "sticky right-0 bg-white z-10"
                              : ""
                          }`}
                          // style={{ width: column.getSize?.() }}
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
                <tbody className="bg-white divide-y divide-slate-100 dark:bg-slate-800 dark:divide-slate-700">
                  {page.map((row) => {
                    prepareRow(row);
                    return (
                      <tr {...row.getRowProps?.()}>
                        {row.cells.map((cell, i) => (
                          <td
                            {...(cell.getCellProps?.() || {})}
                            className={`table-td w-auto ${
                              i === row.cells.length - 1
                                ? "sticky right-0 bg-white z-10"
                                : ""
                            }`}
                            style={{ width: cell.column.getSize?.() }}
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
        </div>
      </Card>
    </>
  );
};

export default Table;
