import Textinput from "@/components/ui/Textinput";
import React, { useState } from "react";

const Search = ({ filter, setFilter }) => {
  const [value, setValue] = useState(filter);
  const onChange = (e) => {
    setValue(e.target.value);
    setFilter(e.target.value || undefined);
  };
  return (
    <div className="mb-3">
      <div className="  merged">
        <div className="flex items-stretch inputGroup has-append has-prepend    ">
          {/* <span className="flex-none input-group-addon">
            <div className="input-group-text  h-full prepend-slot">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                />
              </svg>
            </div>
          </span> */}
          <div className="flex-1">
            <div className="relative fromGroup2   ">
              <Textinput
                value={value || ""}
                onChange={onChange}
                placeholder="Pencarian"
              />
              <div className="flex text-xl absolute ltr:right-[14px] rtl:left-[14px] top-1/2 -translate-y-1/2  space-x-1 rtl:space-x-reverse"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Search;
