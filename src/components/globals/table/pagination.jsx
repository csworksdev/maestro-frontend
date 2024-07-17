import React, { useState } from "react";
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
      <div className="flex items-center space-x-3 rtl:space-x-reverse">
        <button
          className={`text-xl leading-4 text-slate-900 dark:text-white transition-all duration-300 ${
            !canPreviousPage
              ? "opacity-50 cursor-not-allowed"
              : "hover:scale-110"
          }`}
          onClick={() => gotoPage(0)}
          disabled={!canPreviousPage}
        >
          <Icon icon="heroicons-outline:chevron-double-left" />
        </button>
        <button
          className={`text-xl leading-4 text-slate-900 dark:text-white transition-all duration-300 ${
            !canPreviousPage
              ? "opacity-50 cursor-not-allowed"
              : "hover:scale-110"
          }`}
          onClick={() => previousPage()}
          disabled={!canPreviousPage}
        >
          <Icon icon="heroicons-outline:chevron-left" />
        </button>
        {generatePageNumbers().map((page) => (
          <button
            key={page}
            aria-current="page"
            className={`text-sm rounded leading-[16px] flex h-6 w-6 items-center justify-center transition-all duration-300 ${
              page === pageIndex
                ? "bg-blue-500 text-white font-medium"
                : "bg-slate-100 dark:bg-slate-700 dark:text-slate-400 text-slate-900 font-normal hover:bg-blue-200"
            }`}
            onClick={() => gotoPage(page)}
          >
            {page + 1}
          </button>
        ))}
        <button
          className={`text-xl leading-4 text-slate-900 dark:text-white transition-all duration-300 ${
            !canNextPage ? "opacity-50 cursor-not-allowed" : "hover:scale-110"
          }`}
          onClick={() => nextPage()}
          disabled={!canNextPage}
        >
          <Icon icon="heroicons-outline:chevron-right" />
        </button>
        <button
          className={`text-xl leading-4 text-slate-900 dark:text-white transition-all duration-300 ${
            !canNextPage ? "opacity-50 cursor-not-allowed" : "hover:scale-110"
          }`}
          onClick={() => gotoPage(pageCount - 1)}
          disabled={!canNextPage}
        >
          <Icon icon="heroicons-outline:chevron-double-right" />
        </button>
      </div>
      <div className="flex items-center space-x-3 rtl:space-x-reverse">
        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
          Go to page:
        </span>
        <input
          type="number"
          className="form-control py-2"
          value={inputPage}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          min={1}
          max={pageCount}
          style={{ width: "70px" }}
        />
        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
          of {pageCount} Page
        </span>
      </div>
    </div>
  );
};

export default PaginationComponent;
