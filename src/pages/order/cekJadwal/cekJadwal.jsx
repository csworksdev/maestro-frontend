import { getCabangAll } from "@/axios/referensi/cabang";
import { getKolamAll, getKolamByBranch } from "@/axios/referensi/kolam";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Select from "@/components/ui/Select";
import { baseJadwal2 } from "@/constant/jadwal-default";
import { Tab } from "@headlessui/react";
import { Icon } from "@iconify/react";
import React, { useEffect, useMemo, useState } from "react";
import AsyncSelect from "react-select/async";

const mockData = [
  {
    trainer_id: "1",
    fullname: "coach 1",
    gender: "L",
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
            student: ["Chandra", "Setia"],
            product: "bandung28",
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
    gender: "P",
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
  const [selectedIndex, setSelectedIndex] = useState();
  const [jumlahSiswa, setJumlahSiswa] = useState(0);
  const [jumlahPelatih, setJumlahPelatih] = useState(0);

  useEffect(() => {
    const storedIndex = localStorage.getItem("ScheduleSelected");
    setSelectedIndex(parseInt(storedIndex, 10) || 0);
  }, []);

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

  const processedMockData = useMemo(() => {
    return mockData.map((mock) => ({
      ...mock,
      activeDay:
        mock.datahari?.find((day) => day.hari === daysOfWeek[selectedIndex])
          ?.data || [],
    }));
  }, [selectedIndex, mockData]);

  useEffect(() => {
    loadBranch();
  }, []);

  const handlePoolChange = (e) => {
    loadPool(e.value);
  };

  const handleChangeTab = (index) => {
    setSelectedIndex(index);
  };

  const PelatihLibur = React.memo(() => (
    <div className="flex flex-col items-center justify-center bg-red-400 p-2 rounded-md text-white min-w-52 min-h-12">
      Libur
    </div>
  ));

  const PelatihKosong = React.memo(() => (
    <Button
      className="flex flex-row bg-green-300 p-2 rounded-md text-black min-w-52 min-h-12 justify-center items-center gap-3"
      onClick={() => alert("test")}
    >
      <Icon icon="heroicons-outline:plus-circle" width={"24"} />
      <span>Buat Order</span>
    </Button>
  ));

  const GridKolamHeader = React.memo(({ item }) => {
    const filteredData = processedMockData.filter((mock) =>
      mock.kolam.includes(item.value)
    );

    return (
      <>
        <div className="flex gap-3 py-1">
          <div className="flex flex-col gap-3">
            <div className="border-b-4 border-indigo-500 p-2 min-w-52 text-center font-semibold min-h-12">
              Pelatih
            </div>
            {filteredData.map((de) => (
              <div
                key={de.trainer_id}
                className={`p-2 min-w-52 h-12 grow flex flex-row items-center rounded-md ${
                  de.gender === "L" ? `bg-blue-300` : `bg-pink-300`
                }`}
              >
                {de.fullname}
              </div>
            ))}
          </div>
          <div className="flex gap-3 overflow-auto">
            <div className="flex flex-col gap-3">
              <div className="flex flex-row gap-3">
                {columnHeader.slice(1).map((header, i) => (
                  <div
                    key={i}
                    className="border-b-4 border-indigo-500 pt-3 min-w-52 text-center font-semibold min-h-12 grow"
                  >
                    {header}
                  </div>
                ))}
              </div>
              {filteredData.map((de) => (
                <GridKolamDetail key={de.trainer_id} item={de} />
              ))}
            </div>
          </div>
        </div>
      </>
    );
  });

  const GridKolamDetail = React.memo(({ item }) => {
    return (
      <div className="flex gap-3">
        {item.activeDay?.map((timeSlot, i) =>
          timeSlot.is_free ? (
            <PelatihLibur key={i} />
          ) : timeSlot.order_id !== "" ? (
            <div
              key={i}
              className="shadow shadow-blue-500/50 rounded-md p-3 flex flex-col min-w-52 min-h-12"
            >
              <div>Produk: {timeSlot.product}</div>
              <div>Siswa: {timeSlot.student.join(", ")}</div>
            </div>
          ) : (
            <PelatihKosong key={i} />
          )
        )}
      </div>
    );
  });
  const memoizedBranchOptions = useMemo(() => branchOption, [branchOption]);

  const gridKolam = (params) => {
    return (
      <div className="flex flex-col gap-5">
        {poolOption.map((item) => (
          <Card
            key={item.value}
            title={item.label}
            headerslot={
              <div className="flex flex-col">
                <div>Jumlah Pelatih : {jumlahPelatih}</div>
                <div>Jumlah Siswa : {jumlahSiswa}</div>
              </div>
            }
          >
            <GridKolamHeader item={item} />
          </Card>
        ))}
      </div>
    );
  };

  const loadOptions = async () => {
    return branchOption; // Assuming already fetched
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
            defaultOptions={memoizedBranchOptions}
            loadOptions={loadOptions}
            onChange={handlePoolChange}
            className="grow"
          />
          ;
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
