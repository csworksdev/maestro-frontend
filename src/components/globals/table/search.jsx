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
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (value !== searchValue) {
        handleSearch(value);
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [value]);

  const themeClasses =
    theme === "dark"
      ? "border-gray-600 bg-gray-800 text-white placeholder-gray-400"
      : "border-gray-300 bg-white text-gray-900 placeholder-gray-500";

  return (
    <div className="flex flex-col justify-end">
      {/* <label
        htmlFor="search-input"
        className="mb-1 text-sm font-medium text-gray-700"
      >
        Pencarian
      </label> */}
      <div className="relative">
        <input
          id="search-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className={`w-full py-2 px-4 pr-12 border rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${themeClasses}`}
          aria-label="Search input"
        />
        <Button
          className={`absolute inset-y-0 right-0 flex items-center px-3 ${
            isLoading ? "cursor-not-allowed opacity-50" : "hover:bg-indigo-600"
          } btn-primary bg-indigo-500 text-white rounded-r-md`}
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
