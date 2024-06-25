import React from "react";
import { useTable, usePagination } from "react-table";
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
  console.log(pageCount);
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

  return (
    <div className="md:flex md:space-y-0 space-y-5 justify-between mt-6 items-center">
      <div className="flex items-center space-x-3 rtl:space-x-reverse">
        <span className="flex space-x-2 rtl:space-x-reverse items-center">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
            Page Size
          </span>
          <select
            className="form-control py-2"
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </span>
      </div>
      <ul className="flex items-center space-x-3 rtl:space-x-reverse">
        <li className="text-xl leading-4 text-slate-900 dark:text-white rtl:rotate-180">
          <button
            className={`${
              !canPreviousPage ? "opacity-50 cursor-not-allowed" : ""
            }`}
            onClick={() => previousPage()}
            disabled={!canPreviousPage}
          >
            <Icon icon="heroicons-outline:chevron-left" />
          </button>
        </li>
        {generatePageNumbers().map((page) => (
          <li key={page}>
            <button
              aria-current="page"
              className={`${
                page === pageIndex
                  ? "bg-slate-900 dark:bg-slate-600 dark:text-slate-200 text-white font-medium"
                  : "bg-slate-100 dark:bg-slate-700 dark:text-slate-400 text-slate-900 font-normal"
              } text-sm rounded leading-[16px] flex h-6 w-6 items-center justify-center transition-all duration-150`}
              onClick={() => gotoPage(page)}
            >
              {page + 1}
            </button>
          </li>
        ))}
        <li className="text-xl leading-4 text-slate-900 dark:text-white rtl:rotate-180">
          <button
            className={`${!canNextPage ? "opacity-50 cursor-not-allowed" : ""}`}
            onClick={() => nextPage()}
            disabled={!canNextPage}
          >
            <Icon icon="heroicons-outline:chevron-right" />
          </button>
        </li>
      </ul>
    </div>
  );
};

export default PaginationComponent;
