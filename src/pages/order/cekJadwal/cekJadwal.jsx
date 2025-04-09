import { getCabangAll } from "@/axios/referensi/cabang";
import { getKolamAll, getKolamByBranch } from "@/axios/referensi/kolam";
import { CJGetBranchDay } from "@/axios/schedule/cekJadwal";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Tooltip from "@/components/ui/Tooltip";
import { BaseJadwal } from "@/constant/cekJadwal";
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
          {
            jam: "11.00",
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
  "19.00",
];

const checkProduct = (product) => {
  switch (true) {
    case product.includes("14"):
      return "14";
      break;
    case product.includes("18"):
      return "18";
      break;
    case product.includes("24"):
      return "24";
      break;
    case product.includes("28"):
      return "28";
      break;
    case product.includes("ter"):
      return "Terapi";
      break;
    case product.includes("gr"):
      return "Grup";
      break;
    default:
      return "Trial";
      break;
  }
};

const iconProduct = (product) => {
  let jumlahSiswa = checkProduct(product);

  switch (jumlahSiswa) {
    case "Grup":
      return <Icon icon="heroicons-outline:user-group" width="24" />;
      break;
    case jumlahSiswa.includes("2"):
      return <Icon icon="heroicons-outline:users" width="24" />;
      break;

    default:
      return <Icon icon="heroicons-outline:user" width="24" />;
      break;
  }
};

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
  const [selectedPool, setSelectedPool] = useState();
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState();
  const [selectedBranch, setSelectedBranch] = useState();
  const [jumlahSiswaPerKolam, setJumlahSiswaPerKolam] = useState([]);
  const [jumlahSiswaPerhari, setJumlahSiswaPerhari] = useState([]);
  const [jumlahPelatih, setJumlahPelatih] = useState([]);
  const [jadwal, setJadwal] = useState([]);

  const hitungSiswaPerKolam = (params) => {
    console.log(params);
    if (jadwal.length === 0 || poolOption.length === 0) return;

    // Step 1: Create a Set of valid pool values from poolOption
    const validPools = new Set(params.map((pool) => pool.label));

    // Step 2: Count students for only valid pools
    const poolCounts = jadwal.reduce((acc, trainer) => {
      trainer.datahari.forEach((hariData) => {
        hariData.data.forEach((schedule) => {
          const pool = schedule.pool_name;
          if (!pool || !validPools.has(pool)) return; // skip if invalid pool

          const studentCount = schedule.student?.length || 0;
          acc[pool] = (acc[pool] || 0) + studentCount;
        });
      });
      return acc;
    }, {});
    console.log(poolCounts);
    setJumlahSiswaPerKolam(poolCounts);
  };

  const hitungSiswaPerHari = () => {
    const poolDayCounts = {};
    if (jadwal.length > 0) {
      jadwal.forEach((trainer) => {
        trainer.datahari.forEach((hariData) => {
          const day = hariData.hari;

          hariData.data.forEach((schedule) => {
            const pool = schedule.pool_name;
            if (!pool) return; // Skip if no pool

            const studentCount = schedule.student?.length || 0;

            if (!poolDayCounts[pool]) {
              poolDayCounts[pool] = {};
            }
            if (!poolDayCounts[pool][day]) {
              poolDayCounts[pool][day] = 0;
            }
            poolDayCounts[pool][day] += studentCount;
          });
        });
      });
    }
    setJumlahSiswaPerhari(poolDayCounts);
  };

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
      // hitungSiswaPerKolam(kolamOption);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fillBaseJadwalWithData = (baseJadwal, fillData) => {
    const updatedDatahari = baseJadwal.datahari.map((day) => {
      const dayFill = fillData.datahari?.find((d) => d.hari === day.hari);
      if (!dayFill) return day;

      const updatedData = day.data.map((slot) => {
        const fillSlot = dayFill.data.find((f) => f.jam === slot.jam);
        if (fillSlot) {
          return {
            ...slot,
            is_free: fillSlot.is_free,
            order_id: fillSlot.order_id || slot.order_id,
            student: fillSlot.student || slot.student,
            product: fillSlot.product || slot.product,
            pool_name: fillSlot.pool_name || slot.pool_name,
          };
        }
        return slot;
      });

      return {
        ...day,
        data: updatedData,
      };
    });

    return {
      ...baseJadwal,
      trainer_id: fillData.trainer_id || baseJadwal.trainer_id,
      fullname: fillData.fullname || baseJadwal.fullname,
      gender: fillData.gender || baseJadwal.gender,
      kolam: fillData.kolam,
      datahari: updatedDatahari,
    };
  };

  const loadSchedule = async (branch_id, day) => {
    try {
      const scheduleRes = await CJGetBranchDay(branch_id, daysOfWeek[day]);
      const data = scheduleRes.data.map((element) =>
        fillBaseJadwalWithData({ ...BaseJadwal }, element)
      );
      setJadwal(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    try {
      if (
        selectedBranch != null &&
        selectedBranch !== "" &&
        selectedIndex != null
      ) {
        loadSchedule(selectedBranch, selectedIndex);
      } else {
        console.error(
          "Invalid input: selectedBranch or selectedIndex is missing or empty."
        );
      }
    } catch (error) {
      console.error("An error occurred while loading the schedule:", error);
    }
  }, [selectedBranch, selectedIndex]);

  const processedMockData = useMemo(() => {
    return jadwal.map((mock) => ({
      ...mock,
      activeDay:
        mock.datahari?.find((day) => day.hari === daysOfWeek[selectedIndex])
          ?.data || [],
    }));
  }, [selectedIndex, jadwal]);

  useEffect(() => {
    loadBranch();
  }, []);

  const handlePoolChange = (e) => {
    setSelectedBranch(e.value);
    loadPool(e.value);
  };

  const handleChangeTab = (index) => {
    setSelectedIndex(index);
  };

  const memoizedBranchOptions = useMemo(() => branchOption, [branchOption]);

  const AdaJadwal = React.memo((timeSlot, i) => (
    <div
      key={i}
      className="bg-green-300 shadow shadow-blue-500/50 rounded-xl p-3 flex flex-col w-full min-h-[80px] justify-start"
    >
      <Badge label={timeSlot.product} className="bg-primary-500 text-white" />
      <div className="text-sm whitespace-pre-line">
        {timeSlot.student.length === 1
          ? timeSlot.student[0]
          : timeSlot.student.map((name, idx) => <div key={idx}>{name}</div>)}
      </div>
    </div>
  ));

  const PelatihLibur = React.memo(() => (
    <div className="flex justify-center items-center">
      <Tooltip placement="top" arrow content={`Libur Pelatih`}>
        <span>
          <Icon
            icon="heroicons-outline:calendar-days"
            width="24"
            color="red"
            onClick={() => alert("test")}
          />
        </span>
      </Tooltip>
    </div>
  ));

  const PelatihKosong = React.memo(() => (
    <div className="flex justify-center items-center">
      <Tooltip placement="top" arrow content={`Buat Order`}>
        <span>
          <Icon
            icon="heroicons-outline:plus"
            width="24"
            color="green"
            onClick={() => alert("test")}
          />
        </span>
      </Tooltip>
    </div>
  ));

  const PelatihAdaJadwal = React.memo(({ poolName = "" }) => (
    <div className="flex justify-center items-center">
      <Tooltip
        placement="top"
        arrow
        content={
          <div className="whitespace-pre-line">
            {`Sudah ada jadwal di \n ${poolName}`}
          </div>
        }
      >
        <span>
          <Icon icon="heroicons-outline:hand-raised" width="24" color="black" />
        </span>
      </Tooltip>
    </div>
  ));

  const GridKolamDetail = React.memo(({ item, pool }) => {
    return (
      <>
        {item.activeDay?.map((timeSlot, i) =>
          timeSlot.is_free ? (
            <PelatihLibur key={i} />
          ) : timeSlot.order_id !== "" ? (
            timeSlot.pool_name === pool.label ? (
              <div
                key={i}
                className="bg-green-300 shadow shadow-blue-500/50 rounded-xl p-3 flex flex-col justify-start"
              >
                <Badge
                  label={checkProduct(timeSlot.product)}
                  className="bg-primary-500 text-white text-center"
                />
                <div className="text-sm whitespace-pre-line flex items-center justify-center pt-2">
                  <Tooltip
                    placement="top"
                    arrow
                    content={
                      timeSlot.student.length === 1
                        ? timeSlot.student[0]
                        : timeSlot.student.join(", ")
                    }
                  >
                    <span>{iconProduct(timeSlot.product)}</span>
                  </Tooltip>
                </div>
              </div>
            ) : (
              <PelatihAdaJadwal poolName={timeSlot.pool_name} />
            )
          ) : (
            <PelatihKosong key={i} />
          )
        )}
      </>
    );
  });

  const GridKolamHeader = React.memo(({ item }) => {
    const filteredData = processedMockData.filter((mock) =>
      mock.kolam.includes(item.value)
    );

    return (
      <div className="overflow-auto ">
        <div className="grid grid-cols-15 gap-2 w-full ">
          <div className="border-b-4 border-blue-500 p-2 min-h-[80px] text-center font-semibold flex items-center justify-center sticky left-0 bg-white z-10">
            Pelatih
          </div>
          {columnHeader.slice(1).map((header, i) => (
            <div
              key={i}
              className="border-b-4 border-blue-500 p-2 min-h-[80px] text-center font-semibold flex items-center justify-center"
            >
              {header}
            </div>
          ))}

          {/* Trainer names and details */}
          {filteredData.map((de) => (
            <React.Fragment key={de.trainer_id}>
              <div
                className={`p-2 min-h-[80px] flex items-center rounded-xl shadow sticky left-0 z-10 ${
                  de.gender === "L" ? "bg-blue-300" : "bg-pink-300"
                }`}
              >
                <span className="text-[clamp(8px,0.7vw,14px)] p-1">
                  {de.fullname}
                </span>
              </div>

              <GridKolamDetail item={de} pool={item} />
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  });

  const gridKolam = () => (
    <div className="flex flex-col h-full">
      {poolOption &&
      poolOption.length > 0 &&
      selectedPool !== null &&
      poolOption[selectedPool] ? (
        poolOption
          .filter((x) => x.value === poolOption[selectedPool]?.value)
          .map((item) => {
            const jumlahPelatih = jadwal
              ? jadwal.filter((trainer) => trainer.kolam.includes(item.value))
                  .length
              : 0;

            const jumlahSiswa = jadwal
              ? jadwal
                  .filter((trainer) => trainer.kolam === item.value)
                  .flatMap((trainer) => trainer.datahari || [])
                  .flatMap((dh) => dh.data || [])
                  .reduce(
                    (total, sched) =>
                      total + (sched.student ? sched.student.length : 0),
                    0
                  )
              : 0;

            return (
              <Card
                key={item.value}
                subtitle={item.label}
                headerslot={
                  <div className="flex flex-col gap-1 text-sm">
                    <div>Jumlah Pelatih: {jumlahPelatih}</div>
                    {/* <div>Jumlah Siswa: {jumlahSiswa}</div> */}
                  </div>
                }
              >
                {/* <GridKolamHeader item={item} /> */}
                {/* <div className="h-[calc(100vh-545px)] overflow-y-auto min-h-0"> */}
                <GridKolamHeader item={item} />
                {/* </div> */}
              </Card>
            );
          })
      ) : (
        <div className="text-center text-sm text-gray-400">
          No pool selected or data not available.
        </div>
      )}
    </div>
  );

  return (
    <>
      <div>
        <label className="form-label" htmlFor="kolam">
          Cabang
        </label>
        <div className="flex gap-3">
          <AsyncSelect
            name="kolam"
            label="Kolam"
            placeholder="Pilih Cabang"
            defaultOptions={memoizedBranchOptions}
            loadOptions={branchOption}
            onChange={handlePoolChange}
            className="grow z-20"
          />
        </div>
      </div>
      <Tab.Group selectedIndex={selectedPool} onChange={setSelectedPool}>
        <Tab.List className="flex-nowrap overflow-x-auto whitespace-nowrap flex gap-3 my-0 py-3">
          <>
            {poolOption.map((item, i) => (
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
                    {`${item.label}`}
                  </button>
                )}
              </Tab>
            )) ?? null}
          </>
        </Tab.List>
        <Tab.Panels>
          <Tab.Group
            selectedIndex={selectedIndex ?? -1}
            onChange={handleChangeTab}
          >
            <Tab.List className="flex-nowrap overflow-x-auto whitespace-nowrap flex gap-3 my-0 pb-3 ">
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
                <Tab.Panel>{gridKolam()}</Tab.Panel>
              ))}
            </Tab.Panels>
          </Tab.Group>
        </Tab.Panels>
      </Tab.Group>
    </>
  );
};

export default CekJadwal;
