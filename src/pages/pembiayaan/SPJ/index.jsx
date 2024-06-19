import React, { Fragment, useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import { Tab, Disclosure, Transition } from "@headlessui/react";
import Button from "@/components/ui/Button";
import TableSPJ from "./table/TableSPJ";
import Modal from "@/components/ui/Modal";
import Textinput from "@/components/ui/Textinput";
import Textarea from "@/components/ui/Textarea";
import Select from "@/components/ui/Select";
import { getListSpj } from "../components/axios/spj";
import Loading from "@/components/Loading";

const buttons = [
  {
    title: "Surat Pertanggungjawaban",
    icon: "heroicons-outline:user",
  },
];
const furits = [
  { value: "chocolate", label: "Chocolate" },
  { value: "strawberry", label: "Strawberry" },
  { value: "vanilla", label: "Vanilla" },
];

const styles = {
  option: (provided, state) => ({
    ...provided,
    fontSize: "14px",
  }),
};
const SPJ = () => {
  const [ListDataSpj, setListDataSpj] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = () => {
    getListSpj()
      .then((res) => {
        setListDataSpj(res.data.data);
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="grid grid-cols-1">
      <Card title="Surat Pertanggungjawaban">
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
                  title="Buat SPJ"
                  label="Buat SPJ"
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
                        defaultValue={furits[0]}
                        options={furits}
                        styles={styles}
                        horizontal={"true"}
                        id="hh"
                        label={"Penandatanganan PPTK"}
                      />
                    </div>
                  </Card>
                </Modal>
              </div>
            </div>
          </Tab.List>
          <Tab.Panels>
            <Tab.Panel>
              {isLoading ? <Loading /> : <TableSPJ listData={ListDataSpj} />}
              {/* <TableSPJ listData={ListDataSpj} /> */}
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </Card>
    </div>
  );
};

export default SPJ;
