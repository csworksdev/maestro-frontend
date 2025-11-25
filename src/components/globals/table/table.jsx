import React, {
  memo,
  useMemo,
  useRef,
  useEffect,
  useCallback,
  useLayoutEffect,
} from "react";
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
    () => listColumn.map((col) => ({ ...col, width: col.width || 120 })),
    [listColumn]
  );

  const data = useMemo(() => listData?.results ?? [], [listData]);

  const tableInstance = useTable(
    {
      columns,
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
  }, [page, listData, synchronizeHeights]);

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
        <th className="table-th text-center text-nowrap">
          {headerGroup.headers.at(-1).render("Header")}
        </th>
      ) : (
        (isAction ? headerGroup.headers.slice(0, -1) : headerGroup.headers).map(
          (col) => (
            <th
              {...col.getHeaderProps(col.getSortByToggleProps())}
              className="table-th text-center text-wrap"
              key={col.id}
            >
              {col.render("Header")}
              {col.isSorted ? (col.isSortedDesc ? " 🔽" : " 🔼") : ""}
            </th>
          )
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
        className={`h-auto ${idx % 2 === 0 ? "bg-blue-100" : ""}`}
      >
        {fixed ? (
          <td className="table-td text-nowrap p-3 align-middle">
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
                className="table-td text-wrap p-3 align-middle"
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
    <Card noborder>
      <div className="flex">
        {/* Main Table */}
        <div className="overflow-x-auto flex-grow -mx-1 scrollable-body">
          <table
            {...getTableProps()}
            className="table table-fixed divide-y divide-slate-100 dark:divide-slate-700"
          >
            <thead className="border-t border-slate-100 dark:border-slate-800">
              {headerGroups.map((hg, idx) => renderHeader(hg, idx, false))}
            </thead>
            <tbody
              {...getTableBodyProps()}
              className="bg-white divide-y divide-slate-100 dark:bg-slate-800 dark:divide-slate-700"
            >
              {page.map((row, idx) => renderRow(row, idx, false))}
            </tbody>
          </table>
        </div>

        {/* Fixed Actions */}
        {isAction && (
          <div className="w-36 min-w-[9rem] bg-white border-t border-slate-100 dark:border-slate-800 fixed-body">
            <table className="table table-fixed w-36 min-w-[9rem]">
              <thead className="border-t border-slate-100 dark:border-slate-800">
                {headerGroups.map((hg, idx) => renderHeader(hg, idx, true))}
              </thead>
              <tbody className="bg-white divide-y divide-slate-100 dark:bg-slate-800 dark:divide-slate-700">
                {page.map((row, idx) => renderRow(row, idx, true))}
              </tbody>
            </table>
          </div>
        )}
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
