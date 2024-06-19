import React, { Fragment, useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import { Tab, Disclosure, Transition } from "@headlessui/react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Textinput from "@/components/ui/Textinput";
import Textarea from "@/components/ui/Textarea";
import Select from "@/components/ui/Select";
import Verifikasi from "./table/verifikasi";
import TerVerifikasi from "./table/terverifikasi";
import {
  getVerifikasiLPJ,
  getLPJTerverifikasi,
} from "../components/axios/verifikasi-lpj";
import Loading from "@/components/Loading";

const buttons = [
  {
    title: "Verifikasi LPJ",
    icon: "heroicons-outline:home",
  },
  {
    title: "LPJ Terverifikasi",
    icon: "heroicons-outline:user",
  },
];

const styles = {
  option: (provided, state) => ({
    ...provided,
    fontSize: "14px",
  }),
};

const VerifikasiLPJ = () => {
  const [listDataVerifikasiLPJ, setListDataVerifikasiLPJ] = useState([]);
  const [listDataLPJTerverifikasi, setListDataLPJTerverifikasi] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = () => {
    getVerifikasiLPJ()
      .then((res) => {
        setListDataVerifikasiLPJ(res.data.data);
      })
      .finally(() => setIsLoading(false));
    getLPJTerverifikasi().then((res) => {
      setListDataLPJTerverifikasi(res.data.data);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="grid grid-cols-1">
      <Card title="Verifikasi Laporan Pertanggungjawaban (LPJ)">
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
                <Verifikasi listData={listDataVerifikasiLPJ} />
              </Tab.Panel>
              <Tab.Panel>
                <TerVerifikasi listData={listDataLPJTerverifikasi} />
              </Tab.Panel>
              <Tab.Panel>{/* <Ditolak /> */}</Tab.Panel>
              <Tab.Panel>{/* <Batal /> */}</Tab.Panel>
            </Tab.Panels>
          )}
        </Tab.Group>
      </Card>
    </div>
  );
};

export default VerifikasiLPJ;
