import React, {
  memo,
  useMemo,
  useRef,
  useEffect,
  useCallback,
  useLayoutEffect,
  useState,
} from "react";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import Dropdown from "@/components/ui/Dropdown";
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

    useEffect(() => {
      if (resolvedRef.current) {
        resolvedRef.current.indeterminate = indeterminate;
      }
    }, [resolvedRef, indeterminate]);

    return (
      <input
        type="checkbox"
        ref={resolvedRef}
        {...rest}
        onChange={(e) => {
          rest.onChange?.(e);

          if (e.target.checked) {
            if (isHeader) {
              onSelectionChange?.(rows);
            } else if (rowId) {
              onSelectionChange?.([rowId]);
            }
          }
        }}
        className="table-checkbox"
      />
    );
  }
);

const Table = ({
  listData,
  listColumn,
  handleSearch,
  isAction = true,
  isCheckbox = false,
  isPagination = true,
  onSelectionChange,
}) => {
  const columns = useMemo(
    () =>
      listColumn.map((col, index) => ({
        ...col,
        id:
          col.id ??
          (typeof col.accessor === "string" ? col.accessor : `col_${index}`),
        width: col.width || 120,
      })),
    [listColumn]
  );

  const data = useMemo(() => listData?.results ?? [], [listData]);
  const [density, setDensity] = useState("comfortable");
  const [hiddenColumnIds, setHiddenColumnIds] = useState([]);

  const isColumnLocked = useCallback(
    (column) =>
      column.disableHiding ||
      column.sticky === "right" ||
      column.id === "action" ||
      column.accessor === "action",
    []
  );

  const visibleColumns = useMemo(
    () =>
      columns.filter(
        (column) => isColumnLocked(column) || !hiddenColumnIds.includes(column.id)
      ),
    [columns, hiddenColumnIds, isColumnLocked]
  );

  const headerDensityClass =
    density === "compact"
      ? "text-[11px] !px-4 !py-3"
      : "text-xs !px-6 !py-4";
  const cellDensityClass =
    density === "compact" ? "text-xs !px-4 !py-2.5" : "text-sm !px-6 !py-4";

  const tableInstance = useTable(
    {
      columns: visibleColumns,
      data,
      manualPagination: isPagination,
      manualFilters: true,
      pageCount:
        isPagination && data.length > 0
          ? Math.ceil((listData?.count ?? data.length) / data.length)
          : 0,
    },
    useFilters,
    useGlobalFilter,
    useSortBy,
    usePagination,
    useRowSelect,
    (hooks) => {
      if (isCheckbox) {
        hooks.visibleColumns.push((cols) => [
          {
            id: "selection",
            Header: ({ getToggleAllRowsSelectedProps, rows }) => (
              <IndeterminateCheckbox
                {...getToggleAllRowsSelectedProps()}
                isHeader
                rows={rows.map((r) => r.original.id)}
                onSelectionChange={onSelectionChange}
              />
            ),
            Cell: ({ row }) => (
              <IndeterminateCheckbox
                {...row.getToggleRowSelectedProps()}
                rowId={row.original.id}
                onSelectionChange={onSelectionChange}
              />
            ),
          },
          ...cols,
        ]);
      }
    }
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page,
    prepareRow,
    selectedFlatRows,
    setPageSize,
  } = tableInstance;

  const scrollableHeaderRowsRef = useRef([]);
  const fixedHeaderRowsRef = useRef([]);
  const scrollableRowsRef = useRef([]);
  const fixedRowsRef = useRef([]);
  const prevRowsRef = useRef([]);

  // 🔄 Sync selection changes
  useEffect(() => {
    const prevIds = prevRowsRef.current.map((r) => r.original?.id);
    const newIds = selectedFlatRows.map((r) => r.original?.id);

    const isSame =
      prevIds.length === newIds.length &&
      prevIds.every((id, i) => id === newIds[i]);

    if (!isSame) {
      onSelectionChange?.(selectedFlatRows);
    }
    prevRowsRef.current = selectedFlatRows;
  }, [selectedFlatRows, onSelectionChange]);

  // 🔄 Sync row + header heights
  const synchronizeHeights = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    const scrollableHeaders = scrollableHeaderRowsRef.current.filter(Boolean);
    const fixedHeaders = fixedHeaderRowsRef.current.filter(Boolean);
    const scrollableRows = scrollableRowsRef.current.filter(Boolean);
    const fixedRows = fixedRowsRef.current.filter(Boolean);

    const resetHeights = (elements) => {
      elements.forEach((element) => {
        if (element) {
          element.style.height = "auto";
        }
      });
    };

    resetHeights(scrollableHeaders);
    resetHeights(fixedHeaders);
    resetHeights(scrollableRows);
    resetHeights(fixedRows);

    window.requestAnimationFrame(() => {
      scrollableHeaders.forEach((header, idx) => {
        const partner = fixedHeaders[idx];
        if (!header || !partner) return;
        const height = Math.max(header.offsetHeight, partner.offsetHeight);
        header.style.height = `${height}px`;
        partner.style.height = `${height}px`;
      });

      scrollableRows.forEach((row, idx) => {
        const partner = fixedRows[idx];
        if (!row || !partner) return;
        const height = Math.max(row.offsetHeight, partner.offsetHeight);
        row.style.height = `${height}px`;
        partner.style.height = `${height}px`;
      });
    });
  }, []);

  useLayoutEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    synchronizeHeights();

    const elements = [
      ...scrollableHeaderRowsRef.current,
      ...fixedHeaderRowsRef.current,
      ...scrollableRowsRef.current,
      ...fixedRowsRef.current,
    ].filter(Boolean);

    let observer = null;

    if ("ResizeObserver" in window) {
      observer = new ResizeObserver(() => synchronizeHeights());
      elements.forEach((element) => observer.observe(element));
    }

    const handleResize = () => synchronizeHeights();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (observer) {
        observer.disconnect();
      }
    };
  }, [page, listData, density, visibleColumns, synchronizeHeights]);

  // 🚫 pagination dimatikan → tampilkan semua baris yang ada
  useEffect(() => {
    if (!isPagination) {
      setPageSize(data.length || 10);
    }
  }, [isPagination, data.length, setPageSize]);

  // ✅ Render Header
  const renderHeader = (headerGroup, idx, fixed = false) => (
    <tr
      {...headerGroup.getHeaderGroupProps()}
      ref={(el) => {
        if (fixed) {
          fixedHeaderRowsRef.current[idx] = el;
        } else {
          scrollableHeaderRowsRef.current[idx] = el;
        }
      }}
      key={idx}
    >
      {fixed ? (
        <th
          className={`table-th text-center text-nowrap bg-slate-50/80 dark:bg-slate-900/70 ${headerDensityClass}`}
        >
          {headerGroup.headers.at(-1).render("Header")}
        </th>
      ) : (
        (isAction ? headerGroup.headers.slice(0, -1) : headerGroup.headers).map(
          (col) => {
            const sortIcon = col.isSorted ? (
              <Icon
                icon={
                  col.isSortedDesc
                    ? "heroicons-outline:chevron-down"
                    : "heroicons-outline:chevron-up"
                }
                width={14}
                className="text-slate-400"
              />
            ) : null;

            return (
              <th
                {...col.getHeaderProps(col.getSortByToggleProps())}
                className={`table-th text-center text-wrap bg-slate-50/80 dark:bg-slate-900/70 ${headerDensityClass} ${
                  col.canSort
                    ? "cursor-pointer select-none hover:text-slate-900 dark:hover:text-slate-100"
                    : ""
                }`}
                key={col.id}
              >
                <div className="inline-flex items-center justify-center gap-1.5">
                  <span>{col.render("Header")}</span>
                  {sortIcon}
                </div>
              </th>
            );
          }
        )
      )}
    </tr>
  );

  // ✅ Render Row
  const renderRow = (row, idx, fixed = false) => {
    prepareRow(row);
    const { key, ...restRowProps } = row.getRowProps();
    return (
      <tr
        {...restRowProps}
        key={idx}
        ref={(el) =>
          fixed
            ? (fixedRowsRef.current[idx] = el)
            : (scrollableRowsRef.current[idx] = el)
        }
        className={`group h-auto transition-colors ${
          idx % 2 === 0
            ? "bg-slate-50/60 dark:bg-slate-900/40"
            : "bg-white dark:bg-slate-800/60"
        } hover:bg-primary-50/60 dark:hover:bg-slate-700/60`}
      >
        {fixed ? (
          <td className={`table-td text-nowrap align-middle ${cellDensityClass}`}>
            {row.cells.at(-1).render("Cell")}
          </td>
        ) : (
          (isAction ? row.cells.slice(0, -1) : row.cells).map((cell) => {
            const { key, ...restCellProps } = cell.getCellProps();
            return (
              <td
                key={key}
                {...restCellProps}
                style={{ textTransform: "none" }}
                className={`table-td text-wrap align-middle transition-colors ${cellDensityClass}`}
              >
                {cell.render("Cell")}
              </td>
            );
          })
        )}
      </tr>
    );
  };

  return (
    <Card noborder className="overflow-hidden" bodyClass="p-4 sm:p-5">
      <div className="rounded-2xl border border-slate-200/70 bg-gradient-to-br from-white via-slate-50 to-slate-100/70 shadow-sm dark:border-slate-700/70 dark:from-slate-900/80 dark:via-slate-900/70 dark:to-slate-800/60">
        <div className="flex flex-col gap-3 border-b border-slate-200/70 px-4 py-3 dark:border-slate-700/70 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-300">
              Tampilan
            </span>
            <div className="inline-flex rounded-full border border-slate-200/70 bg-white/80 p-1 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/60">
              {[
                { id: "comfortable", label: "Lega" },
                { id: "compact", label: "Ringkas" },
              ].map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setDensity(option.id)}
                  className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide transition ${
                    density === option.id
                      ? "bg-primary-500 text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                  }`}
                  aria-pressed={density === option.id}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Dropdown
              label={
                <div className="inline-flex items-center gap-2">
                  <Icon icon="heroicons-outline:view-columns" width={16} />
                  <span>Kolom</span>
                </div>
              }
              wrapperClass="inline-flex"
              labelClass="inline-flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/80 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-600 shadow-sm transition hover:border-primary-200 hover:text-slate-900 dark:border-slate-700/70 dark:bg-slate-900/60 dark:text-slate-200"
              classMenuItems="mt-2 w-[260px]"
            >
              <div className="p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-300">
                    Pilih Kolom
                  </span>
                  <button
                    type="button"
                    className="text-[11px] font-semibold uppercase tracking-wider text-primary-600 hover:text-primary-700"
                    onClick={() => setHiddenColumnIds([])}
                  >
                    Reset
                  </button>
                </div>
                <div className="max-h-64 space-y-1 overflow-auto pr-1">
                  {columns.map((column) => {
                    const label =
                      typeof column.Header === "string"
                        ? column.Header
                        : column.id;
                    const locked = isColumnLocked(column);
                    const checked = locked || !hiddenColumnIds.includes(column.id);
                    return (
                      <label
                        key={column.id}
                        className={`flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-sm transition ${
                          locked
                            ? "cursor-not-allowed text-slate-400"
                            : "cursor-pointer text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700/60"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={locked}
                            onChange={() => {
                              if (locked) {
                                return;
                              }
                              setHiddenColumnIds((prev) =>
                                prev.includes(column.id)
                                  ? prev.filter((id) => id !== column.id)
                                  : [...prev, column.id]
                              );
                            }}
                            className="table-checkbox"
                          />
                          <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
                            {label}
                          </span>
                        </span>
                        {locked && (
                          <Icon
                            icon="heroicons-outline:lock-closed"
                            width={12}
                            className="text-slate-400"
                          />
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>
            </Dropdown>
          </div>
        </div>
        <div className="flex">
          {/* Main Table */}
          <div className="overflow-x-auto flex-grow scrollable-body">
            <table
              {...getTableProps()}
              className="table min-w-full table-fixed divide-y divide-slate-100/70 dark:divide-slate-700/70"
            >
              <thead className="border-b border-slate-100/70 dark:border-slate-800">
                {headerGroups.map((hg, idx) => renderHeader(hg, idx, false))}
              </thead>
              <tbody
                {...getTableBodyProps()}
                className="divide-y divide-slate-100/70 dark:divide-slate-700/70"
              >
                {page.map((row, idx) => renderRow(row, idx, false))}
              </tbody>
            </table>
          </div>

          {/* Fixed Actions */}
          {isAction && (
            <div className="w-36 min-w-[9rem] border-l border-slate-200/70 bg-white/70 dark:border-slate-700/70 dark:bg-slate-900/70 fixed-body">
              <table className="table w-36 min-w-[9rem] table-fixed">
                <thead className="border-b border-slate-100/70 dark:border-slate-800">
                  {headerGroups.map((hg, idx) => renderHeader(hg, idx, true))}
                </thead>
                <tbody className="divide-y divide-slate-100/70 dark:divide-slate-700/70">
                  {page.map((row, idx) => renderRow(row, idx, true))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

// ✅ Custom compare → hindari JSON.stringify yang berat
export default memo(Table, (prev, next) => {
  return (
    prev.listData?.results === next.listData?.results &&
    prev.listColumn === next.listColumn &&
    prev.handleSearch === next.handleSearch
  );
});
