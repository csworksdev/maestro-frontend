import React, { Fragment, useEffect, useRef, useState } from "react";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import { Tab, Disclosure, Transition } from "@headlessui/react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Textinput from "@/components/ui/Textinput";
import Textarea from "@/components/ui/Textarea";
import Select from "@/components/ui/Select";
import Pembuatan from "./table/Pembuatan";
import STS from "./table/SuratTandaSetoran";
import TBP from "./table/TandaBuktiPengeluaran";
import {
  getTbpStsDibuat,
  getListTbp,
  getListSts,
} from "../components/axios/tbp-sts";
import { useReactToPrint } from "react-to-print";
import Print from "./table/print";
import Loading from "@/components/Loading";

const buttons = [
  {
    title: "Pembuatan TBP & STS",
    icon: "heroicons-outline:home",
  },
  {
    title: "Tanda Bukti Pengeluaran (TBP)",
    icon: "heroicons-outline:user",
  },
  {
    title: "Surat Tanda Setoran (STS)",
    icon: "heroicons-outline:chat-alt-2",
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

const TbpSts = () => {
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

  const [listDataDibuat, setListDataDibuat] = useState([]);
  const [listDataTbp, setListDataTbp] = useState([]);
  const [listDataSts, setListDataSts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = () => {
    getTbpStsDibuat()
      .then((res) => {
        setListDataDibuat(res.data.data);
      })
      .finally(() => setIsLoading(false));
    getListTbp().then((res) => {
      setListDataTbp(res.data.data);
    });
    getListSts().then((res) => {
      setListDataSts(res.data.data);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const styles = {
    option: (provided, state) => ({
      ...provided,
      fontSize: "14px",
    }),
  };

  return (
    <div className="grid grid-cols-1">
      <Card title="Tanda Bukti Pengeluaran & Surat Tanda Setoran (TBP & STS)">
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
                {/* <Button text={"Buat TbpSts LS"} icon={"ic:sharp-plus"} /> */}
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
                    <div className="flex flex-col gap-5">
                      <div className="flex flex-row gap-5">
                        <Select
                          className="react-select"
                          classNamePrefix="select"
                          defaultValue={Bulan[0]}
                          options={Bulan}
                          styles={styles}
                          horizontal={"true"}
                          id="hh"
                          label={"Dari :"}
                        />
                        <Select
                          className="react-select"
                          classNamePrefix="select"
                          defaultValue={Tahun[0]}
                          options={Tahun}
                          styles={styles}
                          horizontal={"true"}
                          id="hh"
                          // label={"Penandatanganan PPTK"}
                        />
                      </div>
                      <div className="flex flex-row gap-5">
                        <Select
                          className="react-select"
                          classNamePrefix="select"
                          defaultValue={Bulan[0]}
                          options={Bulan}
                          styles={styles}
                          horizontal={"true"}
                          id="hh"
                          label={"Sampai :"}
                        />
                        <Select
                          className="react-select"
                          classNamePrefix="select"
                          defaultValue={Tahun[0]}
                          options={Tahun}
                          styles={styles}
                          horizontal={"true"}
                          id="hh"
                          // label={"Penandatanganan PPTK"}
                        />
                      </div>
                    </div>
                  </Card>
                  <div className="hidden">
                    <Print ref={componentRef} />
                  </div>
                </Modal>
                {/* <Button text={"Cetak Register"} icon={"akar-icons:paper"} /> */}
              </div>
            </div>
          </Tab.List>
          {isLoading ? (
            <Loading />
          ) : (
            <Tab.Panels>
              <Tab.Panel>
                <Pembuatan listData={listDataDibuat} />
              </Tab.Panel>
              <Tab.Panel>
                <TBP listData={listDataTbp} />
              </Tab.Panel>
              <Tab.Panel>
                <STS listData={listDataSts} />
              </Tab.Panel>
              {/* <Tab.Panel>
              <Ditolak />
            </Tab.Panel> */}
            </Tab.Panels>
          )}
        </Tab.Group>
      </Card>
    </div>
  );
};

export default TbpSts;
