import React, { memo, useMemo, useRef, useEffect } from "react";
import Card from "@/components/ui/Card";
import {
  useTable,
  usePagination,
  useSortBy,
  useGlobalFilter,
  useFilters,
  useRowSelect,
} from "react-table";
const IndeterminateCheckbox = React.forwardRef(
  (
    { indeterminate, isHeader, rows, rowId, onSelectionChange, ...rest },
    ref
  ) => {
    const defaultRef = React.useRef();
    const resolvedRef = ref || defaultRef;

    React.useEffect(() => {
      resolvedRef.current.indeterminate = indeterminate;
    }, [resolvedRef, indeterminate]);

    return (
      <input
        type="checkbox"
        ref={resolvedRef}
        {...rest}
        onChange={(e) => {
          // jalankan handler bawaan react-table
          rest.onChange && rest.onChange(e);

          if (e.target.checked) {
            if (isHeader && rowId) {
              onSelectionChange(rows); // langsung kirim array id
            } else if (rowId) {
              onSelectionChange([rowId]); // biar konsisten array juga
            }
          }
        }}
        className="table-checkbox"
      />
    );
  }
);

const Table = memo(
  ({
    listData,
    listColumn,
    handleSearch,
    isAction = true,
    isCheckbox = false,
    onSelectionChange,
  }) => {
    const columns = useMemo(
      () =>
        listColumn.map((col) => ({
          ...col,
          width: col.width || 120,
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
      usePagination,
      useRowSelect,

      (hooks) => {
        isCheckbox &&
          hooks.visibleColumns.push((columns) => [
            {
              id: "selection",
              // Header
              Header: ({ getToggleAllRowsSelectedProps, rows }) => (
                <div>
                  <IndeterminateCheckbox
                    {...getToggleAllRowsSelectedProps()}
                    isHeader
                    rows={rows.map((r) => r.original.id)} // biar bisa dapetin semua id
                    onSelectionChange={onSelectionChange}
                  />
                </div>
              ),

              // Cell
              Cell: ({ row }) => (
                <div>
                  <IndeterminateCheckbox
                    {...row.getToggleRowSelectedProps()}
                    rowId={row.original.id}
                    onSelectionChange={onSelectionChange}
                  />
                </div>
              ),
            },
            ...columns,
          ]);
      }
    );

    const {
      getTableProps,
      getTableBodyProps,
      headerGroups,
      page,
      prepareRow,
      selectedFlatRows,
    } = tableInstance;

    const scrollableRowsRef = useRef([]);
    const fixedRowsRef = useRef([]);

    const prevRowsRef = useRef([]);

    useEffect(() => {
      const prevIds = prevRowsRef.current.map((r) => r.original?.id);
      const newIds = selectedFlatRows.map((r) => r.original?.id);

      // bandingkan prev vs new
      const isSame =
        prevIds.length === newIds.length &&
        prevIds.every((id, i) => id === newIds[i]);

      if (!isSame) {
        onSelectionChange(selectedFlatRows);
      }

      // update prev
      prevRowsRef.current = selectedFlatRows;
    }, [selectedFlatRows, onSelectionChange]);

    const synchronizeHeights = () => {
      requestAnimationFrame(() => {
        // Sync header heights
        const scrollableHeader = document.querySelector(
          ".scrollable-body thead tr"
        );
        const fixedHeader = document.querySelector(".fixed-body thead tr");

        if (scrollableHeader && fixedHeader) {
          const headerHeight = scrollableHeader.offsetHeight;
          if (fixedHeader.style.height !== `${headerHeight}px`) {
            fixedHeader.style.height = `${headerHeight - 1}px`;
          }
          if (scrollableHeader.style.height !== `${headerHeight}px`) {
            scrollableHeader.style.height = `${headerHeight}px`;
          }
        }

        // Sync row heights
        page.forEach((_, index) => {
          const scrollableRow = scrollableRowsRef.current[index];
          const fixedRow = fixedRowsRef.current[index];

          if (scrollableRow && fixedRow) {
            const scrollableHeight = scrollableRow.offsetHeight;
            if (fixedRow.style.height !== `${scrollableHeight}px`) {
              fixedRow.style.height = `${scrollableHeight}px`;
            }
            if (scrollableRow.style.height !== `${scrollableHeight}px`) {
              scrollableRow.style.height = `${scrollableHeight - 4}px`;
            }
          }
        });
      });
    };

    useEffect(() => {
      synchronizeHeights();
      const resizeObserver = new ResizeObserver(synchronizeHeights);

      // Observe both tables' rows
      const allRows = [
        ...scrollableRowsRef.current.filter(Boolean),
        ...fixedRowsRef.current.filter(Boolean),
      ];

      allRows.forEach((row) => resizeObserver.observe(row));

      return () => {
        resizeObserver.disconnect();
      };
    }, [page, listData.results]);

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
                    {(() => {
                      const data = isAction
                        ? headerGroup.headers.slice(0, -1)
                        : headerGroup.headers;
                      return data.map((column) => (
                        <th
                          {...column.getHeaderProps(
                            column.getSortByToggleProps()
                          )}
                          className="table-th text-center text-wrap"
                          key={column.id} // It's good practice to add a key when mapping
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
                      ));
                    })()}
                  </tr>
                ))}
              </thead>
              <tbody
                {...getTableBodyProps()}
                className="bg-white divide-y divide-slate-100 dark:bg-slate-800 dark:divide-slate-700"
              >
                {page.map((row, index) => {
                  prepareRow(row);
                  let { key, ...rest } = row.getRowProps();
                  return (
                    <tr
                      {...row.getRowProps()}
                      ref={(el) => (scrollableRowsRef.current[index] = el)}
                      key={key}
                      className={`h-auto ${
                        index % 2 === 0 ? "bg-blue-100" : ""
                      }`}
                    >
                      {(() => {
                        const data = isAction
                          ? row.cells.slice(0, -1)
                          : row.cells;
                        return data.map((cell) => (
                          <td
                            style={{ textTransform: "none" }}
                            {...cell.getCellProps()}
                            className="table-td text-wrap p-3 align-middle"
                          >
                            {cell.render("Cell")}
                          </td>
                        ));
                      })()}
                      {/* {row.cells.slice(0, -1).map((cell) => (
                        <td
                          style={{ textTransform: "none" }}
                          {...cell.getCellProps()}
                          className="table-td text-wrap p-3 align-middle"
                        >
                          {cell.render("Cell")}
                        </td>
                      ))} */}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {isAction ? (
            <div className="w-[100px] bg-white border-t border-slate-100 dark:border-slate-800 fixed-body">
              <table className="table table-fixed w-[100px]">
                <thead className="border-t border-slate-100 dark:border-slate-800">
                  {headerGroups.map((headerGroup, index) => (
                    <tr
                      {...headerGroup.getHeaderGroupProps()}
                      ref={(el) => (fixedRowsRef.current[index] = el)}
                    >
                      <th className="table-th text-center text-nowrap">
                        {headerGroup.headers[
                          headerGroup.headers.length - 1
                        ].render("Header")}
                      </th>
                    </tr>
                  ))}
                </thead>
                <tbody className="bg-white divide-y divide-slate-100 dark:bg-slate-800 dark:divide-slate-700">
                  {page.map((row, index) => {
                    prepareRow(row);
                    return (
                      <tr
                        {...row.getRowProps()}
                        ref={(el) => (fixedRowsRef.current[index] = el)}
                        className={`h-auto ${
                          index % 2 === 0 ? "bg-blue-100" : ""
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
          ) : null}
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

export default Table;
