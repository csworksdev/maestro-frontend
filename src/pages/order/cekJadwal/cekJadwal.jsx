import { getCabangAll } from "@/axios/referensi/cabang";
import { getKolamAll, getKolamByBranch } from "@/axios/referensi/kolam";
import { CJGetBranchDay, CJGetPool } from "@/axios/schedule/cekJadwal";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Tooltip from "@/components/ui/Tooltip";
import { BaseJadwal } from "@/constant/cekJadwal";
import { Tab } from "@headlessui/react";
import { Icon } from "@iconify/react";
import { forEach, sum } from "lodash";
import React, { useEffect, useMemo, useState } from "react";
import AsyncSelect from "react-select/async";

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
    { name: "Senin", data: [], total: 0 },
    { name: "Selasa", data: [], total: 0 },
    { name: "Rabu", data: [], total: 0 },
    { name: "Kamis", data: [], total: 0 },
    { name: "Jumat", data: [], total: 0 },
    { name: "Sabtu", data: [], total: 0 },
    { name: "Minggu", data: [], total: 0 },
  ];

  const [tabHari, setTabHari] = useState(daysOfWeek);

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
      const kolamResponse = await CJGetPool(branch_id);

      const kolamOption = kolamResponse.data
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((item) => ({
          value: item.pool_id,
          label: item.name,
          slot: 0,
          filled: item.total,
          data: item.days,
        }));

      setPoolOption(kolamOption);
      setSelectedPool(0);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fillBaseJadwalWithData = (baseJadwal, fillData) => {
    const updatedDatahari = baseJadwal.datahari.map((day) => {
      const fillDay = fillData.datahari?.find((d) => d.hari === day.hari);
      if (!fillDay) return day;

      const updatedData = day.data.map((slot) => {
        const fillSlot = fillDay.data.find((f) => f.jam === slot.jam);

        return fillSlot
          ? {
              ...slot,
              is_free: fillSlot.is_free,
              order_id: fillSlot.order_id ?? slot.order_id,
              student: fillSlot.student ?? slot.student,
              product: fillSlot.product ?? slot.product,
              pool_name: fillSlot.pool_name ?? slot.pool_name,
            }
          : slot;
      });

      return {
        ...day,
        data: updatedData,
      };
    });

    return {
      ...baseJadwal,
      trainer_id: fillData.trainer_id ?? baseJadwal.trainer_id,
      fullname: fillData.fullname ?? baseJadwal.fullname,
      gender: fillData.gender ?? baseJadwal.gender,
      kolam: fillData.kolam ?? baseJadwal.kolam,
      datahari: updatedDatahari,
    };
  };

  const loadSchedule = async (selectedBranch, poolName, dayName) => {
    try {
      const scheduleRes = await CJGetBranchDay(
        selectedBranch,
        poolName,
        dayName
      );
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

  const processedMockData = useMemo(() => {
    return jadwal;
  }, [selectedIndex, jadwal]);

  useEffect(() => {
    loadBranch();
  }, []);

  const handleBranchChange = (e) => {
    setSelectedBranch(e.value);
    loadPool(e.value);
  };

  const handlePoolChange = (index) => {
    setSelectedPool(index);

    const updatedTabHari = tabHari.map((item) => {
      const newData = poolOption[index].data[item.name];
      return {
        ...item,
        data: newData,
        total: newData.total,
      };
    });

    setTabHari(updatedTabHari);

    try {
      const poolName = poolOption[index].value;
      const dayName = daysOfWeek[selectedIndex].name;

      loadSchedule(selectedBranch, poolName, dayName);
    } catch (error) {
      console.error("An error occurred while loading the schedule:", error);
    }
  };

  const handleChangeTab = (index) => {
    setSelectedIndex(index);
    try {
      let poolName = poolOption[selectedPool].value;
      let dayName = daysOfWeek[index].name;

      // console.log(selectedBranch, poolName, dayName);
      loadSchedule(selectedBranch, poolName, dayName);
    } catch (error) {
      console.error("An error occurred while loading the schedule:", error);
    }
  };

  const memoizedBranchOptions = useMemo(() => branchOption, [branchOption]);

  const GridKolamDetail = React.memo(({ item, pool }) => {
    const selectedDay = daysOfWeek[selectedIndex]?.name;

    return (
      <>
        {item.datahari
          .filter((x) => x.hari === selectedDay)
          .flatMap((timeSlot, i) =>
            timeSlot.data.map((slot, j) => {
              const key = `${i}-${j}`;

              if (slot.is_free) {
                return <PelatihLibur key={key} />;
              }

              if (
                slot.order_id !== "" &&
                slot.pool_name &&
                slot.pool_name !== ""
              ) {
                if (slot.pool_name === pool.label) {
                  return (
                    <div
                      key={key}
                      className="bg-green-300 shadow shadow-blue-500/50 rounded-xl p-3 flex flex-col justify-start"
                    >
                      <Badge
                        label={checkProduct(slot.product)}
                        className="bg-primary-500 text-white text-center"
                      />
                      <div className="text-sm whitespace-pre-line flex items-center justify-center pt-2">
                        <Tooltip
                          placement="top"
                          arrow
                          content={
                            slot.student?.length === 1
                              ? slot.student[0]
                              : slot.student?.join(", ")
                          }
                        >
                          <span>{iconProduct(slot.product)}</span>
                        </Tooltip>
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <PelatihAdaJadwal key={key} poolName={slot.pool_name} />
                  );
                }
              }

              return <PelatihKosong key={key} />;
            })
          )}
      </>
    );
  });

  const GridKolamHeader = React.memo(({ item, trainers, day }) => {
    return (
      <div className="overflow-auto ">
        <div className="grid grid-cols-15 gap-2 w-full ">
          <div className="border-b-4 border-blue-500 p-2 min-h-[80px] text-center font-semibold flex items-start justify-center sticky left-0 bg-white z-10">
            Pelatih
          </div>
          {columnHeader.slice(1).map((header, i) => {
            var jumlahPerJam = item.data[day][header];
            return (
              <div
                key={i}
                className="border-b-4 border-blue-500 p-2 min-h-[80px] text-center font-semibold flex items-start justify-center"
              >
                <>
                  {header}
                  {jumlahPerJam && (
                    <>
                      <br />({jumlahPerJam})
                    </>
                  )}
                </>
              </div>
            );
          })}

          {/* Trainer names and details */}
          {jadwal.map((de) => (
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

  const gridKolam = (hari) => {
    if (jadwal && jadwal.length > 0 && poolOption && selectedPool !== null) {
      const selectedPoolItem = poolOption[selectedPool];
      // Uncomment and implement your filtering if needed
      const filteredTrainers = jadwal.filter((trainer) =>
        trainer.kolam.includes(selectedPoolItem.value)
      );

      return (
        <div className="flex flex-col h-full">
          <Card
            key={selectedPoolItem.value}
            subtitle={selectedPoolItem.label}
            headerslot={
              <div className="flex flex-col gap-1 text-sm">
                <div>Jumlah Pelatih: {jadwal.length}</div>
              </div>
            }
          >
            <GridKolamHeader
              item={selectedPoolItem}
              trainers={filteredTrainers}
              day={hari}
            />
          </Card>
        </div>
      );
    } else {
      return (
        <div className="flex flex-col h-full">
          <div className="text-center text-sm text-gray-400">
            No pool selected or data not available.
          </div>
        </div>
      );
    }
  };

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
            onChange={handleBranchChange}
            className="grow z-20"
          />
        </div>
      </div>
      <Tab.Group selectedIndex={selectedPool} onChange={handlePoolChange}>
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
                    {`${item.label} (${item.filled})`}
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
                      {`${item.name} (${item.total})`}
                    </button>
                  )}
                </Tab>
              ))}
            </Tab.List>
            <Tab.Panels>
              {tabHari.map((item, index) => {
                return (
                  <Tab.Panel key={index}>{gridKolam(item.name)}</Tab.Panel>
                );
              })}
            </Tab.Panels>
          </Tab.Group>
        </Tab.Panels>
      </Tab.Group>
    </>
  );
};

export default CekJadwal;

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
