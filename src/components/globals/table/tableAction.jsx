import Tooltip from "@/components/ui/Tooltip";
import Icon from "@/components/ui/Icon";

const TableAction = ({ action, row }) => {
  const getClassName = (action) =>
    action.className
      ? action.className
      : "hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 dark:hover:border-primary-500/50 dark:hover:bg-primary-500/10";

  return (
    <Tooltip placement="top" arrow content={action.name}>
      <button
        type="button"
        aria-label={action.name}
        onClick={(event) => {
          event.stopPropagation();
          action.onClick?.(row);
        }}
        className={`group inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/70 bg-white/80 text-slate-600 shadow-sm transition
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/60 focus-visible:ring-offset-2
          dark:border-slate-700/70 dark:bg-slate-900/60 dark:text-slate-200 dark:ring-offset-slate-800
          ${getClassName(action)}`}
      >
        <Icon
          icon={action.icon}
          width={18}
          height={18}
          className="transition-transform duration-200 group-hover:scale-105"
        />
      </button>
    </Tooltip>
  );
};

export default TableAction;
