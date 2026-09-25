import Card from "@/components/ui/Card";
import { Tab } from "@headlessui/react";
import { Icon } from "@iconify/react";
import React, { useState } from "react";
import Biodata from "./biodata";
import { useLocation, useNavigate } from "react-router-dom";
import Jadwal from "./jadwal";
import JadwalBaru from "./jadwal-baru";
import Button from "@/components/ui/Button";
import SpecializationList from "@/pages/referensi/trainerSpesialisasi/index";
import SpecializationForm from "@/pages/referensi/trainerSpesialisasi/edit";
import Dokumen from "./dokumen";

const Edit = () => {
  const navigate = useNavigate();
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
    {
      title: "Spesialisasi",
      icon: "heroicons-outline:puzzle-piece",
    },
    {
      title: "Dokumen",
      icon: "heroicons-outline:document-text",
    },
  ];
  const [selectedData, setSelectedData] = useState(data);
  const [specMode, setSpecMode] = useState("list"); // list | form
  const [specData, setSpecData] = useState({});
  const [specIsUpdate, setSpecIsUpdate] = useState(false);
  const [specRefreshKey, setSpecRefreshKey] = useState(0);
  const [specSelectedList, setSpecSelectedList] = useState([]);
  const updateData = (params) => {
    setSelectedData(params);
  };

  const handleSpecializationAdd = (payload) => {
    setSpecIsUpdate(false);
    setSpecData(payload.data || {});
    setSpecSelectedList(payload.current_specializations || []);
    setSpecMode("form");
  };

  const handleSpecializationEdit = (payload) => {
    setSpecIsUpdate(true);
    setSpecData(payload.data || {});
    setSpecSelectedList(payload.current_specializations || []);
    setSpecMode("form");
  };

  const handleSpecializationSaved = () => {
    setSpecMode("list");
    setSpecData({});
    setSpecSelectedList([]);
    setSpecRefreshKey((prev) => prev + 1);
  };

  const handleSpecializationCancel = () => {
    setSpecMode("list");
    setSpecData({});
    setSpecSelectedList([]);
  };
  return (
    <>
      <Button
        text="Kembali"
        onClick={(e) => {
          e.preventDefault();
          navigate(-1);
        }}
        type="button"
        className="bg-primary-500 text-white mb-4"
        icon="heroicons-outline:arrow-uturn-left"
      />
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <Tab.Group>
            <Tab.List className="lg:space-x-8 md:space-x-4 space-x-0 rtl:space-x-reverse">
              {buttons.map((item, i) => (
                <Tab
                  key={i}
                  className={({ selected }) => `relative mb-7 inline-flex items-start bg-white px-2 text-sm font-medium capitalize ring-0 transition duration-150 before:absolute before:bottom-[-6px] before:left-1/2 before:h-[1.5px] before:-translate-x-1/2 before:bg-primary-500 before:transition-all before:duration-150 focus:outline-none dark:bg-slate-800 ${
                    selected
                      ? "text-primary-500 before:w-full"
                      : "text-slate-500 before:w-0 dark:text-slate-300"
                  }`}
                >
                  <span className="relative top-[1px] text-base ltr:mr-1 rtl:ml-1">
                    <Icon icon={item.icon} />
                  </span>
                  {item.title}
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
              <Tab.Panel>
                {specMode === "list" ? (
                  <SpecializationList
                    trainerId={selectedData.trainer_id}
                    onAdd={handleSpecializationAdd}
                    onEdit={handleSpecializationEdit}
                    refreshKey={specRefreshKey}
                    title="Spesialisasi Trainer"
                  />
                ) : (
                  <SpecializationForm
                    trainerId={selectedData.trainer_id}
                    data={specData}
                    isupdate={specIsUpdate ? "true" : "false"}
                    selectedSpecializations={specSelectedList}
                    onSaved={handleSpecializationSaved}
                    onCancel={handleSpecializationCancel}
                  />
                )}
              </Tab.Panel>
              <Tab.Panel>
                <Dokumen trainerId={selectedData.trainer_id} />
              </Tab.Panel>
            </Tab.Panels>
          </Tab.Group>
        </Card>
      </div>
    </>
  );
};

export default Edit;
