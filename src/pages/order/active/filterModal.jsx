import React, { useState } from "react";
import Textinput from "@/components/ui/Textinput";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";

const PAYMENT_STATUS_OPTIONS = [
  { value: "paid", label: "Paid" },
  { value: "settled", label: "Settled" },
];

const EMPTY_FILTERS = {
  filter_start_date: "",
  filter_end_date: "",
  filter_payment_status: "",
};

const FilterModal = ({ defaultFilters = EMPTY_FILTERS, onApply, onClose }) => {
  const [filters, setFilters] = useState({
    ...EMPTY_FILTERS,
    ...defaultFilters,
  });
  const [errorMessage, setErrorMessage] = useState("");

  const handleFieldChange = (field) => (e) => {
    const value = e.target.value;
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleApply = () => {
    if (
      filters.filter_start_date &&
      filters.filter_end_date &&
      filters.filter_start_date > filters.filter_end_date
    ) {
      setErrorMessage("Tanggal mulai tidak boleh lebih besar dari tanggal akhir.");
      return;
    }
    setErrorMessage("");
    onApply?.(filters);
    onClose?.();
  };

  const handleReset = () => {
    setErrorMessage("");
    setFilters(EMPTY_FILTERS);
    onApply?.(EMPTY_FILTERS);
    onClose?.();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
      </div>

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
        <div className="rounded border border-danger-200 bg-danger-50 px-3 py-2 text-sm text-danger-600">
          {errorMessage}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" className="btn-light" onClick={handleReset}>
          Reset
        </Button>
        <Button type="button" className="btn-dark" onClick={handleApply}>
          Terapkan Filter
        </Button>
      </div>
    </div>
  );
};

export default FilterModal;
export { EMPTY_FILTERS };
