import Tooltip from "@/components/ui/Tooltip";
import Icon from "@/components/ui/Icon";

const TableAction = ({ action, row }) => {
  const getClassName = (action) =>
    action.className
      ? action.className
      : "hover:bg-slate-900 hover:text-white dark:hover:bg-slate-600 dark:hover:bg-opacity-50";

  return (
    <Tooltip placement="top" arrow content={action.name}>
      <button
        type="button"
        aria-label={action.name}
        onClick={(event) => {
          event.stopPropagation();
          action.onClick?.(row);
        }}
        className={`
          flex h-10 w-10 items-center justify-center rounded-md border border-transparent bg-transparent text-slate-600 transition-colors
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2
          dark:text-slate-300 dark:ring-offset-slate-800
          ${getClassName(action)}
        `}
      >
        <Icon icon={action.icon} width={18} height={18} />
      </button>
    </Tooltip>
  );
};

export default TableAction;
