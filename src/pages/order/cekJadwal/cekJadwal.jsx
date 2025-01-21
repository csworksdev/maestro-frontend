import { getCabangAll } from "@/axios/referensi/cabang";
import { getKolamAll, getKolamByBranch } from "@/axios/referensi/kolam";
import Select from "@/components/ui/Select";
import { baseJadwal2 } from "@/constant/jadwal-default";
import { Tab } from "@headlessui/react";
import React, { useEffect, useState } from "react";
import AsyncSelect from "react-select/async";

const listPelatih = [
  { trainer_id: "1", fullname: "coach 1" },
  { trainer_id: "2", fullname: "coach 2" },
  { trainer_id: "3", fullname: "coach 3" },
  { trainer_id: "4", fullname: "coach 4" },
  { trainer_id: "5", fullname: "coach 5" },
  { trainer_id: "6", fullname: "coach 6" },
  { trainer_id: "7", fullname: "coach 7" },
  { trainer_id: "8", fullname: "coach 8" },
  { trainer_id: "9", fullname: "coach 9" },
  { trainer_id: "10", fullname: "coach 10" },
];

const CekJadwal = () => {
  const daysOfWeek = [
    "Senin",
    "Selasa",
    "Rabu",
    "Kamis",
    "Jumat",
    "Sabtu",
    "Minggu",
  ];

  const [tabHari, setTabHari] = useState(
    daysOfWeek.map((hari) => ({ hari, data: [] }))
  );

  const [branchOption, setBranchOption] = useState([]);
  const [poolOption, setPoolOption] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(
    localStorage.getItem("ScheduleSelected") || 0
  );

  const loadBranch = async () => {
    try {
      const params = {
        page: 1,
        page_size: 200,
        is_active: true,
      };
      const kolamResponse = await getCabangAll(params);

      const kolamOption = kolamResponse.data.results
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((item) => ({
          value: item.branch_id,
          label: item.name,
        }));

      setBranchOption(kolamOption);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadPool = async (branch_id) => {
    try {
      const params = {
        page: 1,
        page_size: 200,
        is_active: true,
      };
      const kolamResponse = await getKolamByBranch(branch_id, params);

      const kolamOption = kolamResponse.data.results
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((item) => ({
          value: item.pool_id,
          label: item.name,
        }));

      setPoolOption(kolamOption);
      console.log(kolamOption);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBranch();
  }, []);

  const handlePoolChange = (e) => {
    loadPool(e.value);
  };

  const handleChangeTab = () => {};

  return (
    <>
      <div>
        <label className="form-label" htmlFor="kolam">
          Kolam
        </label>
        <div className="flex gap-3">
          <AsyncSelect
            name="kolam"
            label="Kolam"
            placeholder="Pilih Kolam"
            defaultOptions={branchOption}
            loadOptions={branchOption}
            // value={branchOption}
            onChange={handlePoolChange}
            className="grow"
          />
        </div>
      </div>
      <Tab.Group selectedIndex={selectedIndex ?? -1} onChange={handleChangeTab}>
        <Tab.List className="flex-nowrap overflow-x-auto whitespace-nowrap flex gap-3 my-4 p-3">
          {tabHari.map((item, i) => (
            <Tab key={i}>
              {({ selected }) => (
                <button
                  className={`text-sm font-medium mb-7 last:mb-0 capitalize px-6 py-2 rounded-md transition duration-150 focus:outline-none ring-0
                ${
                  selected
                    ? "text-white bg-primary-500"
                    : "text-slate-500 bg-white dark:bg-slate-700 dark:text-slate-300"
                }`}
                >
                  {`${item.hari}`}
                </button>
              )}
            </Tab>
          ))}
        </Tab.List>
        <Tab.Panels>
          {tabHari.map((item) => {
            <div>{item}</div>;
          })}
        </Tab.Panels>
      </Tab.Group>
    </>
  );
};

export default CekJadwal;
