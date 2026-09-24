import React, { useEffect, useState } from "react";
import Textinput from "@/components/ui/Textinput";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import { Icon } from "@iconify/react";

const PAYMENT_STATUS_OPTIONS = [
  { value: "paid", label: "Paid" },
  { value: "settled", label: "Settled" },
];

const EMPTY_FILTERS = {
  filter_start_date: "",
  filter_end_date: "",
  filter_payment_status: "",
};

const FilterSidebar = ({
  defaultFilters = EMPTY_FILTERS,
  isOpen = false,
  onChange,
  onClose,
}) => {
  const [filters, setFilters] = useState({
    ...EMPTY_FILTERS,
    ...defaultFilters,
  });
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    setFilters({ ...EMPTY_FILTERS, ...defaultFilters });
  }, [defaultFilters]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleEscape = (event) => {
      if (event.key === "Escape") onClose?.();
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  const isDateRangeInvalid = (nextFilters) =>
    nextFilters.filter_start_date &&
    nextFilters.filter_end_date &&
    nextFilters.filter_start_date > nextFilters.filter_end_date;

  const handleFieldChange = (field) => (e) => {
    const value = e.target.value;
    const nextFilters = { ...filters, [field]: value };
    setFilters(nextFilters);

    if (isDateRangeInvalid(nextFilters)) {
      setErrorMessage("Tanggal mulai tidak boleh lebih besar dari tanggal akhir.");
      return;
    }

    setErrorMessage("");
    onChange?.(nextFilters);
  };

  const handleReset = () => {
    setErrorMessage("");
    setFilters({ ...EMPTY_FILTERS });
    onChange?.({ ...EMPTY_FILTERS });
  };

  return (
    <>
      {isOpen && (
        <button
          type="button"
          aria-label="Tutup filter"
          className="fixed inset-0 z-[998] cursor-default bg-transparent"
          onClick={onClose}
        />
      )}
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-filter-title"
        aria-hidden={!isOpen}
        className={`fixed right-0 top-0 z-[999] flex h-full w-full max-w-sm flex-col bg-white shadow-2xl transition-transform duration-300 dark:bg-slate-800 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-700">
          <div>
            <h2 id="order-filter-title" className="text-lg font-semibold text-slate-900 dark:text-white">
              Filter Order
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Data otomatis diperbarui saat filter berubah.
            </p>
          </div>
          <button
            type="button"
            aria-label="Tutup sidebar filter"
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
            onClick={onClose}
          >
            <Icon icon="heroicons:x-mark" className="text-xl" />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-5">
          <Textinput
            type="date"
            label="Tanggal Mulai"
            id="filter_start_date"
            name="filter_start_date"
            value={filters.filter_start_date}
            onChange={handleFieldChange("filter_start_date")}
          />
          <Textinput
            type="date"
            label="Tanggal Akhir"
            id="filter_end_date"
            name="filter_end_date"
            value={filters.filter_end_date}
            onChange={handleFieldChange("filter_end_date")}
          />
          <Select
            label="Status Pembayaran"
            id="filter_payment_status"
            name="filter_payment_status"
            placeholder="Semua Status"
            options={PAYMENT_STATUS_OPTIONS}
            value={filters.filter_payment_status}
            onChange={handleFieldChange("filter_payment_status")}
          />

          {errorMessage && (
            <div role="alert" className="rounded border border-danger-200 bg-danger-50 px-3 py-2 text-sm text-danger-600">
              {errorMessage}
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 p-5 dark:border-slate-700">
          <Button type="button" className="btn-light w-full" onClick={handleReset}>
            Reset Filter
          </Button>
        </div>
      </aside>
    </>
  );
};

export default FilterSidebar;
export { EMPTY_FILTERS };
