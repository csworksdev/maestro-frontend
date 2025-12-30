import React, { useState, useEffect } from "react";
import Icon from "@/components/ui/Icon";

const PaginationComponent = ({
  pageSize,
  pageIndex,
  pageCount,
  canPreviousPage,
  canNextPage,
  gotoPage,
  previousPage,
  nextPage,
  setPageSize,
}) => {
  const [inputPage, setInputPage] = useState(pageIndex + 1);
  const currentPage = pageCount === 0 ? 0 : pageIndex + 1;

  useEffect(() => {
    setInputPage(pageIndex + 1);
  }, [pageIndex]);

  const generatePageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 10;
    let startPage, endPage;

    if (pageCount <= maxPagesToShow) {
      startPage = 0;
      endPage = pageCount;
    } else {
      if (pageIndex <= Math.floor(maxPagesToShow / 2)) {
        startPage = 0;
        endPage = maxPagesToShow;
      } else if (pageIndex + Math.floor(maxPagesToShow / 2) >= pageCount) {
        startPage = pageCount - maxPagesToShow;
        endPage = pageCount;
      } else {
        startPage = pageIndex - Math.floor(maxPagesToShow / 2);
        endPage = pageIndex + Math.floor(maxPagesToShow / 2) + 1;
      }
    }

    for (let i = startPage; i < endPage; i++) {
      pageNumbers.push(i);
    }
    return pageNumbers;
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputPage(value === "" ? "" : Number(value));
  };

  const handleInputBlur = () => {
    if (inputPage === "") {
      setInputPage(pageIndex + 1);
    } else {
      const pageNumber = Math.max(1, Math.min(pageCount, inputPage)) - 1;
      gotoPage(pageNumber);
    }
  };

  return (
    <div className="mt-6 rounded-2xl border border-slate-200/70 bg-gradient-to-br from-white via-slate-50 to-slate-100/70 px-4 py-4 shadow-sm dark:border-slate-700/70 dark:from-slate-900/80 dark:via-slate-900/70 dark:to-slate-800/60 sm:px-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center justify-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-300">
            Rows
          </span>
          <select
            className="form-control h-9 w-24 rounded-full border-slate-200/70 bg-white/80 text-sm font-medium text-slate-700 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/60 dark:text-slate-200"
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            aria-label="Rows per page"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="hidden text-xs font-medium text-slate-500 dark:text-slate-300 sm:inline-flex">
            Page {currentPage} of {pageCount}
          </span>
          <button
            className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/70 bg-white/80 text-slate-600 shadow-sm transition dark:border-slate-700/70 dark:bg-slate-900/60 dark:text-slate-200 ${
              !canPreviousPage
                ? "cursor-not-allowed opacity-40"
                : "hover:border-primary-300 hover:text-primary-600"
            }`}
            onClick={() => gotoPage(0)}
            disabled={!canPreviousPage}
            aria-label="First page"
          >
            <Icon icon="heroicons-outline:chevron-double-left" />
          </button>
          <button
            className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/70 bg-white/80 text-slate-600 shadow-sm transition dark:border-slate-700/70 dark:bg-slate-900/60 dark:text-slate-200 ${
              !canPreviousPage
                ? "cursor-not-allowed opacity-40"
                : "hover:border-primary-300 hover:text-primary-600"
            }`}
            onClick={() => previousPage()}
            disabled={!canPreviousPage}
            aria-label="Previous page"
          >
            <Icon icon="heroicons-outline:chevron-left" />
          </button>

          {generatePageNumbers().map((page) => (
            <button
              key={page}
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition ${
                page === pageIndex
                  ? "bg-primary-500 text-white shadow-sm"
                  : "border border-transparent bg-white/80 text-slate-600 hover:border-primary-200 hover:bg-primary-50 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:border-primary-500/40 dark:hover:bg-primary-500/10"
              }`}
              onClick={() => gotoPage(page)}
              aria-label={`Go to page ${page + 1}`}
              aria-current={page === pageIndex ? "page" : undefined}
            >
              {page + 1}
            </button>
          ))}

          <button
            className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/70 bg-white/80 text-slate-600 shadow-sm transition dark:border-slate-700/70 dark:bg-slate-900/60 dark:text-slate-200 ${
              !canNextPage
                ? "cursor-not-allowed opacity-40"
                : "hover:border-primary-300 hover:text-primary-600"
            }`}
            onClick={() => nextPage()}
            disabled={!canNextPage}
            aria-label="Next page"
          >
            <Icon icon="heroicons-outline:chevron-right" />
          </button>
          <button
            className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/70 bg-white/80 text-slate-600 shadow-sm transition dark:border-slate-700/70 dark:bg-slate-900/60 dark:text-slate-200 ${
              !canNextPage
                ? "cursor-not-allowed opacity-40"
                : "hover:border-primary-300 hover:text-primary-600"
            }`}
            onClick={() => gotoPage(pageCount - 1)}
            disabled={!canNextPage}
            aria-label="Last page"
          >
            <Icon icon="heroicons-outline:chevron-double-right" />
          </button>
        </div>

        <div className="flex items-center justify-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-300">
            Go to
          </span>
          <input
            type="number"
            className="form-control h-9 w-20 rounded-full border-slate-200/70 bg-white/80 text-sm font-medium text-slate-700 shadow-sm focus:border-primary-400 focus:ring-primary-400/40 dark:border-slate-700/70 dark:bg-slate-900/60 dark:text-slate-200"
            value={inputPage}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleInputBlur();
              }
            }}
            min={1}
            max={pageCount}
            disabled={pageCount === 0}
            aria-label="Go to page number"
          />
          <span className="text-xs font-medium text-slate-500 dark:text-slate-300">
            / {pageCount}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PaginationComponent;
