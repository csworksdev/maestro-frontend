import Tooltip from "@/components/ui/Tooltip";
import Icon from "@/components/ui/Icon";

const TableAction = ({ action, index, row }) => {
  const getClassName = (action) =>
    action.className
      ? action.className
      : "hover:bg-slate-900 hover:text-white dark:hover:bg-slate-600 dark:hover:bg-opacity-50";
  return (
    <>
      <Tooltip placement="top" arrow content={action.name}>
        <div
          className={`
      ${getClassName(action)}
      w-full border-b border-b-gray-500 border-opacity-10 p-2 text-sm last:mb-0 cursor-pointer 
      first:rounded-t last:rounded-b flex gap-2 items-center rtl:space-x-reverse
    `}
          onClick={(e) => action.onClick && action.onClick(row)}
          key={index}
        >
          <span className="text-base">
            <Icon icon={action.icon} />
          </span>
        </div>
      </Tooltip>
    </>
  );
};

export default TableAction;
