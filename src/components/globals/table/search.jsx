import React, { useState, useEffect } from "react";
import Icon from "@/components/ui/Icon";

const Search = ({
  searchValue,
  handleSearch,
  isLoading = false,
  theme = "light",
  placeholder = "Pencarian",
}) => {
  const [value, setValue] = useState(searchValue);

  useEffect(() => {
    setValue(searchValue);
  }, [searchValue]);

  // Debounce handleSearch
  // useEffect(() => {
  //   const timeout = setTimeout(() => {
  //     if (value !== searchValue) {
  //       handleSearch(value);
  //     }
  //   }, 500);
  //   return () => clearTimeout(timeout);
  // }, [value]);

  const themeClasses =
    theme === "dark"
      ? "border-slate-700/70 from-slate-900/80 via-slate-900/60 to-slate-800/60"
      : "border-slate-200/70 from-white via-slate-50 to-slate-100/80";

  const inputThemeClasses =
    theme === "dark"
      ? "text-slate-100 placeholder-slate-400"
      : "text-slate-900 placeholder-slate-500";

  return (
    <div className="w-full flex justify-end mb-5">
      <div className="w-full sm:max-w-[460px]">
        <div
          className={`relative rounded-2xl border bg-gradient-to-br shadow-sm transition focus-within:border-primary-300 focus-within:ring-2 focus-within:ring-primary-500/30 ${themeClasses}`}
        >
          <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            <Icon icon="heroicons-outline:search" width={18} />
          </div>
        <input
          id="search-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          type="search"
          className={`w-full bg-transparent py-3 pl-11 pr-28 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500/40 ${inputThemeClasses}`}
          aria-label="Search input"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSearch(value);
            }
          }}
        />
        <button
          type="button"
          className={`absolute right-2 top-1/2 inline-flex h-9 -translate-y-1/2 items-center gap-2 rounded-full px-4 text-xs font-semibold uppercase tracking-wide shadow-sm transition ${
            isLoading
              ? "cursor-not-allowed bg-slate-200 text-slate-400 dark:bg-slate-700 dark:text-slate-300"
              : "bg-primary-500 text-white hover:bg-primary-600"
          }`}
          onClick={() => handleSearch(value)}
          disabled={isLoading}
          aria-label="Submit search"
        >
          <Icon
            icon={isLoading ? "heroicons-outline:refresh" : "heroicons-outline:search"}
            width={16}
            className={isLoading ? "animate-spin" : ""}
          />
          {isLoading ? "Memuat..." : "Cari"}
        </button>
        </div>
      </div>
    </div>
  );
};

export default Search;
