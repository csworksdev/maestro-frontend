import { getCabangAll } from "@/axios/referensi/cabang";
import { getKolamAll, getKolamByBranch } from "@/axios/referensi/kolam";
import Card from "@/components/ui/Card";
import Select from "@/components/ui/Select";
import { baseJadwal2 } from "@/constant/jadwal-default";
import { Tab } from "@headlessui/react";
import React, { useEffect, useState } from "react";
import AsyncSelect from "react-select/async";

const mockData = [
  {
    trainer_id: "1",
    fullname: "coach 1",
    kolam: [
      "048d240a-a6b0-41f5-b31a-c683a683b748",
      "e12a8ae7-0be9-44a6-be37-447dcaef5e0d",
    ],
    datahari: [
      {
        hari: "Senin",
        data: [
          {
            jam: "06.00",
            is_free: true,
            order_id: "",
            student: [],
            product: "",
          },
          {
            jam: "07.00",
            is_free: true,
            order_id: "",
            student: [],
            product: "",
          },
          {
            jam: "08.00",
            is_free: false,
            order_id: "123",
            student: ["chandra"],
            product: "bandung18",
          },
          {
            jam: "09.00",
            is_free: false,
            order_id: "",
            student: [],
            product: "",
          },
        ],
      },
    ],
  },
  {
    trainer_id: "2",
    fullname: "coach 2",
    kolam: ["048d240a-a6b0-41f5-b31a-c683a683b748"],
    datahari: [
      {
        hari: "Senin",
        data: [
          {
            jam: "06.00",
            is_free: true,
            order_id: "",
            student: [],
            product: "",
          },
          {
            jam: "07.00",
            is_free: true,
            order_id: "",
            student: [],
            product: "",
          },
          {
            jam: "08.00",
            is_free: false,
            order_id: "123",
            student: ["chandra"],
            product: "bandung18",
          },
          {
            jam: "09.00",
            is_free: false,
            order_id: "",
            student: [],
            product: "",
          },
        ],
      },
    ],
  },
  // { trainer_id: "3", fullname: "coach 3" },
  // { trainer_id: "4", fullname: "coach 4" },
  // { trainer_id: "5", fullname: "coach 5" },
  // { trainer_id: "6", fullname: "coach 6" },
  // { trainer_id: "7", fullname: "coach 7" },
  // { trainer_id: "8", fullname: "coach 8" },
  // { trainer_id: "9", fullname: "coach 9" },
  // { trainer_id: "10", fullname: "coach 10" },
];

const columnHeader = [
  "Pelatih",
  "06.00",
  "07.00",
  "08.00",
  "09.00",
  "10.00",
  "11.00",
  "12.00",
  "13.00",
  "14.00",
  "15.00",
  "16.00",
  "17.00",
  "18.00",
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
    parseInt(localStorage.getItem("ScheduleSelected"), 10) || 0
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

  const handleChangeTab = (index) => {
    setSelectedIndex(index);
  };

  const pelatihLibur = () => {
    return (
      <div className="border-solid border-2 border-black-500 bg-red-400 p-2 rounded-md text-white min-w-52 min-h-12">
        Libur
      </div>
    );
  };

  const pelatihKosong = () => {
    return (
      <div className="border-solid border-2 border-black-500 bg-warning-100 p-2 rounded-md text-black min-w-52 min-h-12">
        Available
      </div>
    );
  };

  const gridKolamHeader = (item) => {
    const filteredData = mockData.filter(
      (mock) =>
        mock.kolam.includes(item.value) &&
        mock.datahari?.some((day) => day.hari === daysOfWeek[selectedIndex])
    );

    return (
      <>
        <div className="flex gap-3 py-1">
          <div className="flex flex-col gap-3">
            <div className="border-solid border-2 border-black-500 p-2 rounded-md min-w-52 text-center font-semibold min-h-12">
              Pelatih
            </div>
            {filteredData.map((de) => (
              <div className="border-solid border-2 border-black-500 p-2 rounded-md min-w-52 min-h-12">
                {de.fullname}
              </div>
            ))}
          </div>
          <div className="flex gap-3 overflow-auto">
            <div className="flex flex-col">
              <div className="flex flex-row">
                {columnHeader.slice(1).map((header, i) => (
                  <div
                    key={i}
                    className="border-solid border-2 border-black-500 p-2 rounded-md min-w-52 text-center font-semibold min-h-12"
                  >
                    {header}
                  </div>
                ))}
              </div>
              {filteredData.map((de) => gridKolamDetail(de))}
            </div>
          </div>
        </div>
      </>
    );
  };

  const gridKolamDetail = (item) => {
    const dayData = item.datahari?.find(
      (day) => day.hari === daysOfWeek[selectedIndex]
    )?.data;

    return (
      <div className="flex gap-3 py-1">
        {dayData?.map((timeSlot, i) =>
          timeSlot.is_free ? (
            pelatihLibur()
          ) : timeSlot.order_id !== "" ? (
            <div
              key={i}
              className="border-solid border-2 border-black-500 p-2 rounded-md flex flex-col min-w-52 min-h-12"
            >
              <div>Produk: {timeSlot.product}</div>
              <div>Siswa: {timeSlot.student.join(", ")}</div>
            </div>
          ) : (
            pelatihKosong()
          )
        )}
        {/* </div> */}
      </div>
    );
  };

  const gridKolam = (params) => {
    return (
      <div className="flex flex-col gap-5">
        {poolOption.map((item) => (
          <Card key={item.value} title={item.label}>
            {gridKolamHeader(item)}
          </Card>
        ))}
      </div>
    );
  };

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
          {tabHari.map((item) => (
            <Tab.Panel>
              <div>{gridKolam(item)}</div>
            </Tab.Panel>
          ))}
        </Tab.Panels>
      </Tab.Group>
    </>
  );
};

export default CekJadwal;
