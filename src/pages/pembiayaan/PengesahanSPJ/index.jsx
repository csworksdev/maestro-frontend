import React, { Fragment, useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import { Tab, Disclosure, Transition } from "@headlessui/react";
import Create from "./table/create";
import SptjmSpm from "./table/sptjmSpm";
import {
  getSpjDisahkan,
  getListPengesahanSpj,
} from "../components/axios/pengesahan-spj";
import Loading from "@/components/Loading";
const buttons = [
  {
    title: "Pengesahan SPJ",
    icon: "heroicons-outline:plus",
  },
  {
    title: "SPJ Disahkan",
    icon: "heroicons-outline:document",
  },
];

const styles = {
  option: (provided, state) => ({
    ...provided,
    fontSize: "14px",
  }),
};

const PengesahanSPJ = () => {
  const [ListDataSpjPengesahan, setListDataSpjPengesahan] = useState([]);
  const [listDataSpjDisahkan, setListDataSpjDisahkan] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const loadData = () => {
    getListPengesahanSpj()
      .then((res) => {
        setListDataSpjPengesahan(res.data.data);
      })
      .finally(() => setIsLoading(false));
    getSpjDisahkan().then((res) => {
      setListDataSpjDisahkan(res.data.data);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="grid grid-cols-1">
      <Card title="Pengesahan Laporan Pertanggungjawaban (SPJ)">
        <Tab.Group>
          <Tab.List className="lg:space-x-8 md:space-x-4 space-x-0 rtl:space-x-reverse">
            <div className="flex justify-between content-center">
              <div className="flex">
                {buttons.map((item, i) => (
                  <Tab as={Fragment} key={i}>
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
              </div>
            </div>
          </Tab.List>
          {isLoading ? (
            <Loading />
          ) : (
            <Tab.Panels>
              <Tab.Panel>
                <Create listData={ListDataSpjPengesahan} />
              </Tab.Panel>
              <Tab.Panel>
                <SptjmSpm listData={listDataSpjDisahkan} />
              </Tab.Panel>
            </Tab.Panels>
          )}
        </Tab.Group>
      </Card>
    </div>
  );
};

export default PengesahanSPJ;
