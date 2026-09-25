import React, { useEffect, useState } from "react";
import { useGlobalFilter } from "@/contexts/GlobalFilterContext";
import FilterSidebar from "@/components/ui/FilterSidebar";

const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

const GlobalChartFilter = () => {
  const { filter, setFilterValue } = useGlobalFilter();

  const [type, setType] = useState(filter.filter_type || "semester");
  const [value, setValue] = useState(filter.filter_value ?? 1);
  const [year, setYear] = useState(
    filter.filter_year || new Date().getFullYear(),
  );
  const [isOpen, setIsOpen] = useState(false);

  // keep local -> global in sync
  useEffect(() => {
    setFilterValue("filter_type", type);
  }, [type]);

  useEffect(() => {
    setFilterValue("filter_value", value);
  }, [value]);

  useEffect(() => {
    setFilterValue("filter_year", Number(year));
  }, [year]);

  const renderValueInput = () => {
    switch (type) {
      case "month":
        return (
          <div className="flex gap-2 items-center">
            <select
              value={value}
              onChange={(e) => setValue(Number(e.target.value))}
              className="form-select px-3 py-2 border rounded"
            >
              {months.map((m, i) => (
                <option key={i} value={i + 1}>
                  {i + 1} - {m}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={2000}
              max={2100}
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="px-3 py-2 border rounded w-28"
            />
          </div>
        );
      case "quarter":
        return (
          <div className="flex gap-2 items-center">
            <select
              value={value}
              onChange={(e) => setValue(Number(e.target.value))}
              className="form-select px-3 py-2 border rounded"
            >
              {[1, 2, 3, 4].map((q) => (
                <option key={q} value={q}>
                  Q{q}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={2000}
              max={2100}
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="px-3 py-2 border rounded w-28"
            />
          </div>
        );
      case "semester":
        return (
          <div className="flex gap-2 items-center">
            <select
              value={value}
              onChange={(e) => setValue(Number(e.target.value))}
              className="form-select px-3 py-2 border rounded"
            >
              {[1, 2].map((s) => (
                <option key={s} value={s}>
                  Semester {s}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={2000}
              max={2100}
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="px-3 py-2 border rounded w-28"
            />
          </div>
        );
      case "year":
        return (
          <div className="flex gap-2 items-center">
            <input
              type="number"
              min={2000}
              max={2100}
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="px-3 py-2 border rounded w-40"
            />
          </div>
        );
      case "week":
      default:
        return <div className="text-sm text-slate-600">No extra input</div>;
    }
  };

  return (
    <FilterSidebar
      open={isOpen}
      onOpen={() => setIsOpen(true)}
      onClose={() => setIsOpen(false)}
      title="Filter Dashboard"
      activeCount={3}
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3">
          {["week", "month", "quarter", "semester", "year"].map((t) => (
            <label key={t} className="inline-flex items-center gap-2">
              <input
                type="radio"
                name="global-chart-filter"
                value={t}
                checked={type === t}
                onChange={() => {
                  setType(t);
                  // set sensible defaults
                  if (t === "week") setValue(7);
                  if (t === "month") setValue(1);
                  if (t === "quarter") setValue(1);
                  if (t === "semester") setValue(1);
                  if (t === "year") setValue(year);
                }}
              />
              <span className="capitalize">{t}</span>
            </label>
          ))}
        </div>

        <div>{renderValueInput()}</div>
      </div>
    </FilterSidebar>
  );
};

export default GlobalChartFilter;
