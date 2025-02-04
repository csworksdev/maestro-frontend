import { Icon } from "@iconify/react";
import _ from "lodash";

const Header = ({ data, icons, colors }) => {
  return (
    <>
      {data.map((item, i) => (
        <div
          className={`py-[18px] px-4 rounded-[6px] bg-[${colors[i]}] dark:bg-slate-900`}
          key={i}
        >
          <div className="flex items-center space-x-6 rtl:space-x-reverse">
            <div className="flex-none">
              {icons ? (
                <Icon
                  icon={`heroicons-outline:${icons[i]}`}
                  className="h-8 w-auto text-slate-900 dark:text-white"
                />
              ) : null}
            </div>
            <div className="flex-1">
              <div className="text-slate-800 dark:text-slate-300 text-sm mb-1 font-medium">
                {item.title}
              </div>
              <div className="text-slate-900 dark:text-white text-lg font-medium">
                {item.count.toLocaleString("id-ID")}
              </div>
            </div>
          </div>
        </div>
      ))}
    </>
  );
};

export default Header;
