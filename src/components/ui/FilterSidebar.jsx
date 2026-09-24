import React, { useEffect } from "react";
import Icon from "@/components/ui/Icon";

const FilterSidebar = ({
  open,
  onOpen,
  onClose,
  title = "Filter",
  description = "Data otomatis diperbarui saat filter berubah.",
  activeCount = 0,
  children,
  widthClass = "max-w-md",
  contentClassName = "",
}) => {
  useEffect(() => {
    if (!open) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open, onClose]);

  return (
    <>
      <button
        type="button"
        aria-label={`Buka ${title.toLowerCase()}`}
        aria-expanded={open}
        onClick={onOpen}
        className="fixed right-0 top-1/2 z-[890] flex -translate-y-1/2 items-center gap-2 rounded-l-lg bg-slate-800 px-3 py-3 text-sm font-medium text-white shadow-lg transition-colors hover:bg-primary-600 dark:bg-slate-700 dark:hover:bg-primary-600"
      >
        <Icon icon="heroicons-outline:adjustments-horizontal" className="text-lg" />
        <span className="hidden sm:inline">Filter</span>
        {activeCount > 0 && (
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-500 px-1 text-xs font-semibold text-white">
            {activeCount}
          </span>
        )}
      </button>

      {open && (
        <button
          type="button"
          aria-label={`Tutup ${title.toLowerCase()}`}
          className="fixed inset-0 z-[998] cursor-default bg-transparent"
          onClick={onClose}
        />
      )}

      <aside
        role="dialog"
        aria-modal="true"
        aria-hidden={!open}
        aria-label={title}
        className={`fixed right-0 top-0 z-[999] flex h-full w-full ${widthClass} flex-col bg-white shadow-2xl transition-transform duration-300 dark:bg-slate-800 ${
          open ? "translate-x-0" : "invisible translate-x-full pointer-events-none"
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-700">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
            {description && (
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{description}</p>
            )}
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
        <div className={`min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-5 sm:p-6 ${contentClassName}`}>
          {children}
        </div>
      </aside>
    </>
  );
};

export default FilterSidebar;
