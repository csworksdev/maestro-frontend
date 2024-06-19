import React, { Fragment, useRef, useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import { Tab, Disclosure, Transition } from "@headlessui/react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Textinput from "@/components/ui/Textinput";
import Textarea from "@/components/ui/Textarea";
import Select from "@/components/ui/Select";
import Dibuat from "./table/Dibuat";
import Diterima from "./table/Diterima";
import Ditolak from "./table/Ditolak";
import Batal from "./table/Batal";
import {
  getSppBatal,
  getSppDibuat,
  getSppDiterima,
  getSppDitolak,
} from "../components/axios/spp";
import { useReactToPrint } from "react-to-print";
import Print from "./table/print";
import Loading from "@/components/Loading";

const buttons = [
  {
    title: "SPP LS Dibuat",
    icon: "heroicons-outline:home",
  },
  {
    title: "SPP LS Diterima",
    icon: "heroicons-outline:user",
  },
  {
    title: "SPP LS Ditolak",
    icon: "heroicons-outline:chat-alt-2",
  },
  {
    title: "SPP LS Batal",
    icon: "heroicons-outline:cog",
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

const SPP = () => {
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
  const [listDataDiterima, setListDataDiterima] = useState([]);
  const [listDataDitolak, setListDataDitolak] = useState([]);
  const [listDataBatal, setListDataBatal] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = () => {
    getSppDibuat()
      .then((res) => {
        setListDataDibuat(res.data.data);
      })
      .finally(() => setIsLoading(false));
    getSppDiterima().then((res) => {
      setListDataDiterima(res.data.data);
    });
    getSppDitolak().then((res) => {
      setListDataDitolak(res.data.data);
    });
    getSppBatal().then((res) => {
      setListDataBatal(res.data.data);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const bulanKe = [
    { value: "--Pilih Bulan--", label: "--Pilih Bulan--" },
    { value: "strawberry", label: "Strawberry" },
    { value: "vanilla", label: "Vanilla" },
  ];

  const tahunKe = [
    { value: "--Pilih Tahun--", label: "--Pilih Tahun--" },
    { value: "strawberry", label: "Strawberry" },
    { value: "vanilla", label: "Vanilla" },
  ];

  const bulanSampai = [
    { value: "--Pilih Tahun--", label: "--Pilih Tahun--" },
    { value: "strawberry", label: "Strawberry" },
    { value: "vanilla", label: "Vanilla" },
  ];

  const tahunSampai = [
    { value: "--Pilih Tahun--", label: "--Pilih Tahun--" },
    { value: "strawberry", label: "Strawberry" },
    { value: "vanilla", label: "Vanilla" },
  ];

  return (
    <div className="grid grid-cols-1">
      <Card title="Surat Permintaan Pembayaran (SPP)">
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
                {/* <Button text={"Buat SPP LS"} icon={"ic:sharp-plus"} /> */}
                <Modal
                  title="Buat SPP LS"
                  label="Buat SPP LS "
                  labelClass="btn-primary"
                  themeClass="bg-primary-500"
                  uncontrol
                  icon={"ic:sharp-plus"}
                  className="max-w-5xl"
                  footerContent={
                    <Button
                      text="Accept"
                      className="btn-primary "
                      onClick={() => {
                        alert("use Control Modal");
                      }}
                    />
                  }
                >
                  <Card>
                    <div className="space-y-4">
                      <Textinput
                        label="Nomor SPP"
                        id="nomorSPP"
                        type="text"
                        placeholder="Nomor SPP"
                        horizontal
                      />
                      <Textinput
                        label="Tanggal SPP"
                        id="tanggalSPP"
                        type="date"
                        placeholder="Tanggal SPP"
                        horizontal
                      />
                      <Textinput
                        label="Phone"
                        id="h_phone"
                        type="phone"
                        placeholder="Type your email"
                        horizontal
                      />
                      <Textarea
                        label="Keterangan"
                        id="keterangan"
                        placeholder="Keterangan"
                        horizontal
                      />
                      <Select
                        className="react-select"
                        classNamePrefix="select"
                        defaultValue={Bulan[0]}
                        options={Bulan}
                        styles={styles}
                        horizontal={"true"}
                        id="hh"
                        label={"Penandatanganan PPTK"}
                      />
                    </div>
                  </Card>
                </Modal>
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
              </div>
            </div>
          </Tab.List>
          {isLoading ? (
            <Loading />
          ) : (
            <Tab.Panels>
              <Tab.Panel>
                <Dibuat listData={listDataDibuat} />
              </Tab.Panel>
              <Tab.Panel>
                <Diterima listData={listDataDiterima} />
              </Tab.Panel>
              <Tab.Panel>
                <Ditolak listData={listDataDitolak} />
              </Tab.Panel>
              <Tab.Panel>
                <Batal listData={listDataBatal} />
              </Tab.Panel>
            </Tab.Panels>
          )}
        </Tab.Group>
      </Card>
    </div>
  );
};

export default SPP;
