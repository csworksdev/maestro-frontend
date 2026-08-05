import { DateTime } from "luxon";
import { toProperCase } from "@/utils";

export const columnHeader = [
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

export const checkProduct = (product = "") => {
  switch (true) {
    case product.includes("14"):
      return "14";
    case product.includes("18"):
      return "18";
    case product.includes("24"):
      return "24";
    case product.includes("28"):
      return "28";
    case product.includes("ter"):
      return "Terapi";
    case product.includes("gr"):
      return "Grup";
    case product.includes("baby"):
      return "Baby";
    default:
      return "Trial";
  }
};

export const normalizeScheduleTime = (time) => {
  if (time === null || time === undefined) return "";

  const raw = String(time).trim();
  const match = raw.match(/(\d{1,2})[:.](\d{2})/);
  if (match) {
    return `${match[1].padStart(2, "0")}.${match[2]}`;
  }

  const hourOnly = raw.match(/\b(\d{1,2})\b/);
  return hourOnly ? `${hourOnly[1].padStart(2, "0")}.00` : raw;
};

export const normalizeLookupKey = (value) => {
  if (value === null || value === undefined) return "";
  return String(value).trim().toLowerCase();
};

export const getTrainerWorkStatus = (trainer) =>
  trainer?.contract_type_display ??
  trainer?.contractTypeDisplay ??
  trainer?.contract_type ??
  trainer?.contractType ??
  (trainer?.is_fulltime === true
    ? "Fulltime"
    : trainer?.is_fulltime === false
      ? "Freelance"
      : "");

export const getTrainerWorkStatusClassName = (status) => {
  const normalizedStatus = normalizeLookupKey(status);

  if (normalizedStatus.includes("full")) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (normalizedStatus.includes("free") || normalizedStatus.includes("part")) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-slate-200 bg-white/80 text-slate-600";
};

export const getScheduleTimeValue = (entry) =>
  entry?.jam ??
  entry?.time ??
  entry?.start_time ??
  entry?.startTime ??
  entry?.schedule_time ??
  entry?.scheduleTime ??
  entry?.order_time ??
  entry?.orderTime ??
  entry?.hour;

export const getTrainerKeys = (entry) => {
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

export const extractPayloadList = (response) => {
  const unwrapPayload = (value) => {
    if (!value || Array.isArray(value) || typeof value !== "object") {
      return value;
    }

    const payloadKeys = [
      "results",
      "payload",
      "message",
      "completed_schedules",
      "completedSchedules",
      "completed_schedule",
      "completedSchedule",
      "schedules",
      "orders",
      "data",
    ];

    const hasEntryShape =
      getTrainerKeys(value).length > 0 || getScheduleTimeValue(value);

    if (hasEntryShape) {
      return value;
    }

    const payloadKey = payloadKeys.find((key) => value[key] !== undefined);
    return payloadKey ? unwrapPayload(value[payloadKey]) : value;
  };

  const data = response?.data ?? response;
  const payload = unwrapPayload(data) ?? [];

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

export const getStudentNames = (order) => {
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

export const getCompletedOrderKey = (order) => {
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

export const hasCompletedOrderDetails = (order) =>
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

export const addCompletedOrderToIndex = (index, trainerKeys, timeKey, order) => {
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

export const buildCompletedScheduleIndex = (items = []) => {
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
      entry?.completed_schedule,
      entry?.completedSchedule,
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

export const getCompletedSchedulesForSlot = (index, trainer, time) => {
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

export const getCompletedScheduleProductLabel = (schedule) => {
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

export const formatCompletedScheduleDate = (dateValue) => {
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

export const getLastMeetDateFromSchedule = (schedule) => {
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

export const getCompletedScheduleOrderDate = (schedule) =>
  schedule?.order_date ??
  schedule?.orderDate ??
  schedule?.created_at ??
  schedule?.createdAt ??
  schedule?.order?.order_date ??
  schedule?.order?.orderDate ??
  "";

export const getCompletedScheduleLastTrainingDate = (schedule) =>
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
