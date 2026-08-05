import { getProdukPool } from "@/axios/masterdata/produk";
import { getCabangAll } from "@/axios/referensi/cabang";
import { CJGetPool } from "@/axios/schedule/cekJadwal";
import Card from "@/components/ui/Card";
import { BaseJadwal } from "@/constant/cekJadwal";
import PoolLoader from "@/components/PoolLoader";
import { Tab } from "@headlessui/react";
import { Icon } from "@iconify/react";
import React, {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import AsyncSelect from "react-select/async";
import Modal from "@/components/ui/Modal";
import { DateTime } from "luxon";
import Swal from "sweetalert2";
import ApprovedRescheduleTable from "@/components/custom/ApprovedRescheduleTable";
import Select from "react-select";
import { toProperCase } from "@/utils";
import { buildWsUrl } from "@/utils/wsUrl";
import { PerpanjangOrder } from "@/axios/masterdata/order";
import { useAuthStore } from "@/redux/slicers/authSlice";
import { useQuery } from "@tanstack/react-query";
import ScheduleTable from "./components/ScheduleTable";
import {
  buildCompletedScheduleIndex,
  extractPayloadList,
  getCompletedOrderKey,
  getTrainerWorkStatus,
} from "./utils/scheduleHelpers";

const CreateInvoice = lazy(() => import("./addJadwal"));

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

  const { user_id } = useAuthStore((state) => state.data);
  const [tabHari, setTabHari] = useState(() =>
    daysOfWeek.map((day) => ({ ...day })),
  );
  const [poolOption, setPoolOption] = useState([]);
  const [selectedPool, setSelectedPool] = useState(-1);
  const [selectedIndex, setSelectedIndex] = useState();
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [selectedDay, setSelectedDay] = useState();
  const [filterPelatih, setFilterPelatih] = useState([]);
  const [filteredPelatih, setFilteredPelatih] = useState("");
  const [filteredGender, setFilteredGender] = useState("");
  const [jadwal, setJadwal] = useState([]);
  const [productList, setProductList] = useState([]);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [activeView, setActiveView] = useState(() => {
    if (typeof window === "undefined") return "schedule";
    return localStorage.getItem("CekJadwalActiveView") || "schedule";
  });
  const [reloadDone, setReloadDone] = useState(false);
  const [checked, setChecked] = useState(true);
  const [isScheduleLoading, setIsScheduleLoading] = useState(false);
  const [completedSchedules, setCompletedSchedules] = useState([]);
  const [isCompletedScheduleLoading, setIsCompletedScheduleLoading] =
    useState(false);
  const [breadcrumbActionsRoot, setBreadcrumbActionsRoot] = useState(null);
  const scheduleSocketRef = useRef(null);
  const completedScheduleSocketRef = useRef(null);

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

  const branchQuery = useQuery({
    queryKey: ["cekJadwal", "branches"],
    queryFn: async () => {
      const params = {
        page: 1,
        page_size: 200,
        is_active: true,
      };
      const response = await getCabangAll(params);
      return response.data.results
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((item) => ({
          value: item.branch_id,
          label: item.name,
        }));
    },
    staleTime: 5 * 60 * 1000,
  });

  const memoizedBranchOptions = useMemo(
    () => branchQuery.data ?? [],
    [branchQuery.data],
  );

  useEffect(() => {
    if (!selectedBranch && memoizedBranchOptions.length > 0) {
      setSelectedBranch(memoizedBranchOptions[0].value);
    }
  }, [memoizedBranchOptions, selectedBranch]);

  const poolQuery = useQuery({
    queryKey: ["cekJadwal", "pools", selectedBranch],
    queryFn: async () => {
      if (!selectedBranch) {
        return [];
      }
      const response = await CJGetPool(selectedBranch);
      return response.data
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((item) => ({
          value: item.pool_id,
          label: item.name,
          slot: 0,
          filled: item.total,
          data: item.days,
        }));
    },
    enabled: !!selectedBranch,
  });

  const selectedBranchOption = useMemo(
    () =>
      memoizedBranchOptions.find((option) => option.value === selectedBranch) ||
      null,
    [memoizedBranchOptions, selectedBranch],
  );

  const selectedPoolItem = useMemo(
    () => (selectedPool >= 0 ? poolOption[selectedPool] : null),
    [poolOption, selectedPool],
  );

  const selectedDayName = useMemo(
    () => selectedDay || daysOfWeek[selectedIndex]?.name || "",
    [selectedDay, selectedIndex],
  );

  const genderOptions = useMemo(
    () => [
      { value: "L", label: "Laki-laki" },
      { value: "P", label: "Perempuan" },
    ],
    [],
  );

  const completedScheduleIndex = useMemo(
    () => buildCompletedScheduleIndex(completedSchedules),
    [completedSchedules],
  );

  const completedScheduleCount = useMemo(() => {
    const seen = new Set();

    Object.values(completedScheduleIndex).forEach((scheduleByTime) => {
      Object.values(scheduleByTime).forEach((orders) => {
        orders.forEach((order) => seen.add(getCompletedOrderKey(order)));
      });
    });

    return seen.size;
  }, [completedScheduleIndex]);

  const compactSelectStyles = useMemo(
    () => ({
      control: (base) => ({
        ...base,
        minHeight: 36,
        borderRadius: 10,
        borderColor: "#e2e8f0",
        boxShadow: "none",
        fontSize: 13,
      }),
      valueContainer: (base) => ({
        ...base,
        padding: "0 10px",
      }),
      indicatorsContainer: (base) => ({
        ...base,
        height: 34,
      }),
      menuPortal: (base) => ({
        ...base,
        zIndex: 9999,
      }),
    }),
    [],
  );

  useEffect(() => {
    if (typeof document === "undefined") return;
    setBreadcrumbActionsRoot(document.getElementById("breadcrumb-actions"));
  }, []);

  useEffect(() => {
    if (!poolQuery.data) {
      return;
    }

    const pools = poolQuery.data;
    setPoolOption(pools);

    if (pools.length === 0) {
      setSelectedPool(-1);
      setTabHari(daysOfWeek.map((day) => ({ ...day })));
      setCompletedSchedules([]);
      return;
    }

    const defaultPool = pools[0];
    setSelectedPool(0);
    setSelectedIndex(0);
    setSelectedDay(daysOfWeek[0]?.name);

    const updatedTabHari = daysOfWeek.map((day) => {
      const dayData = defaultPool.data?.[day.name] ?? {
        total: 0,
        data: {},
      };
      return {
        ...day,
        data: dayData,
        total: dayData.total ?? 0,
      };
    });

    setTabHari(updatedTabHari);

    if (selectedBranch) {
      const defaultDay = daysOfWeek[0]?.name;
      if (defaultDay) {
        loadSchedule(selectedBranch, defaultPool.value, defaultDay);
        loadCompletedSchedule(selectedBranch, defaultPool.value, defaultDay);
      }
      loadProduct(defaultPool.value);
    }
  }, [poolQuery.data, selectedBranch]);

  const loadBranchOptions = useCallback(
    (inputValue) => {
      if (!memoizedBranchOptions.length) {
        return Promise.resolve([]);
      }
      const filtered = memoizedBranchOptions.filter((option) =>
        option.label.toLowerCase().includes((inputValue ?? "").toLowerCase()),
      );
      return Promise.resolve(filtered);
    },
    [memoizedBranchOptions],
  );

  const loadProduct = useCallback(async (poolName) => {
    try {
      const res = await getProdukPool(poolName);

      setProductList(res.data.results);
    } catch (error) {
      console.error(error);
    }
  }, []);

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
      contract_type_display:
        getTrainerWorkStatus(fillData) ?? baseJadwal.contract_type_display,
      phone: fillData.phone ?? baseJadwal.phone,
      gender: fillData.gender ?? baseJadwal.gender,
      kolam: fillData.kolam ?? baseJadwal.kolam,
      total_order: fillData.total_order ?? baseJadwal.total_order,
      percent: fillData.percent ?? baseJadwal.percent,
      is_paid: fillData.is_paid ?? baseJadwal.is_paid,
      datahari: updatedDatahari,
    };
  };

  const applyScheduleData = (scheduleData = []) => {
    const data = scheduleData.map((element) =>
      fillBaseJadwalWithData({ ...BaseJadwal }, element),
    );

    setFilterPelatih(
      data.map((item) => ({
        value: item.trainer_id,
        label: toProperCase(item.nickname),
      })),
    );
    setJadwal([...data]);
  };

  const closeScheduleSocket = () => {
    if (!scheduleSocketRef.current) {
      return;
    }

    const ws = scheduleSocketRef.current;
    scheduleSocketRef.current = null;
    ws.onopen = null;
    ws.onmessage = null;
    ws.onerror = null;
    ws.onclose = null;

    if (
      ws.readyState === WebSocket.OPEN ||
      ws.readyState === WebSocket.CONNECTING
    ) {
      ws.close(1000);
    }
  };

  const closeCompletedScheduleSocket = () => {
    if (!completedScheduleSocketRef.current) {
      return;
    }

    const ws = completedScheduleSocketRef.current;
    completedScheduleSocketRef.current = null;
    ws.onopen = null;
    ws.onmessage = null;
    ws.onerror = null;
    ws.onclose = null;

    if (
      ws.readyState === WebSocket.OPEN ||
      ws.readyState === WebSocket.CONNECTING
    ) {
      ws.close(1000);
    }
  };

  const loadCompletedSchedule = (_selectedBranch, poolName, dayName) => {
    closeCompletedScheduleSocket();

    if (!_selectedBranch || !poolName || !dayName) {
      setCompletedSchedules([]);
      setIsCompletedScheduleLoading(false);
      return;
    }

    setIsCompletedScheduleLoading(true);

    const endpoint = `/ws/completed-schedule/?branch=${_selectedBranch}&pool=${poolName}&day=${dayName}`;
    const wsUrl = buildWsUrl(endpoint);

    if (!wsUrl) {
      console.error("Unable to resolve completed schedule WebSocket URL");
      setCompletedSchedules([]);
      setIsCompletedScheduleLoading(false);
      return;
    }

    const ws = new WebSocket(wsUrl);
    completedScheduleSocketRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        setCompletedSchedules(extractPayloadList({ data: message }));
      } catch (error) {
        console.error(
          "Failed to parse completed schedule websocket payload:",
          error,
        );
        setCompletedSchedules([]);
      } finally {
        if (completedScheduleSocketRef.current === ws) {
          setIsCompletedScheduleLoading(false);
        }
      }
    };

    ws.onerror = (error) => {
      console.error("Completed schedule websocket error:", error);
      if (completedScheduleSocketRef.current === ws) {
        setCompletedSchedules([]);
        setIsCompletedScheduleLoading(false);
      }
    };

    ws.onclose = () => {
      if (completedScheduleSocketRef.current === ws) {
        completedScheduleSocketRef.current = null;
      }
    };
  };

  const loadSchedule = async (_selectedBranch, poolName, dayName) => {
    if (!poolName || !dayName) {
      return;
    }

    setIsScheduleLoading(true);
    closeScheduleSocket();

    const endpoint = `/ws/schedule/?branch=${_selectedBranch}&pool=${poolName}&day=${dayName}`;
    const wsUrl = buildWsUrl(endpoint);

    if (!wsUrl) {
      console.error("Unable to resolve schedule WebSocket URL");
      setIsScheduleLoading(false);
      return;
    }

    const ws = new WebSocket(wsUrl);
    scheduleSocketRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        const payload = Array.isArray(message)
          ? message
          : Array.isArray(message?.payload)
            ? message.payload
            : Array.isArray(message?.data)
              ? message.data
              : null;

        if (!payload) {
          console.warn("Unknown schedule websocket payload:", message);
          return;
        }

        applyScheduleData(payload);
      } catch (error) {
        console.error("Failed to parse schedule websocket payload:", error);
      } finally {
        setIsScheduleLoading(false);
      }
    };

    ws.onerror = (error) => {
      console.error("Schedule websocket error:", error);
      setIsScheduleLoading(false);
    };

    ws.onclose = () => {
      if (scheduleSocketRef.current === ws) {
        scheduleSocketRef.current = null;
      }
    };
  };

  useEffect(() => {
    return () => {
      closeScheduleSocket();
      closeCompletedScheduleSocket();
    };
  }, []);

  useEffect(() => {
    if (reloadDone) {
      setDetailModalVisible(false);
      setReloadDone(false); // reset trigger
      Swal.fire("Added!", "Your order has been added.", "success");
    }
  }, [reloadDone]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("CekJadwalActiveView", activeView);
    }
    if (activeView !== "schedule") {
      setDetailModalVisible(false);
    }
  }, [activeView]);

  useEffect(() => {
    setFilterPelatih([]);
    setFilteredPelatih("");
  }, [selectedIndex]);

  const handleBranchChange = (option) => {
    closeScheduleSocket();
    closeCompletedScheduleSocket();

    if (!option) {
      setSelectedBranch(null);
      setPoolOption([]);
      setSelectedPool(-1);
      setTabHari(daysOfWeek.map((day) => ({ ...day })));
      setFilterPelatih([]);
      setFilteredPelatih("");
      setSelectedDay(undefined);
      setCompletedSchedules([]);
      setIsScheduleLoading(false);
      setIsCompletedScheduleLoading(false);
      return;
    }

    setSelectedBranch(option.value);
    setSelectedIndex(0);
    setPoolOption([]);
    setSelectedPool(-1);
    setTabHari(daysOfWeek.map((day) => ({ ...day })));
    setSelectedDay(undefined);
    setFilterPelatih([]);
    setFilteredPelatih("");
    setCompletedSchedules([]);
    setIsScheduleLoading(false);
    setIsCompletedScheduleLoading(false);
  };

  const handlePoolChange = (index) => {
    try {
      const pool = poolOption[index];
      if (!pool) {
        return;
      }

      setSelectedPool(index);

      const updatedTabHari = daysOfWeek.map((item) => {
        const newData = pool.data?.[item.name] ?? { data: {}, total: 0 };
        return {
          ...item,
          data: newData,
          total: newData.total ?? 0,
        };
      });

      setTabHari(updatedTabHari);

      const poolName = pool.value;
      const dayName = daysOfWeek[selectedIndex]?.name;

      if (selectedBranch && poolName && dayName) {
        loadSchedule(selectedBranch, poolName, dayName);
        loadCompletedSchedule(selectedBranch, poolName, dayName);
      }

      if (poolName) {
        loadProduct(poolName);
      }
    } catch (error) {
      console.error("An error occurred while loading the schedule:", error);
    }
  };

  const handleChangeTab = (index) => {
    setSelectedIndex(index);
    try {
      const pool = poolOption[selectedPool];
      if (!pool) return;
      const poolName = pool.value;
      const dayName = daysOfWeek[index]?.name;
      setSelectedDay(dayName);
      if (selectedBranch && poolName && dayName) {
        loadSchedule(selectedBranch, poolName, dayName);
        loadCompletedSchedule(selectedBranch, poolName, dayName);
      }
    } catch (error) {
      console.error("An error occurred while loading the schedule:", error);
    }
  };

  const handlePerpanjang = useCallback(async (order_id, slot) => {
    // Swal.fire({
    //   title: "Perpanjang paket ",
    //   text: `Siswa ${slot.student} akan diperpanjang ?`,
    //   icon: "warning",
    //   showCancelButton: true,
    //   confirmButtonColor: "#22c55e",
    //   cancelButtonColor: "#ef4444",
    //   confirmButtonText: "Perpanjang",
    // }).then(async (result) => {
    //   if (result.isConfirmed) {
    //     let res = await PerpanjangOrder(order_id);
    //     if (res)
    //       loadSchedule(
    //         selectedBranch,
    //         poolOption[selectedPool].value,
    //         selectedDay
    //       );
    //   }
    // });

    const { value: order_date } = await Swal.fire({
      title: "Perpanjang paket ",
      text: `Siswa ${toProperCase(
        slot.student,
      )} akan diperpanjang ? jika Ya, silahkan isi tanggal ordernya`,
      input: "date",
      icon: "question",
      didOpen: () => {
        const today = new Date().toISOString();
        Swal.getInput().max = today.split("T")[0];
      },
    });

    if (order_date) {
      // console.log(order_date);
      Swal.fire({
        title: "Perpanjang paket ",
        text: `Siswa ${toProperCase(
          slot.student,
        )} akan diperpanjang ke tanggal ${order_date} ?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#22c55e",
        cancelButtonColor: "#ef4444",
        confirmButtonText: "Perpanjang",
      }).then(async (result) => {
        if (result.isConfirmed) {
          let res = await PerpanjangOrder(order_id, order_date);
          if (res) {
            const currentPool = poolOption[selectedPool];
            if (currentPool && selectedDay) {
              loadSchedule(selectedBranch, currentPool.value, selectedDay);
            }
          }
        }
      });
    }
  }, [poolOption, selectedBranch, selectedDay, selectedPool]);

  const gridKolam = (hari) => {
    const renderEmptyState = (title, description) => (
      <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-white/70 p-8 text-center text-sm text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900/50">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          <Icon icon="heroicons-outline:calendar-days" width={22} />
        </div>
        <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          {title}
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400">
          {description}
        </div>
      </div>
    );

    if (!selectedBranchOption) {
      return renderEmptyState(
        "Pilih cabang terlebih dahulu",
        "Cek jadwal dimulai dengan memilih cabang yang ingin dicek.",
      );
    }

    if (!selectedPoolItem) {
      return renderEmptyState(
        "Pilih kolam untuk melihat jadwal",
        "Kolam akan muncul setelah cabang dipilih.",
      );
    }

    if (isScheduleLoading) {
      return (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-white/70 p-8 text-sm text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900/50">
          <PoolLoader size="sm" />
          Memuat jadwal...
        </div>
      );
    }

    if (jadwal && jadwal.length > 0 && selectedPoolItem) {
      return (
        <div className="flex flex-col h-full">
          <Card
            key={selectedPoolItem.value}
            className="bg-transparent shadow-none"
            bodyClass="p-0"
            // subtitle={selectedPoolItem.label}
            // headerslot={
            //   <div className="flex flex-col gap-1 text-sm">
            //     <div>Jumlah Pelatih: {filteredTrainers.length}</div>
            //   </div>
            // }
          >
            <ScheduleTable
              pool={selectedPoolItem}
              day={hari}
              jadwal={jadwal}
              filteredPelatih={filteredPelatih}
              filteredGender={filteredGender}
              completedScheduleIndex={completedScheduleIndex}
              checked={checked}
              userId={user_id}
              onCreateOrder={handleModal}
              onPerpanjang={handlePerpanjang}
            />
          </Card>
        </div>
      );
    } else {
      return renderEmptyState(
        "Belum ada jadwal untuk hari ini",
        "Gunakan slot kosong untuk menambah jadwal baru.",
      );
    }
  };

  const handleModal = useCallback(({ pool, jadwal, trainer, hari, jam }) => {
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
  }, [loadProduct, selectedBranch]);

  const viewControls = (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      {/* <div className="flex items-center gap-2 rounded-lg border border-slate-200/70 bg-white px-2 py-1 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/70">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-300">
          Mode
        </span>
        <Switch
          value={checked}
          onChange={() => setChecked(!checked)}
          prevLabel="Detail"
          nextLabel="Siswa"
          labelClass="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-300"
          wrapperClass="gap-2"
          activeClass="bg-primary-500"
        />
      </div> */}

      <div className="flex items-center gap-2 rounded-lg border border-slate-200/70 bg-white px-2 py-1 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/70">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-300">
          Fitur
        </span>
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 dark:border-slate-700 dark:bg-slate-900">
          <button
            type="button"
            onClick={() => setActiveView("schedule")}
            className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition ${
              activeView === "schedule"
                ? "bg-primary-500 text-white"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
            }`}
          >
            Jadwal
          </button>
          <button
            type="button"
            onClick={() => setActiveView("reschedule")}
            className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition ${
              activeView === "reschedule"
                ? "bg-primary-500 text-white"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
            }`}
          >
            Reschedule
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {breadcrumbActionsRoot
        ? createPortal(viewControls, breadcrumbActionsRoot)
        : null}

      {activeView === "schedule" && (
        <Tab.Group selectedIndex={selectedPool} onChange={handlePoolChange}>
          <div className="mb-3 overflow-hidden rounded-xl border border-slate-200/70 bg-white shadow-sm dark:border-slate-700/70 dark:bg-slate-900/70">
            <div className="grid gap-4 p-3 lg:grid-cols-[minmax(260px,360px)_minmax(0,1fr)] lg:items-center">
              <div className="grid grid-cols-[58px_minmax(0,1fr)] items-center gap-3">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-300">
                  Cabang
                </label>
                <AsyncSelect
                  name="kolam"
                  placeholder="Pilih Cabang"
                  defaultOptions={memoizedBranchOptions}
                  loadOptions={loadBranchOptions}
                  onChange={handleBranchChange}
                  className="react-select"
                  classNamePrefix="select"
                  cacheOptions
                  isLoading={branchQuery.isLoading}
                  menuPortalTarget={
                    typeof window !== "undefined" ? document.body : null
                  }
                  styles={{
                    ...compactSelectStyles,
                  }}
                  loadingMessage={() => "Memuat cabang..."}
                  noOptionsMessage={() => "Cabang tidak ditemukan"}
                  value={selectedBranchOption}
                />
              </div>

              <div className="min-w-0">
                {poolQuery.isFetching && (
                  <div className="mb-1 text-right text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    Memuat kolam...
                  </div>
                )}

                {poolOption.length > 0 ? (
                  <Tab.List className="flex gap-1 overflow-x-auto rounded-lg border border-slate-200/70 bg-slate-50 p-1 dark:border-slate-700/70 dark:bg-slate-800/60">
                    {poolOption.map((item, i) => (
                      <Tab as={React.Fragment} key={i}>
                        {({ selected }) => (
                          <button
                            className={`shrink-0 whitespace-nowrap rounded-md px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wide transition focus:outline-none ${
                              selected
                                ? "bg-primary-500 text-white shadow-sm ring-1 ring-primary-400"
                                : "text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-900"
                            }`}
                          >
                            {item.label}
                            <span className="ml-2 rounded-full bg-white/70 px-1.5 py-0.5 text-[9px] text-slate-600 dark:bg-slate-900/70 dark:text-slate-200">
                              {item.filled}
                            </span>
                          </button>
                        )}
                      </Tab>
                    ))}
                  </Tab.List>
                ) : (
                  <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3 text-center text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400">
                    {poolQuery.isLoading
                      ? "Memuat kolam..."
                      : selectedBranchOption
                        ? "Belum ada kolam di cabang ini."
                        : "Pilih cabang untuk menampilkan daftar kolam."}
                  </div>
                )}
              </div>
            </div>

            <Tab.Panels>
              <Tab.Group
                selectedIndex={selectedIndex ?? -1}
                onChange={handleChangeTab}
              >
                <div className="grid gap-4 border-t border-slate-100 p-3 dark:border-slate-800 xl:grid-cols-[minmax(0,1fr)_minmax(500px,600px)] xl:items-center">
                  <div className="grid min-w-0 grid-cols-[58px_minmax(0,1fr)] items-center gap-3">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-300">
                      Hari
                    </div>
                    <Tab.List className="flex min-w-0 gap-1 overflow-x-auto rounded-lg border border-slate-200/70 bg-slate-50 p-1 dark:border-slate-700/70 dark:bg-slate-800/60">
                      {selectedBranch &&
                        tabHari.map((item, i) => (
                          <Tab as={React.Fragment} key={i}>
                            {({ selected }) => (
                              <button
                                className={`shrink-0 whitespace-nowrap rounded-md px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wide transition focus:outline-none ${
                                  selected
                                    ? "bg-primary-500 text-white shadow-sm ring-1 ring-primary-400"
                                    : "text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-900"
                                }`}
                              >
                                {item.name}
                                <span className="ml-2 rounded-full bg-white/70 px-1.5 py-0.5 text-[9px] text-slate-600 dark:bg-slate-900/70 dark:text-slate-200">
                                  {item.total}
                                </span>
                              </button>
                            )}
                          </Tab>
                        ))}
                    </Tab.List>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-[minmax(250px,1fr)_minmax(210px,240px)] sm:items-center">
                    {filterPelatih && filterPelatih.length > 0 ? (
                      <div className="grid grid-cols-[64px_minmax(0,1fr)] items-center gap-2">
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-300">
                          Pelatih
                        </label>
                        <Select
                          name="filteredPelatih"
                          options={filterPelatih ?? null}
                          className="react-select"
                          classNamePrefix="select"
                          isClearable={true}
                          menuPortalTarget={
                            typeof window !== "undefined" ? document.body : null
                          }
                          styles={{
                            ...compactSelectStyles,
                          }}
                          placeholder="Pilih pelatih"
                          onChange={(e) => {
                            setFilteredPelatih(e?.value ?? "");
                          }}
                        />
                      </div>
                    ) : null}

                    <div className="grid grid-cols-[56px_minmax(0,1fr)] items-center gap-2">
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-300">
                        Gender
                      </label>
                      <Select
                        name="filteredGender"
                        options={genderOptions}
                        className="react-select"
                        classNamePrefix="select"
                        isClearable={true}
                        menuPortalTarget={
                          typeof window !== "undefined" ? document.body : null
                        }
                        styles={{
                          ...compactSelectStyles,
                        }}
                        placeholder="Semua gender"
                        onChange={(e) => {
                          setFilteredGender(e?.value ?? "");
                        }}
                      />
                    </div>
                  </div>
                </div>

                <Tab.Panels className="mt-3">
                  {tabHari.map((item, index) => {
                    return (
                      <Tab.Panel key={index}>
                        <div>{gridKolam(item.name)}</div>
                      </Tab.Panel>
                    );
                  })}
                </Tab.Panels>
              </Tab.Group>
            </Tab.Panels>
          </div>
        </Tab.Group>
      )}

      {/* {activeView === "reschedule" && (
        <div className="mb-3 rounded-xl border border-slate-200/70 bg-white p-3 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/70">
          <div className="flex flex-col gap-1 sm:w-[320px]">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-300">
              Cabang
            </label>
            <AsyncSelect
              name="kolam"
              placeholder="Pilih Cabang"
              defaultOptions={memoizedBranchOptions}
              loadOptions={loadBranchOptions}
              onChange={handleBranchChange}
              className="react-select"
              classNamePrefix="select"
              cacheOptions
              isLoading={branchQuery.isLoading}
              menuPortalTarget={
                typeof window !== "undefined" ? document.body : null
              }
              styles={{
                ...compactSelectStyles,
              }}
              loadingMessage={() => "Memuat cabang..."}
              noOptionsMessage={() => "Cabang tidak ditemukan"}
              value={selectedBranchOption}
            />
          </div>
        </div>
      )} */}

      {activeView === "reschedule" && (
        <ApprovedRescheduleTable
          title="Reschedule Approved"
          subtitle="Data reschedule approved langsung dari OPX API."
          showSummary={false}
        />
      )}

      {activeView === "schedule" && detailModalVisible && (
        <Modal
          title="Buat Invoice"
          activeModal={detailModalVisible}
          onClose={() => setDetailModalVisible(false)}
          className="max-w-5xl"
        >
          <Suspense
            fallback={
              <div className="flex min-h-[240px] items-center justify-center">
                <PoolLoader size="sm" />
              </div>
            }
          >
            <CreateInvoice
              params={inputValue}
              product={productList}
              branch={selectedBranch}
              reloadDataMaster={() => {
                const currentPool = poolOption[selectedPool];
                const dayName = daysOfWeek[selectedIndex]?.name;
                if (selectedBranch && currentPool && dayName) {
                  loadSchedule(selectedBranch, currentPool.value, dayName);
                  loadCompletedSchedule(
                    selectedBranch,
                    currentPool.value,
                    dayName,
                  );
                }
                setPoolOption((prev) =>
                  prev.map((item, index) =>
                    index === selectedPool
                      ? { ...item, filled: item.filled + 1 }
                      : item,
                  ),
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
                      : item,
                  ),
                );
                setReloadDone(true); // ✅ trigger setelah selesai update
              }}
              // isModalShow={() => setDetailModalVisible(false)}
            />
          </Suspense>
        </Modal>
      )}
    </>
  );
};

export default CekJadwal;
