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
        Filter:
          col.id !== "action" // Exclude the "action" column from filters
            ? ({ column }) => (
                <input
                  type="text"
                  value={column.filterValue || ""} // Ensure the input is controlled
                  onChange={(e) => {
                    column.setFilter(e.target.value); // Update filter value
                  }}
                  onKeyDown={(e) => {
                    e.stopPropagation(); // Prevent propagation to sort
                    if (e.key === "Enter") {
                      handleSearch({ [column.id]: column.filterValue }); // Trigger search on Enter
                    }
                  }}
                  placeholder={`Filter ${col.Header}`}
                  className="filter-input" // Add your styling
                />
              )
            : null,
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
            <div className="overflow-hidden">
              <table
                className="min-w-full divide-y divide-slate-100 table dark:divide-slate-700"
                {...getTableProps()}
              >
                <thead className="border-t border-slate-100 dark:border-slate-800">
                  {headerGroups.map((headerGroup) => (
                    <tr {...headerGroup.getHeaderGroupProps()}>
                      {headerGroup.headers.map((column, i) => (
                        <th
                          {...column.getHeaderProps(
                            column.getSortByToggleProps()
                          )}
                          scope="col"
                          className="table-th"
                          style={{
                            width: column.width || "auto",
                            ...(i === headerGroup.headers.length - 1
                              ? stickyRightStyle
                              : {}),
                          }} // Apply stickyRightStyle to the last header
                        >
                          <div>
                            {column.render("Header")}
                            <span>
                              {column.isSorted
                                ? column.isSortedDesc
                                  ? " 🔽"
                                  : " 🔼"
                                : ""}
                            </span>
                          </div>
                          <div>
                            {column.canFilter && column.Filter
                              ? column.render("Filter")
                              : null}
                          </div>
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody
                  className="bg-white divide-y divide-slate-100 dark:bg-slate-800 dark:divide-slate-700"
                  {...getTableBodyProps()}
                >
                  {page.map((row) => {
                    prepareRow(row);
                    return (
                      <tr {...row.getRowProps()}>
                        {row.cells.map((cell, i) => (
                          <td
                            {...cell.getCellProps()}
                            className="table-td"
                            style={{
                              width: cell.column.width || "auto",
                              ...(i === row.cells.length - 1
                                ? stickyRightStyle
                                : {}),
                            }} // Apply stickyRightStyle to the last cell in each row
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
