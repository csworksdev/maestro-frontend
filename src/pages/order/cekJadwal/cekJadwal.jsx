import { getProdukPool } from "@/axios/masterdata/produk";
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
import React, { useEffect, useMemo, useState } from "react";
import AsyncSelect from "react-select/async";
import CreateInvoice from "./addJadwal";
import Modal from "@/components/ui/Modal";
import { DateTime } from "luxon";
import Swal from "sweetalert2";
import Dropdown from "@/components/ui/Dropdown";
import WhatsAppButton from "@/components/custom/sendwhatsapp";
import Icons from "@/components/ui/Icon";
import { useSelector } from "react-redux";
import Select from "react-select";
import Switch from "@/components/ui/Switch";
import { toProperCase } from "@/utils";
import { PerpanjangOrder } from "@/axios/masterdata/order";

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
    case product.includes("Baby"):
      return "Baby";
      break;
    default:
      return "Trial";
      break;
  }
};

const iconProduct = (product) => {
  if (product === "p")
    return <Icon icon="heroicons-outline:calendar-days" width="24" />;

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

  const dropdownItems = [
    {
      label: "Perpanjang Paket",
      link: "#",
    },
    {
      label: "Follow Up Siswa",
      link: "#",
    },
    {
      label: "Something else here",
      link: "#",
    },
  ];

  const { user_id, user_name, roles } = useSelector((state) => state.auth.data);
  const [tabHari, setTabHari] = useState(daysOfWeek);
  const [branchOption, setBranchOption] = useState([]);
  const [poolOption, setPoolOption] = useState([]);
  const [selectedPool, setSelectedPool] = useState();
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState();
  const [selectedBranch, setSelectedBranch] = useState();
  const [selectedDay, setSelectedDay] = useState();
  const [jumlahSiswaPerKolam, setJumlahSiswaPerKolam] = useState([]);
  const [jumlahSiswaPerhari, setJumlahSiswaPerhari] = useState([]);
  const [jumlahPelatih, setJumlahPelatih] = useState([]);
  const [filterPelatih, setFilterPelatih] = useState([]);
  const [filteredPelatih, setFilteredPelatih] = useState("");
  const [jadwal, setJadwal] = useState([]);
  const [productList, setProductList] = useState([]);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [reloadDone, setReloadDone] = useState(false);
  const [checked, setChecked] = useState(true);

  const [inputValue, setInputValue] = useState({
    order_date: DateTime.now().toFormat("yyyy-MM-dd"),
    start_date: DateTime.now().toFormat("yyyy-MM-dd"),
    product: "",
    promo: "",
    is_finish: false,
    is_paid: "pending",
    trainer: "",
    pool: "",
    paket: "",
    trainer_percentage: 60,
    company_percentage: 40,
    branch: "",
    notes: "",
    day: "",
    time: "",
    price: 0,
    grand_total: 0,
    students: {},
  });

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
      setSelectedIndex(0);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadProduct = async (poolName) => {
    try {
      const res = await getProdukPool(poolName);

      setProductList(res.data.results);
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
        const jam = slot.jam;
        const orders = fillDay.data?.[jam] || [];

        return {
          ...slot,
          orders: orders.length > 0 ? orders : slot.orders,
        };
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
      nickname: fillData.nickname ?? baseJadwal.nickname,
      phone: fillData.phone ?? baseJadwal.phone,
      gender: fillData.gender ?? baseJadwal.gender,
      kolam: fillData.kolam ?? baseJadwal.kolam,
      total_order: fillData.total_order ?? baseJadwal.total_order,
      percent: fillData.percent ?? baseJadwal.percent,
      is_paid: fillData.is_paid ?? baseJadwal.is_paid,
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

      setFilterPelatih(
        data.map((x) => {
          return { value: x.trainer_id, label: toProperCase(x.nickname) };
        })
      );

      setJadwal([...data]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBranch();
  }, []);

  useEffect(() => {
    if (reloadDone) {
      setDetailModalVisible(false);
      setReloadDone(false); // reset trigger
      Swal.fire("Added!", "Your order has been added.", "success");
    }
  }, [reloadDone]);

  useEffect(() => {
    setFilterPelatih([]);
    setFilteredPelatih("");
  }, [selectedIndex]);

  const handleBranchChange = (e) => {
    setSelectedBranch(e.value);
    loadPool(e.value);
    setFilterPelatih([]);
  };

  const handlePoolChange = (index) => {
    try {
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

      const poolName = poolOption[index].value;
      const dayName = daysOfWeek[selectedIndex].name;

      loadSchedule(selectedBranch, poolName, dayName);
      loadProduct(poolName);
    } catch (error) {
      console.error("An error occurred while loading the schedule:", error);
    }
  };

  const handleChangeTab = (index) => {
    setSelectedIndex(index);
    try {
      let poolName = poolOption[selectedPool].value;
      let dayName = daysOfWeek[index].name;
      setSelectedDay(daysOfWeek[index].name);
      loadSchedule(selectedBranch, poolName, dayName);
    } catch (error) {
      console.error("An error occurred while loading the schedule:", error);
    }
  };

  const handlePerpanjang = async (order_id) => {
    let res = await PerpanjangOrder(order_id);
    if (res)
      loadSchedule(selectedBranch, poolOption[selectedPool].value, selectedDay);
    // alert("belum release, mohon sabar 😜");
  };

  const memoizedBranchOptions = useMemo(() => branchOption, [branchOption]);

  const GridKolamDetail = React.memo(({ item, pool }) => {
    const selectedDay = daysOfWeek[selectedIndex]?.name;

    const filteredDataHari =
      item.datahari?.filter((x) => x.hari === selectedDay) || [];

    return (
      <>
        {filteredDataHari.flatMap((timeSlot, i) =>
          timeSlot.data.map((slotObj, jIdx) => {
            const orders = Array.isArray(slotObj.orders) ? slotObj.orders : [];

            // Jika free langsung render PelatihLibur
            if (orders[0]?.is_free) {
              return (
                <div className="flex flex-col gap-4">
                  <PelatihLibur key={jIdx} />
                  <PelatihKosong
                    key={i}
                    pool={poolOption[selectedPool]}
                    trainer={item}
                    hari={timeSlot.hari}
                    jam={slotObj.jam}
                  />
                </div>
              );
            }

            // Cek apakah ada slot di pool lain
            const hasOtherPool = orders.some(
              (slot) => slot.order_id && slot.pool_name !== pool.label
            );

            // Fungsi bantu: tentukan warna card
            const getCardColor = (slot) => {
              let cardColor =
                "bg-white border-2 border-green-500 shadow-md shadow-lime-200/50";

              const pLastRaw = slot.p?.[slot.p.length - 1]?.tgl;
              if (pLastRaw) {
                const pLast = DateTime.fromFormat(pLastRaw, "dd/MM/yyyy");
                const diff = DateTime.now().diff(pLast, "days").days;

                if (diff > 2)
                  cardColor = "bg-red-200 shadow-md shadow-red-500/50";
                else if (diff > 0)
                  cardColor = "bg-yellow-500 shadow-md shadow-lime-500/50";
              }

              return cardColor;
            };

            // Fungsi bantu: render slot untuk pool yang sama
            const renderSamePoolSlot = (slot, key) => {
              const cardColor = getCardColor(slot);

              if (checked) {
                return (
                  <div
                    key={key}
                    className={`${cardColor} shadow shadow-blue-500/50 rounded-l p-2 flex flex-col overflow-hidden justify-center gap-3`}
                  >
                    {slot.student?.map((x, idx) => (
                      <div key={idx} className="text-[clamp(8px,0.7vw,10px)]">
                        {x.split(" ")[0]}
                      </div>
                    ))}
                    <PerpanjangPaket order_id={slot.order_id} />
                  </div>
                );
              }

              return (
                <div
                  key={key}
                  className={`${cardColor} shadow shadow-blue-500/50 rounded-xl px-2 py-3 flex flex-col gap-2 overflow-hidden justify-center`}
                >
                  <>
                    <AdminBadge admin={slot.admin} />
                    <PaymentStatusBadge status={slot.is_paid} />
                    <Badge
                      label={checkProduct(slot.product)}
                      className="bg-primary-500 text-white justify-center text-[clamp(8px,0.7vw,12px)]"
                    />
                    {/* copy order id */}
                    {user_id === "f7d9fff1-5455-4cb5-bb92-9bea6a61b447" && (
                      <button
                        onClick={() => {
                          const text = `order_id = '${slot.order_id}'`;
                          navigator.clipboard.writeText(text);
                        }}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        <Icons
                          icon="heroicons-outline:clipboard-copy"
                          className="w-5 h-5"
                        />
                      </button>
                    )}
                    <div className="flex justify-between">
                      <Tooltip content={slot.student?.join(", ") || ""}>
                        <span>{iconProduct(slot.product)}</span>
                      </Tooltip>
                      {slot?.is_paid !== "pending" && (
                        <Tooltip
                          content={
                            slot.p?.length
                              ? slot.p.map((pItem, idx) => (
                                  <div key={idx}>
                                    <strong>P{pItem.meet}</strong>:{" "}
                                    {pItem.tgl || "-"}
                                  </div>
                                ))
                              : "Tidak ada pertemuan"
                          }
                        >
                          <span>{iconProduct("p")}</span>
                        </Tooltip>
                      )}
                    </div>
                    <PerpanjangPaket order_id={slot.order_id} />
                  </>
                </div>
              );
            };

            // Fungsi bantu: render slot pool lain
            const renderOtherPoolSlot = (slot, key) => (
              <PelatihAdaJadwal key={key} poolName={slot.pool_name} />
            );

            return (
              <div
                key={`${i}-${jIdx}`}
                className="flex flex-col gap-2 min-h-[70px] justify-center"
              >
                {orders.map((slot, k) => {
                  if (!slot.order_id) return null; // skip slot kosong

                  const key = `${i}-${jIdx}-${k}`;
                  if (slot.pool_name === pool.label) {
                    return renderSamePoolSlot(slot, key);
                  }
                  return renderOtherPoolSlot(slot, key);
                })}

                {!hasOtherPool && (
                  <PelatihKosong
                    key={i}
                    pool={poolOption[selectedPool]}
                    trainer={item}
                    hari={timeSlot.hari}
                    jam={slotObj.jam}
                  />
                )}
              </div>
            );
          })
        )}
      </>
    );
  });

  // const pesan = `Halo, Coach ${item.fullname} di kolam ${poolOption[selectedPool]?.label} hari ${timeSlot.hari} jam ${slotObj.jam} apakah bisa diisi jadwal ?`;

  // return (
  //   <>
  //     <PelatihKosong
  //       key={key}
  //       pool={poolOption[selectedPool]}
  //       trainer={item}
  //       hari={timeSlot.hari}
  //       jam={slotObj.jam}
  //     />
  //     {/* <WhatsAppButton phone={item.phone} pesan={pesan} /> */}
  //   </>
  // );

  const GridKolamHeader = React.memo(({ item, trainers, day }) => {
    let dataJadwal =
      filteredPelatih !== ""
        ? jadwal.filter((x) => x.trainer_id === filteredPelatih)
        : jadwal;

    return (
      <div className="w-full">
        {/* HEADER FIX */}
        <div className="grid grid-cols-15 gap-2 w-full">
          <div className="border-b-4 border-blue-500 p-2 min-h-[80px] text-center font-semibold flex items-start justify-center sticky left-0 bg-white z-10">
            Pelatih
          </div>
          {columnHeader.slice(1).map((header, i) => {
            const jumlahPerJam = item.data[day][header];
            return (
              <div
                key={i}
                className="border-b-4 border-blue-500 p-2 min-h-[80px] text-center font-semibold flex items-start justify-center"
              >
                {header}
                {jumlahPerJam && (
                  <>
                    <br />({jumlahPerJam})
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* BODY SCROLL */}
        <div className="overflow-auto ">
          {dataJadwal.map((de) => (
            <div
              key={de.trainer_id}
              className="grid grid-cols-15 gap-3 my-2 w-full"
            >
              <div
                className={`p-1 min-h-[80px] flex flex-col rounded-xl shadow sticky left-0 z-10 align-middle justify-center animation-ping gap-1 ${
                  de.gender === "L" ? "bg-blue-300" : "bg-pink-300"
                }`}
              >
                <span className="text-[clamp(8px,0.7vw,14px)] p-1 font-semibold">
                  {de.nickname && (
                    <>
                      {toProperCase(de.nickname)}
                      <br />({de.total_order})
                    </>
                  )}
                </span>
              </div>

              <GridKolamDetail item={de} pool={item} />
            </div>
          ))}
        </div>
      </div>
    );
  });

  const gridKolam = (hari) => {
    const selectedPoolItem = poolOption[selectedPool];

    const filteredTrainers = useMemo(() => {
      return jadwal.filter((trainer) =>
        trainer.kolam.includes(poolOption[selectedPool].value)
      );
    }, [jadwal, selectedPool, selectedPoolItem]);

    if (jadwal && jadwal.length > 0 && poolOption && selectedPool !== null) {
      return (
        <div className="flex flex-col h-full">
          <Card
            key={selectedPoolItem.value}
            // subtitle={selectedPoolItem.label}
            // headerslot={
            //   <div className="flex flex-col gap-1 text-sm">
            //     <div>Jumlah Pelatih: {filteredTrainers.length}</div>
            //   </div>
            // }
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

  const handleModal = ({ pool, jadwal, trainer, hari, jam }) => {
    setDetailModalVisible(true);
    loadProduct(pool.value);
    setInputValue((prevParams) => ({
      ...prevParams,
      pool: pool,
      trainer: trainer,
      day: hari,
      time: jam,
      trainer_percentage: trainer.percent,
      company_percentage: 100 - trainer.percent,
      branch: selectedBranch,
    }));
  };

  const PelatihKosong = React.memo(({ pool, jadwal, trainer, hari, jam }) => {
    return (
      <div className="flex justify-center items-center">
        <Tooltip placement="top" arrow content="Buat Order">
          <button
            onClick={() => handleModal({ pool, jadwal, trainer, hari, jam })}
            className="p-2 rounded-full bg-green-50 hover:bg-green-100 
                     transition duration-200 ease-in-out transform 
                     hover:scale-105 shadow-sm"
          >
            <Icon
              icon="heroicons-outline:plus"
              width="20"
              height="20"
              className="text-green-600"
            />
          </button>
        </Tooltip>
      </div>
    );
  });

  const PerpanjangPaket = React.memo(({ order_id }) => {
    return (
      <div className="flex justify-center items-center">
        <Tooltip placement="top" arrow content="Perpanjang Paket">
          <button
            onClick={(e) => {
              e.preventDefault();
              handlePerpanjang(order_id);
            }}
            className="p-2 rounded-full bg-pink-50 hover:bg-pink-100 transition 
                     duration-200 ease-in-out transform hover:scale-105 shadow-sm"
          >
            <Icon
              icon="heroicons-outline:heart"
              width="20"
              height="20"
              className="text-pink-600"
            />
          </button>
        </Tooltip>
      </div>
    );
  });

  return (
    <>
      <div className="flex flex-row justify-between items-center">
        <div className="flex flex-row items-center gap-3">
          <label>Cabang</label>
          <div className="flex gap-3 min-w-[400px]">
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
        {/* Card View */}
        <Switch
          label="Active Switch"
          value={checked}
          onChange={() => setChecked(!checked)}
          prevLabel={"Detail View"}
          nextLabel={"Student View"}
        />
      </div>
      <Tab.Group selectedIndex={selectedPool} onChange={handlePoolChange}>
        <Tab.List className="flex-nowrap overflow-x-auto whitespace-nowrap flex gap-3 my-0 py-3">
          <>
            {poolOption.map((item, i) => (
              <Tab key={i}>
                {({ selected }) => (
                  <button
                    className={`text-sm font-medium mb-7 last:mb-0 capitalize px-6 py-2 rounded-md transition duration-150 focus:outline-none ring-0 hover:bg-sky-300 
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
            <Tab.List className="flex-nowrap overflow-x-auto whitespace-nowrap flex gap-3 my-0 pb-3 justify-between ">
              <div className="flex gap-3">
                {selectedBranch &&
                  tabHari.map((item, i) => (
                    <Tab key={i}>
                      {({ selected }) => (
                        <button
                          className={`text-sm font-medium mb-7 last:mb-0 capitalize px-6 py-2 rounded-md transition duration-150 focus:outline-none ring-0  hover:bg-sky-300 
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
              </div>
              {selectedPool != -1 &&
              filterPelatih &&
              filterPelatih.length > 0 ? (
                <Select
                  name="filteredPelatih"
                  options={filterPelatih ?? null}
                  className="w-72 h-10 border-none"
                  horizontal={true}
                  isClearable={true}
                  menuPortalTarget={
                    typeof window !== "undefined" ? document.body : null
                  }
                  styles={{
                    menuPortal: (base) => ({
                      ...base,
                      zIndex: 9999,
                    }),
                  }}
                  placeholder="Filter Pelatih"
                  onChange={(e) => {
                    setFilteredPelatih(e?.value ?? "");
                  }}
                />
              ) : null}
            </Tab.List>
            <Tab.Panels key={JSON.stringify(jadwal)}>
              {tabHari.map((item, index) => {
                return (
                  <Tab.Panel key={index}>
                    <div className="max-h-[600px] ">{gridKolam(item.name)}</div>
                  </Tab.Panel>
                );
              })}
            </Tab.Panels>
          </Tab.Group>
        </Tab.Panels>
      </Tab.Group>
      {detailModalVisible && (
        <Modal
          title="Buat Invoice"
          activeModal={detailModalVisible}
          onClose={() => setDetailModalVisible(false)}
          className="max-w-5xl"
        >
          <CreateInvoice
            params={inputValue}
            product={productList}
            branch={selectedBranch}
            reloadDataMaster={() => {
              loadSchedule(
                selectedBranch,
                poolOption[selectedPool].value,
                daysOfWeek[selectedIndex].name
              );
              setPoolOption((prev) =>
                prev.map((item, index) =>
                  index === selectedPool
                    ? { ...item, filled: item.filled + 1 }
                    : item
                )
              );
              setTabHari((prev) =>
                prev.map((item, index) =>
                  index === selectedIndex
                    ? {
                        ...item,
                        total: item.total + 1,
                        data: {
                          ...item.data,
                          [inputValue.time]:
                            (item.data[inputValue.time] || 0) + 1,
                        },
                      }
                    : item
                )
              );
              setReloadDone(true); // ✅ trigger setelah selesai update
            }}
            // isModalShow={() => setDetailModalVisible(false)}
          />
        </Modal>
      )}
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
  <div className="flex flex-col items-center justify-center space-y-1">
    <div className="p-2 rounded-full bg-red-50 shadow-sm">
      <Icon
        icon="heroicons-outline:calendar-days"
        width="20"
        height="20"
        className="text-red-500"
      />
    </div>
    <span className="text-xs font-medium text-red-600">Libur</span>
  </div>
));

const PelatihAdaJadwal = React.memo(({ poolName = "" }) => (
  <div className="flex justify-center items-center">
    <Tooltip
      placement="top"
      arrow
      content={
        <div className="whitespace-pre-line text-sm text-white">
          {`Sudah ada jadwal di \n${poolName}`}
        </div>
      }
    >
      <div
        className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 
                      transition duration-200 ease-in-out shadow-sm cursor-default"
      >
        <Icon
          icon="heroicons-outline:hand-raised"
          width="20"
          height="20"
          className="text-gray-600"
        />
      </div>
    </Tooltip>
  </div>
));

const STATUS_MAP = {
  pending: {
    label: "Pending",
    className: "bg-amber-500 text-white",
    icon: "heroicons-outline:banknotes",
  },
  paid: {
    label: "Paid",
    className: "bg-emerald-500 text-white",
    icon: "heroicons-outline:banknotes",
  },
  // settled: {
  //   label: "Settled",
  //   className: "bg-white text-slate-800",
  //   icon: "heroicons-outline:banknotes",
  // },
  expired: {
    label: "Expired",
    className: "bg-danger-500 text-white",
    icon: "heroicons-outline:banknotes",
  },
};

const PaymentStatusBadge = ({ status }) => {
  const statusKey = status?.toLowerCase();
  const { label, className, icon } = STATUS_MAP[statusKey] || {
    label: status,
    className: "bg-gray-300 text-white",
    icon: "heroicons-outline:banknotes",
  };

  if (statusKey === "settled") return null;

  return (
    <Badge
      label={label}
      className={
        className +
        " animate-bounce justify-center text-[clamp(8px,0.7vw,10px)] p-1"
      }
      // icon={icon}
    />
  );
};

const AdminBadge = ({ admin }) => {
  return (
    <Badge
      label={admin}
      className="animate-bounce justify-center text-[clamp(9px,0.8vw,12px)] 
                 px-3 py-1 rounded-full 
                 bg-white text-pink-700 font-semibold 
                 shadow-md shadow-pink-200 
                 border border-pink-300
                 hover:bg-pink-200 transition"
    />
  );
};
