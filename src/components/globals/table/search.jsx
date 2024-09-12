import Button from "@/components/ui/Button";
import Textinput from "@/components/ui/Textinput";
import React, { useState, useEffect } from "react";

const Search = ({ searchValue, handleSearch, theme = "light" }) => {
  const [value, setValue] = useState(searchValue);

  useEffect(() => {
    setValue(searchValue);
  }, [searchValue]);

  const onChange = (e) => {
    setValue(e.target.value);
  };

  const handleClick = () => {
    handleSearch(value);
  };

  const themeClasses =
    theme === "dark" ? "bg-gray-800 text-white" : "bg-white text-gray-900";

  return (
    <div className={`mb-4 flex justify-end ${themeClasses}`}>
      <div className="relative w-full max-w-md">
        <Textinput
          value={value || ""}
          onChange={onChange}
          placeholder="Pencarian"
          className={`w-full p-2 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${
            theme === "dark"
              ? "border-gray-600 bg-gray-700 text-white"
              : "border-gray-300 bg-white text-gray-900"
          }`}
          aria-label="Search Input"
          handleClick={handleClick}
        />
        <Button
          className={`absolute inset-y-0 right-0 flex items-center pr-3 btn-primary ${
            theme === "dark"
              ? "bg-indigo-600 text-white"
              : "bg-indigo-500 text-white"
          }`}
          onClick={handleClick}
          icon="heroicons-outline:adjustments-vertical"
          aria-label="Search Button"
        >
          Cari
        </Button>
      </div>
    </div>
  );
};

export default Search;
