import React, { createContext, useContext, useMemo, useState } from "react";

const defaultFilter = {
  filter_type: "semester",
  filter_value: 1,
  filter_year: 2026,
  filter_branch_id: "",
  filter_pool_id: "",
};

const GlobalFilterContext = createContext(null);

export const GlobalFilterProvider = ({ children }) => {
  const [filter, setFilter] = useState(defaultFilter);

  const setFilterValue = (key, value) => {
    setFilter((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilter = () => {
    setFilter(defaultFilter);
  };

  const value = useMemo(
    () => ({
      filter,
      setFilter,
      setFilterValue,
      resetFilter,
    }),
    [filter],
  );

  return (
    <GlobalFilterContext.Provider value={value}>
      {children}
    </GlobalFilterContext.Provider>
  );
};

export const useGlobalFilter = () => {
  const context = useContext(GlobalFilterContext);

  if (!context) {
    throw new Error("useGlobalFilter must be used within GlobalFilterProvider");
  }

  return context;
};
