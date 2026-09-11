import React from "react";
import Icon from "@/components/ui/Icon";
import getErrorMessage from "@/utils/careerErrorMessage";

function CareerErrorState({
  error,
  fallback,
  onRetry,
  isRetrying = false,
  title = "Data belum dapat ditampilkan",
  className = "",
  compact = false,
}) {
  return (
    <div
      className={`flex w-full flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-5 text-center dark:border-slate-700 dark:bg-slate-800/70 ${compact ? "min-h-0 py-5" : "min-h-[190px] py-10"} ${className}`}
      role="alert"
    >
      <span className={`${compact ? "mb-3 h-10 w-10" : "mb-4 h-12 w-12"} inline-flex items-center justify-center rounded-full bg-warning-500/10 text-warning-600 dark:text-warning-400`}>
        <Icon icon="heroicons-outline:exclamation-triangle" width={25} />
      </span>
      <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
        {title}
      </h3>
      <p className="mt-2 max-w-lg text-sm leading-6 text-slate-500 dark:text-slate-300">
        {getErrorMessage(error, fallback)}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          disabled={isRetrying}
          className="mt-5 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Icon
            icon="heroicons-outline:refresh"
            width={18}
            className={isRetrying ? "animate-spin" : ""}
          />
          {isRetrying ? "Memuat ulang..." : "Coba lagi"}
        </button>
      )}
    </div>
  );
}

export default CareerErrorState;
