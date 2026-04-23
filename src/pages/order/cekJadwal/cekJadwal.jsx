import { getProdukPool } from "@/axios/masterdata/produk";
import { getCabangAll } from "@/axios/referensi/cabang";
import { getKolamAll, getKolamByBranch } from "@/axios/referensi/kolam";
import { CJCompletedSchedule, CJGetPool } from "@/axios/schedule/cekJadwal";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Tooltip from "@/components/ui/Tooltip";
import { BaseJadwal } from "@/constant/cekJadwal";
import PoolLoader from "@/components/PoolLoader";
import { Tab } from "@headlessui/react";
import { Icon } from "@iconify/react";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import AsyncSelect from "react-select/async";
import CreateInvoice from "./addJadwal";
import Modal from "@/components/ui/Modal";
import { DateTime } from "luxon";
import Swal from "sweetalert2";
import Dropdown from "@/components/ui/Dropdown";
import WhatsAppButton from "@/components/custom/sendwhatsapp";
import ApprovedRescheduleTable from "@/components/custom/ApprovedRescheduleTable";
import Icons from "@/components/ui/Icon";
import Select from "react-select";
import Switch from "@/components/ui/Switch";
import { toProperCase } from "@/utils";
import { buildWsUrl } from "@/utils/wsUrl";
import { PerpanjangOrder } from "@/axios/masterdata/order";
import { useAuthStore } from "@/redux/slicers/authSlice";
import { useQuery } from "@tanstack/react-query";

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
    case product.includes("baby"):
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

const normalizeScheduleTime = (time) => {
  if (time === null || time === undefined) return "";

  const raw = String(time).trim();
  const match = raw.match(/(\d{1,2})[:.](\d{2})/);
  if (match) {
    return `${match[1].padStart(2, "0")}.${match[2]}`;
  }

  const hourOnly = raw.match(/\b(\d{1,2})\b/);
  return hourOnly ? `${hourOnly[1].padStart(2, "0")}.00` : raw;
};

const normalizeLookupKey = (value) => {
  if (value === null || value === undefined) return "";
  return String(value).trim().toLowerCase();
};

const getScheduleTimeValue = (entry) =>
  entry?.jam ??
  entry?.time ??
  entry?.start_time ??
  entry?.startTime ??
  entry?.schedule_time ??
  entry?.scheduleTime ??
  entry?.order_time ??
  entry?.orderTime ??
  entry?.hour;

const getTrainerKeys = (entry) => {
  const trainer =
    entry?.trainer && typeof entry.trainer === "object" ? entry.trainer : null;

  const values = [
    entry?.trainer_id,
    entry?.trainerId,
    entry?.trainer_uuid,
    entry?.coach_id,
    typeof entry?.trainer === "string" ? entry.trainer : null,
    trainer?.trainer_id,
    trainer?.trainerId,
    trainer?.id,
    entry?.fullname,
    entry?.full_name,
    entry?.trainer_name,
    entry?.trainerName,
    entry?.nickname,
    trainer?.fullname,
    trainer?.full_name,
    trainer?.name,
    trainer?.nickname,
  ];

  return Array.from(new Set(values.map(normalizeLookupKey).filter(Boolean)));
};

const extractPayloadList = (response) => {
  const data = response?.data;
  const payload = data?.results ?? data?.data ?? data?.payload ?? data ?? [];

  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === "object") {
    return Object.entries(payload).map(([key, value]) => {
      const keyIsTime =
        /^\d{1,2}[:.]\d{2}/.test(key) ||
        normalizeScheduleTime(key) !== key ||
        /^\d{1,2}$/.test(key);

      if (Array.isArray(value)) {
        return keyIsTime
          ? { jam: key, orders: value }
          : { trainer_id: key, orders: value };
      }

      return value && typeof value === "object"
        ? {
            ...value,
            ...(keyIsTime
              ? { jam: value.jam ?? key }
              : { trainer_id: value.trainer_id ?? key }),
          }
        : { trainer_id: key, value };
    });
  }

  return [];
};

const getStudentNames = (order) => {
  const value =
    order?.student ??
    order?.students ??
    order?.siswa ??
    order?.student_names ??
    order?.studentNames ??
    order?.student_name ??
    order?.studentName;

  const list = Array.isArray(value) ? value : value ? [value] : [];

  return list
    .map((item) => {
      if (!item) return null;
      if (typeof item === "string") return item;
      return (
        item.fullname ??
        item.full_name ??
        item.name ??
        item.student_name ??
        item.nickname ??
        null
      );
    })
    .filter(Boolean);
};

const getCompletedOrderKey = (order) => {
  const students = getStudentNames(order).join("|");
  return (
    order?.order_id ??
    order?.orderId ??
    order?.id ??
    `${students}-${order?.product ?? order?.product_name ?? ""}-${
      order?.completed_date ?? order?.finish_date ?? order?.end_date ?? ""
    }`
  );
};

const hasCompletedOrderDetails = (order) =>
  Boolean(
    order?.order_id ||
    order?.orderId ||
    order?.id ||
    order?.product ||
    order?.product_name ||
    order?.paket ||
    order?.package_name ||
    order?.completed_date ||
    order?.finish_date ||
    order?.end_date ||
    order?.last_meet_date ||
    getStudentNames(order).length,
  );

const addCompletedOrderToIndex = (index, trainerKeys, timeKey, order) => {
  if (!timeKey || trainerKeys.length === 0) return;
  if (!hasCompletedOrderDetails(order)) return;

  trainerKeys.forEach((trainerKey) => {
    if (!index[trainerKey]) {
      index[trainerKey] = {};
    }
    if (!index[trainerKey][timeKey]) {
      index[trainerKey][timeKey] = [];
    }
    index[trainerKey][timeKey].push(order);
  });
};

const buildCompletedScheduleIndex = (items = []) => {
  const index = {};

  const walkEntry = (entry, fallbackTrainerKeys = [], fallbackTime = "") => {
    if (!entry) return;

    const trainerKeys = Array.from(
      new Set([...fallbackTrainerKeys, ...getTrainerKeys(entry)]),
    );
    const timeKey =
      normalizeScheduleTime(getScheduleTimeValue(entry)) || fallbackTime;

    if (Array.isArray(entry?.datahari)) {
      entry.datahari.forEach((day) => {
        if (Array.isArray(day?.data)) {
          day.data.forEach((slot) =>
            walkEntry(slot, trainerKeys, normalizeScheduleTime(slot?.jam)),
          );
          return;
        }

        if (day?.data && typeof day.data === "object") {
          Object.entries(day.data).forEach(([jam, orders]) => {
            const slotTime = normalizeScheduleTime(jam);
            const orderList = Array.isArray(orders) ? orders : [orders];
            orderList.forEach((order) =>
              walkEntry(order, trainerKeys, slotTime),
            );
          });
        }
      });
      return;
    }

    const nestedCollections = [
      entry?.orders,
      entry?.schedules,
      entry?.completed_schedules,
      entry?.completedSchedules,
      entry?.order_schedules,
      entry?.orderSchedules,
    ].filter(Array.isArray);

    if (nestedCollections.length > 0) {
      nestedCollections.forEach((collection) =>
        collection.forEach((order) => walkEntry(order, trainerKeys, timeKey)),
      );
      return;
    }

    if (entry?.data && typeof entry.data === "object") {
      if (Array.isArray(entry.data)) {
        entry.data.forEach((slot) => walkEntry(slot, trainerKeys, timeKey));
        return;
      }

      Object.entries(entry.data).forEach(([jam, orders]) => {
        const slotTime = normalizeScheduleTime(jam);
        const orderList = Array.isArray(orders) ? orders : [orders];
        orderList.forEach((order) => walkEntry(order, trainerKeys, slotTime));
      });
      return;
    }

    addCompletedOrderToIndex(index, trainerKeys, timeKey, entry);
  };

  items.forEach((item) => walkEntry(item));
  return index;
};

const getCompletedSchedulesForSlot = (index, trainer, time) => {
  const timeKey = normalizeScheduleTime(time);
  const seen = new Set();

  return getTrainerKeys(trainer)
    .flatMap((trainerKey) => index?.[trainerKey]?.[timeKey] ?? [])
    .filter((order) => {
      const key = getCompletedOrderKey(order);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
};

const getCompletedScheduleProductLabel = (schedule) => {
  const product =
    schedule?.product ??
    schedule?.product_name ??
    schedule?.paket ??
    schedule?.package_name ??
    "";

  if (!product) return "Paket";

  const normalizedProduct = String(product).toLowerCase();
  const shortLabel = checkProduct(normalizedProduct);

  if (shortLabel === "Trial" && !normalizedProduct.includes("trial")) {
    return toProperCase(String(product));
  }

  return shortLabel;
};

const formatCompletedScheduleDate = (dateValue) => {
  if (!dateValue) return "";

  const rawValue = String(dateValue);
  const isoDate = DateTime.fromISO(rawValue);
  if (isoDate.isValid) {
    return isoDate.toFormat("dd LLL yyyy");
  }

  const slashDate = DateTime.fromFormat(rawValue, "dd/MM/yyyy");
  if (slashDate.isValid) {
    return slashDate.toFormat("dd LLL yyyy");
  }

  return rawValue;
};

const getLastMeetDateFromSchedule = (schedule) => {
  const meets =
    schedule?.p ??
    schedule?.meetings ??
    schedule?.order_meetings ??
    schedule?.orderMeetings ??
    [];

  if (!Array.isArray(meets)) return "";

  return [...meets]
    .reverse()
    .map(
      (meet) =>
        meet?.tgl ??
        meet?.date ??
        meet?.meet_date ??
        meet?.meeting_date ??
        meet?.training_date,
    )
    .find(Boolean);
};

const getCompletedScheduleOrderDate = (schedule) =>
  schedule?.order_date ??
  schedule?.orderDate ??
  schedule?.created_at ??
  schedule?.createdAt ??
  schedule?.order?.order_date ??
  schedule?.order?.orderDate ??
  "";

const getCompletedScheduleLastTrainingDate = (schedule) =>
  schedule?.last_training_date ??
  schedule?.lastTrainingDate ??
  schedule?.last_meet_date ??
  schedule?.lastMeetDate ??
  schedule?.last_presence_date ??
  schedule?.lastPresenceDate ??
  schedule?.completed_date ??
  schedule?.finish_date ??
  schedule?.end_date ??
  getLastMeetDateFromSchedule(schedule) ??
  "";

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

  const { user_id, username, roles } = useAuthStore((state) => state.data);
  const [tabHari, setTabHari] = useState(() =>
    daysOfWeek.map((day) => ({ ...day })),
  );
  const [poolOption, setPoolOption] = useState([]);
  const [selectedPool, setSelectedPool] = useState(-1);
  const [selectedIndex, setSelectedIndex] = useState();
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [selectedDay, setSelectedDay] = useState();
  const [jumlahSiswaPerKolam, setJumlahSiswaPerKolam] = useState([]);
  const [jumlahSiswaPerhari, setJumlahSiswaPerhari] = useState([]);
  const [jumlahPelatih, setJumlahPelatih] = useState([]);
  const [filterPelatih, setFilterPelatih] = useState([]);
  const [filteredPelatih, setFilteredPelatih] = useState("");
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
  const scheduleSocketRef = useRef(null);
  const completedScheduleRequestRef = useRef(0);

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

  const visibleTrainerCount = useMemo(() => {
    if (!jadwal.length) {
      return 0;
    }
    if (!filteredPelatih) {
      return jadwal.length;
    }
    return jadwal.filter((trainer) => trainer.trainer_id === filteredPelatih)
      .length;
  }, [jadwal, filteredPelatih]);

  const filteredTrainers = useMemo(() => {
    if (!selectedPoolItem) {
      return [];
    }
    return jadwal.filter((trainer) =>
      trainer.kolam.includes(selectedPoolItem.value),
    );
  }, [jadwal, selectedPoolItem]);

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

  const loadProduct = async (poolName) => {
    try {
      const res = await getProdukPool(poolName);

      setProductList(res.data.results);
    } catch (error) {
      console.error(error);
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

  const loadCompletedSchedule = async (_selectedBranch, poolName, dayName) => {
    if (!_selectedBranch || !poolName || !dayName) {
      setCompletedSchedules([]);
      return;
    }

    const requestId = completedScheduleRequestRef.current + 1;
    completedScheduleRequestRef.current = requestId;
    setIsCompletedScheduleLoading(true);

    try {
      const response = await CJCompletedSchedule(
        _selectedBranch,
        poolName,
        dayName,
      );

      if (completedScheduleRequestRef.current !== requestId) {
        return;
      }

      setCompletedSchedules(extractPayloadList(response));
    } catch (error) {
      console.error("Failed to load completed schedules:", error);
      if (completedScheduleRequestRef.current === requestId) {
        setCompletedSchedules([]);
      }
    } finally {
      if (completedScheduleRequestRef.current === requestId) {
        setIsCompletedScheduleLoading(false);
      }
    }
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
    if (!option) {
      setSelectedBranch(null);
      setPoolOption([]);
      setSelectedPool(-1);
      setTabHari(daysOfWeek.map((day) => ({ ...day })));
      setFilterPelatih([]);
      setFilteredPelatih("");
      setSelectedDay(undefined);
      setCompletedSchedules([]);
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

  const handlePerpanjang = async (order_id, slot) => {
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
  };

  const GridKolamDetail = React.memo(({ item, pool }) => {
    const selectedDay = daysOfWeek[selectedIndex]?.name;

    const filteredDataHari =
      item.datahari?.filter((x) => x.hari === selectedDay) || [];

    return (
      <>
        {filteredDataHari.flatMap((timeSlot, i) =>
          timeSlot.data.map((slotObj, jIdx) => {
            const orders = Array.isArray(slotObj.orders) ? slotObj.orders : [];
            const completedOrders = getCompletedSchedulesForSlot(
              completedScheduleIndex,
              item,
              slotObj.jam,
            );

            // Jika free langsung render PelatihLibur
            if (orders[0]?.is_free) {
              return (
                <div className="flex min-h-[70px] flex-col items-center justify-center gap-2">
                  <CompletedScheduleHint schedules={completedOrders} />
                  <PelatihLibur compact />
                  <PelatihKosong
                    pool={pool}
                    trainer={item}
                    hari={timeSlot.hari}
                    jam={slotObj.jam}
                  />
                </div>
              );
            }

            // Cek apakah ada slot di pool lain
            const isOtherPoolSlot = (slot) =>
              slot.order_id &&
              slot.pool_name !== pool.label &&
              Array.isArray(slot.p) &&
              slot.p.every((item) => item.tgl === null);

            const samePoolOrders = orders.filter(
              (slot) => slot.order_id && slot.pool_name === pool.label,
            );
            const otherPoolOrders = orders.filter(isOtherPoolSlot);
            const otherPoolNames = Array.from(
              new Set(
                otherPoolOrders.map((slot) => slot.pool_name).filter(Boolean),
              ),
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
                    <AdminBadge admin={slot.admin} />
                    <Badge
                      label={checkProduct(slot.product)}
                      className="bg-primary-500 text-white justify-center text-[clamp(8px,0.7vw,12px)]"
                    />
                    {slot.student?.map((x, idx) => (
                      <div key={idx} className="text-[clamp(8px,0.7vw,10px)]">
                        {/* {toProperCase(x.split(" ")[0])} */}
                        {toProperCase(x)}
                      </div>
                    ))}
                    {slot.frequency_per_week > 1 ? (
                      <span className="text-[clamp(8px,0.7vw,10px)]">
                        {slot.frequency_per_week}x / minggu
                      </span>
                    ) : null}
                    <PerpanjangPaket order_id={slot.order_id} slot={slot} />
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
                      <Tooltip
                        content={toProperCase(slot.student?.join(", ") || "")}
                      >
                        <span>{iconProduct(slot.product)}</span>
                      </Tooltip>
                      {slot.frequency_per_week > 1 ? (
                        <span className="text-[clamp(8px,0.7vw,10px)]">
                          {slot.frequency_per_week}x / minggu
                        </span>
                      ) : null}
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
                    <div className="relative">
                      <PerpanjangPaket order_id={slot.order_id} slot={slot} />
                    </div>
                  </>
                </div>
              );
            };

            return (
              <div
                key={`${jIdx}-${i}-${jIdx}`}
                className="flex flex-col gap-2 min-h-[70px] justify-center"
              >
                {samePoolOrders.map((slot, k) =>
                  renderSamePoolSlot(slot, `${i}-${jIdx}-${k}`),
                )}

                <CompletedScheduleHint schedules={completedOrders} />

                {otherPoolOrders.length > 0 && (
                  <PelatihAdaJadwal
                    key={`other-${i}-${jIdx}`}
                    poolNames={otherPoolNames}
                    count={otherPoolOrders.length}
                  />
                )}

                <PelatihKosong
                  pool={pool}
                  trainer={item}
                  hari={timeSlot.hari}
                  jam={slotObj.jam}
                />
              </div>
            );
          }),
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
    const scrollContainerRef = useRef(null);
    const [scrollHeight, setScrollHeight] = useState(null);

    const updateScrollHeight = useCallback(() => {
      if (!scrollContainerRef.current) return;
      const { top } = scrollContainerRef.current.getBoundingClientRect();
      const paddingBottom = 24;
      const calculatedHeight = window.innerHeight - top - paddingBottom;
      if (calculatedHeight > 0) {
        setScrollHeight(Math.max(calculatedHeight, 200));
      }
    }, []);

    useEffect(() => {
      updateScrollHeight();
      window.addEventListener("resize", updateScrollHeight);
      return () => window.removeEventListener("resize", updateScrollHeight);
    }, [updateScrollHeight]);

    useEffect(() => {
      updateScrollHeight();
    }, [dataJadwal, updateScrollHeight]);

    return (
      <div className="w-full">
        <div className="overflow-x-auto">
          <div className="min-w-[1200px]">
            <div className="grid grid-cols-15 gap-2 w-full sticky top-0 z-20 bg-slate-50/90 backdrop-blur border-b border-slate-200/70">
              <div className="border-b border-slate-200/70 p-2 min-h-[72px] text-center text-xs font-semibold uppercase tracking-wider text-slate-600 flex items-center justify-center sticky left-0 top-0 bg-slate-50/90 z-30">
                Pelatih
              </div>
              {columnHeader.slice(1).map((header, i) => {
                const jumlahPerJam = item.data[day][header];
                return (
                  <div
                    key={i}
                    className="border-b border-slate-200/70 p-2 min-h-[72px] text-center text-xs font-semibold uppercase tracking-wider text-slate-600 flex items-center justify-center sticky top-0 bg-slate-50/90 z-20"
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

            <div
              ref={scrollContainerRef}
              className="overflow-y-auto"
              style={
                scrollHeight ? { maxHeight: `${scrollHeight}px` } : undefined
              }
            >
              {dataJadwal.map((de) => (
                <div
                  key={de.trainer_id}
                  className="grid grid-cols-15 gap-3 my-2 w-full"
                >
                  <div
                    className={`p-2 min-h-[80px] flex flex-col rounded-xl border border-white/40 shadow-sm sticky left-0 z-20 justify-center gap-1 ${
                      de.gender === "L"
                        ? "bg-blue-100 text-blue-900"
                        : "bg-pink-100 text-pink-900"
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
        </div>
      </div>
    );
  });

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
      return renderEmptyState(
        "Belum ada jadwal untuk hari ini",
        "Gunakan slot kosong untuk menambah jadwal baru.",
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
            className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 hover:bg-emerald-100 transition duration-200 ease-in-out transform hover:scale-105 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/70"
          >
            <Icon
              icon="heroicons-outline:plus"
              width="20"
              height="20"
              className="text-emerald-600"
            />
          </button>
        </Tooltip>
      </div>
    );
  });

  const PerpanjangPaket = React.memo(
    ({ order_id, slot, buttonClassName = "", iconClassName = "" }) => {
      return (
        <div className="flex justify-center items-center">
          <Tooltip placement="top" arrow content="Perpanjang Paket">
            <button
              onClick={(e) => {
                e.preventDefault();
                handlePerpanjang(order_id, slot);
              }}
              className={
                buttonClassName ||
                "p-2 rounded-full bg-pink-50 hover:bg-pink-100 transition duration-200 ease-in-out transform hover:scale-105 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300/70"
              }
            >
              <Icon
                icon="heroicons-outline:heart"
                width="20"
                height="20"
                className={iconClassName || "text-pink-600"}
              />
            </button>
          </Tooltip>
        </div>
      );
    },
  );

  const legendItems = [
    {
      label: "Slot kosong (buat order)",
      icon: "heroicons-outline:plus",
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    },
    {
      label: "Perpanjang paket",
      icon: "heroicons-outline:heart",
      className: "border-pink-200 bg-pink-50 text-pink-700",
    },
    {
      label: "Jadwal di kolam lain",
      icon: "heroicons-outline:hand-raised",
      className: "border-slate-200 bg-slate-100 text-slate-600",
    },
    {
      label: "Pelatih libur",
      icon: "heroicons-outline:calendar-days",
      className: "border-rose-200 bg-rose-50 text-rose-700",
    },
  ];

  return (
    <>
      <div className="mb-4 rounded-2xl border border-slate-200/70 bg-gradient-to-br from-white via-slate-50 to-slate-100/70 p-3 shadow-sm dark:border-slate-700/70 dark:from-slate-900/70 dark:via-slate-900/50 dark:to-slate-800/60 sm:p-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Cek Jadwal
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pilih cabang, kolam, dan hari. Klik slot kosong untuk membuat
                order.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2 rounded-xl border border-slate-200/70 bg-white/80 px-2 py-1.5 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/60">
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
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-slate-200/70 bg-white/80 px-2 py-1.5 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/60">
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
                    Grid Jadwal
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
          </div>

          <div className="grid gap-3 lg:grid-cols-[minmax(260px,380px)_minmax(0,1fr)] lg:items-end">
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-300">
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
                  menuPortal: (base) => ({
                    ...base,
                    zIndex: 9999,
                  }),
                }}
                loadingMessage={() => "Memuat cabang..."}
                noOptionsMessage={() => "Cabang tidak ditemukan"}
                value={selectedBranchOption}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                {
                  label: "Cabang",
                  value: selectedBranchOption?.label || "Belum dipilih",
                },
                {
                  label: "Kolam",
                  value: selectedPoolItem?.label || "Belum dipilih",
                },
                {
                  label: "Hari",
                  value: selectedDayName || "Belum dipilih",
                },
                {
                  label: "Pelatih",
                  value: `${visibleTrainerCount} pelatih`,
                },
                {
                  label: "Riwayat",
                  value: isCompletedScheduleLoading
                    ? "Memuat..."
                    : `${completedScheduleCount} selesai`,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/80 px-2 py-0.5 text-[11px] font-semibold text-slate-600 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/60 dark:text-slate-200"
                >
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 dark:text-slate-400">
                    {item.label}
                  </span>
                  <span className="text-slate-700 dark:text-slate-100">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {activeView === "schedule" && (
        <Tab.Group selectedIndex={selectedPool} onChange={handlePoolChange}>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-300">
                  Kolam
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Pilih kolam untuk melihat ketersediaan jadwal.
                </p>
              </div>
              {poolQuery.isFetching && (
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Memuat kolam...
                </span>
              )}
            </div>

            {poolOption.length > 0 ? (
              <Tab.List className="flex flex-wrap gap-2 rounded-2xl border border-slate-200/70 bg-white/80 p-2 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/60">
                {poolOption.map((item, i) => (
                  <Tab key={i}>
                    {({ selected }) => (
                      <button
                        className={`rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition focus:outline-none ${
                          selected
                            ? "bg-primary-500 text-white shadow-sm"
                            : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
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
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-6 text-center text-sm text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-400">
                {poolQuery.isLoading
                  ? "Memuat kolam..."
                  : selectedBranchOption
                    ? "Belum ada kolam di cabang ini."
                    : "Pilih cabang untuk menampilkan daftar kolam."}
              </div>
            )}
          </div>

          <Tab.Panels className="mt-4">
            <Tab.Group
              selectedIndex={selectedIndex ?? -1}
              onChange={handleChangeTab}
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <Tab.List className="flex flex-wrap gap-2 rounded-2xl border border-slate-200/70 bg-white/80 p-2 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/60">
                  {selectedBranch &&
                    tabHari.map((item, i) => (
                      <Tab key={i}>
                        {({ selected }) => (
                          <button
                            className={`rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition focus:outline-none ${
                              selected
                                ? "bg-primary-500 text-white shadow-sm"
                                : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
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

                {filterPelatih && filterPelatih.length > 0 ? (
                  <div className="min-w-[220px]">
                    <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-300">
                      Filter pelatih
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
                        menuPortal: (base) => ({
                          ...base,
                          zIndex: 9999,
                        }),
                      }}
                      placeholder="Pilih pelatih"
                      onChange={(e) => {
                        setFilteredPelatih(e?.value ?? "");
                      }}
                    />
                  </div>
                ) : null}
              </div>

              <Tab.Panels key={JSON.stringify(jadwal)} className="mt-4">
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
        </Tab.Group>
      )}

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
        </Modal>
      )}
    </>
  );
};

export default CekJadwal;

const PelatihLibur = React.memo(({ compact = false }) => {
  const icon = (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-50 shadow-sm">
      <Icon
        icon="heroicons-outline:calendar-days"
        width="20"
        height="20"
        className="text-rose-500"
      />
    </div>
  );

  if (compact) {
    return (
      <Tooltip placement="top" arrow content="Libur">
        {icon}
      </Tooltip>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-1">
      {icon}
      <span className="text-xs font-medium text-rose-600">Libur</span>
    </div>
  );
});

const PelatihAdaJadwal = React.memo(({ poolNames = [], count = 0 }) => {
  const list = poolNames.length ? poolNames : ["kolam lain"];
  const heading = count > 1 ? `Sudah ada ${count} jadwal` : "Sudah ada jadwal";
  return (
    <div className="flex justify-center items-center">
      <Tooltip
        placement="top"
        arrow
        content={
          <div className="whitespace-pre-line text-sm text-white">
            {`${heading}\n${list.join("\n")}`}
          </div>
        }
      >
        <div
          className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 
                        transition duration-200 ease-in-out shadow-sm cursor-default"
        >
          <Icon
            icon="heroicons-outline:hand-raised"
            width="20"
            height="20"
            className="text-slate-600"
          />
        </div>
      </Tooltip>
    </div>
  );
});

const CompletedScheduleHint = React.memo(({ schedules = [] }) => {
  if (!schedules.length) return null;

  const visibleSchedules = schedules.slice(0, 5);
  const hiddenCount = schedules.length - visibleSchedules.length;

  return (
    <div className="flex w-full justify-center">
      <Tooltip
        placement="top"
        arrow
        interactive
        theme="custom-light"
        maxWidth={420}
        content={
          <div className="w-[320px] max-w-[calc(100vw-48px)] text-left">
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-1 pb-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <Icon
                    icon="heroicons-outline:archive-box"
                    width="17"
                    height="17"
                    className="shrink-0 text-sky-600"
                  />
                  <span>Latest slot ini</span>
                </div>
                <div className="mt-0.5 text-[11px] text-slate-500">
                  Order selesai di pelatih dan jam yang sama.
                </div>
              </div>
              <span className="shrink-0 rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-700 ring-1 ring-sky-200">
                {schedules.length}
              </span>
            </div>
            <div className="mt-2 max-h-[260px] space-y-2 overflow-y-auto pr-1">
              {visibleSchedules.map((schedule, index) => {
                const students = getStudentNames(schedule);
                const orderDate = getCompletedScheduleOrderDate(schedule);
                const lastTrainingDate =
                  getCompletedScheduleLastTrainingDate(schedule);

                return (
                  <div
                    key={`${getCompletedOrderKey(schedule)}-${index}`}
                    className="rounded-lg border border-slate-200 bg-slate-50/80 p-2.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="inline-flex min-w-[38px] justify-center rounded-md bg-primary-500 px-2 py-1 text-xs font-semibold text-white">
                        {getCompletedScheduleProductLabel(schedule)}
                      </span>
                      {lastTrainingDate ? (
                        <span className="whitespace-nowrap rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-slate-500 ring-1 ring-slate-200">
                          {formatCompletedScheduleDate(lastTrainingDate)}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-2 text-xs font-medium leading-snug text-slate-700">
                      {students.length
                        ? students.map((name) => toProperCase(name)).join(", ")
                        : "Siswa tidak tersedia"}
                    </div>
                    <div className="mt-2 grid gap-1 border-t border-slate-200 pt-2 text-[11px] text-slate-500">
                      <div className="flex items-center justify-between gap-2">
                        <span>Order</span>
                        <span className="font-semibold text-slate-700">
                          {orderDate
                            ? formatCompletedScheduleDate(orderDate)
                            : "-"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span>Latihan terakhir</span>
                        <span className="font-semibold text-slate-700">
                          {lastTrainingDate
                            ? formatCompletedScheduleDate(lastTrainingDate)
                            : "-"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {hiddenCount > 0 ? (
              <div className="mt-2 rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-500">
                +{hiddenCount} order lainnya
              </div>
            ) : null}
          </div>
        }
      >
        <div className="mx-auto flex w-[104px] max-w-full flex-col justify-center gap-1.5 overflow-hidden rounded-md border-2 border-sky-300 bg-sky-50 p-1.5 text-slate-700 shadow-md shadow-sky-200/60 transition hover:border-sky-400 hover:bg-white">
          <Badge
            label={`Riwayat`}
            className="justify-center rounded-full border border-sky-200 bg-white px-1.5 py-0.5 text-[9px] font-semibold text-sky-700 shadow-sm"
          />
          <Badge
            label={getCompletedScheduleProductLabel(visibleSchedules[0])}
            className="justify-center bg-primary-500 px-1.5 py-0.5 text-[9px] text-white"
          />
          <div className="space-y-0.5 text-[9px] font-medium leading-tight text-slate-600">
            {getStudentNames(visibleSchedules[0]).length ? (
              getStudentNames(visibleSchedules[0])
                .slice(0, 2)
                .map((name, index) => (
                  <div key={`${name}-${index}`} className="break-words">
                    {toProperCase(name)}
                  </div>
                ))
            ) : (
              <div className="break-words">Siswa tidak tersedia</div>
            )}
          </div>
          <div className="flex items-center justify-between gap-1 text-[9px] text-slate-500">
            <span className="truncate">
              {formatCompletedScheduleDate(
                getCompletedScheduleLastTrainingDate(visibleSchedules[0]),
              ) || "-"}
            </span>
            <Icon
              icon="heroicons-outline:archive-box"
              width="13"
              height="13"
              className="shrink-0 text-sky-600"
            />
          </div>
        </div>
      </Tooltip>
    </div>
  );
});

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
