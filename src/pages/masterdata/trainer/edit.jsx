import Card from "@/components/ui/Card";
import { Tab } from "@headlessui/react";
import { Icon } from "@iconify/react";
import React, { useState } from "react";
import Biodata from "./biodata";
import { useLocation } from "react-router-dom";
import Jadwal from "./jadwal";
import JadwalBaru from "./jadwal-baru";

const Edit = () => {
  const location = useLocation();
  const { isupdate = "false", data = {} } = location.state ?? {};
  const buttons = [
    {
      title: "Biodata",
      icon: "heroicons-outline:user",
    },
    {
      title: "Jadwal",
      icon: "heroicons-outline:queue-list",
    },
  ];
  const [selectedData, setSelectedData] = useState(data);
  const updateData = (params) => {
    setSelectedData(params);
  };
  return (
    <div className="grid grid-cols-1 gap-6">
      <Card>
        <Tab.Group>
          <Tab.List className="lg:space-x-8 md:space-x-4 space-x-0 rtl:space-x-reverse">
            {buttons.map((item, i) => (
              <Tab key={i}>
                {({ selected }) => (
                  <button
                    className={` inline-flex items-start text-sm font-medium mb-7 capitalize bg-white dark:bg-slate-800 ring-0 foucs:ring-0 focus:outline-none px-2 transition duration-150 before:transition-all before:duration-150 relative before:absolute
               before:left-1/2 before:bottom-[-6px] before:h-[1.5px]
                before:bg-primary-500 before:-translate-x-1/2
        
        ${
          selected
            ? "text-primary-500 before:w-full"
            : "text-slate-500 before:w-0 dark:text-slate-300"
        }
        `}
                  >
                    <span className="text-base relative top-[1px] ltr:mr-1 rtl:ml-1">
                      <Icon icon={item.icon} />
                    </span>
                    {item.title}
                  </button>
                )}
              </Tab>
            ))}
          </Tab.List>
          <Tab.Panels>
            <Tab.Panel>
              <Biodata
                isupdate={isupdate}
                data={selectedData}
                updatedData={updateData}
              />
            </Tab.Panel>
            <Tab.Panel>
              {/* <Jadwal data={data} /> */}
              <JadwalBaru data={selectedData} />
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </Card>
    </div>
  );
};

export default Edit;
