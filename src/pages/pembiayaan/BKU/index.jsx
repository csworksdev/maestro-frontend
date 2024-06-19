import React, { Fragment, useState, useEffect, useRef } from "react";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import { Tab, Disclosure, Transition } from "@headlessui/react";
import Button from "@/components/ui/Button";
import TableCreate from "./table/TableCreate";
import TableBKU from "./table/TableBKU";
import { getlistBku, getBkuDibuat } from "../components/axios/bku";
import { useReactToPrint } from "react-to-print";
import Print from "./table/print";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import Loading from "@/components/Loading";

const buttons = [
  {
    title: "Pembuatan BKU",
    icon: "heroicons-outline:home",
  },
  {
    title: "Buku Kas Umum",
    icon: "heroicons-outline:user",
  },
];

const Bulan = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const Tahun = ["2021", "2022", "2023", "2024"];

const styles = {
  option: (provided, state) => ({
    ...provided,
    fontSize: "14px",
  }),
};

const BKU = () => {
  const componentRef = useRef(null);
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    pageStyle: (
      <style type="text/css" media="print">
        {
          "\
   @page { size: landscape; }\
"
        }
      </style>
    ),
  });
  const [ListDataDibuat, setListDataDibuat] = useState([]);
  const [listDataBku, setListDataBku] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = () => {
    getBkuDibuat()
      .then((res) => {
        setListDataDibuat(res.data.data);
      })
      .finally(() => setIsLoading(false));
    getlistBku().then((res) => {
      setListDataBku(res.data.data);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const tahunKe = [
    { value: "--Pilih Tahapan--", label: "--Pilih Tahapan--" },
    { value: "strawberry", label: "Strawberry" },
    { value: "vanilla", label: "Vanilla" },
  ];

  return (
    <div className="grid grid-cols-1">
      <Card title="Pembukuan SP2D">
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
              <div className="flex gap-3">
                <Modal
                  title="Cetak Register"
                  label="Cetak Register "
                  labelClass="btn-primary"
                  themeClass="bg-primary-500"
                  uncontrol
                  icon={"ic:sharp-plus"}
                  className="max-w-5xl"
                  footerContent={
                    <Button
                      text="Cetak Register"
                      className="btn-primary "
                      onClick={() => {
                        handlePrint();
                      }}
                    />
                  }
                >
                  <Card>
                    <div className="flex">
                      <Select
                        className="react-select"
                        classNamePrefix="select"
                        defaultValue={Bulan[0]}
                        options={Bulan}
                        styles={styles}
                        horizontal={"true"}
                        id="hh"
                        label={"Saldo Awal "}
                      />
                      <Select
                        className="react-select"
                        classNamePrefix="select"
                        defaultValue={Tahun[0]}
                        options={Tahun}
                        styles={styles}
                        horizontal={"true"}
                        id="hh"
                        label={"Tahapan BKU yang akan dicetak"}
                      />
                    </div>
                  </Card>
                  <div className="hidden">
                    <Print ref={componentRef} />
                  </div>
                </Modal>
              </div>
            </div>
          </Tab.List>
          {isLoading ? (
            <Loading />
          ) : (
            <Tab.Panels>
              <Tab.Panel>
                <TableCreate listData={ListDataDibuat} />
              </Tab.Panel>
              <Tab.Panel>
                <TableBKU listData={listDataBku} />
              </Tab.Panel>
            </Tab.Panels>
          )}
        </Tab.Group>
      </Card>
    </div>
  );
};

export default BKU;
