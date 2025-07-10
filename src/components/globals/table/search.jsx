import React, { useState, useEffect } from "react";
import Button from "@/components/ui/Button";

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
      ? "border-gray-600 bg-gray-800 text-white placeholder-gray-400"
      : "border-gray-300 bg-white text-gray-900 placeholder-gray-500";

  return (
    <div className="w-full flex justify-end mb-5">
      <div className="relative w-[400px]">
        <input
          id="search-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className={`w-full py-2 px-4 pr-20 border rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${themeClasses}`}
          aria-label="Search input"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSearch(value);
            }
          }}
        />
        <Button
          className={`absolute top-1/2 -translate-y-1/2 right-0 h-[40px] flex items-center justify-center px-3 ${
            isLoading ? "cursor-not-allowed opacity-50" : "hover:bg-indigo-600"
          } btn-primary bg-indigo-500 text-white rounded-r-md w-20`}
          onClick={() => handleSearch(value)}
          disabled={isLoading}
          icon={
            isLoading ? "heroicons-outline:refresh" : "heroicons-outline:search"
          }
        >
          {isLoading ? "Memuat..." : "Cari"}
        </Button>
      </div>
    </div>
  );
};

export default Search;
