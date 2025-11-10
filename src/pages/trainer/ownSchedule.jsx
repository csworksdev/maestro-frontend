import React, { useCallback, useEffect, useMemo, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Loading from "@/components/Loading";
import { getTrainerScheduleOwn } from "@/axios/masterdata/trainerSchedule";
import { useAuthStore } from "@/redux/slicers/authSlice";
import { Tab } from "@headlessui/react";
import Icon from "@/components/ui/Icon";

const DAY_ORDER = [
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
  "Minggu",
];

const STATUS_STYLES = {
  off: {
    key: "off",
    label: "Libur",
    pillClass:
      "bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-400/10 dark:text-rose-200 dark:border-rose-500/40",
    icon: "heroicons-outline:pause-circle",
    tone: "text-rose-600 dark:text-rose-300",
    helpText: "Slot tidak tersedia — waktu istirahat atau hari libur.",
  },
  booked: {
    key: "booked",
    label: "Ada Jadwal",
    pillClass:
      "bg-indigo-100 text-indigo-700 border border-indigo-200 dark:bg-indigo-400/10 dark:text-indigo-200 dark:border-indigo-500/40",
    icon: "heroicons-outline:calendar",
    tone: "text-indigo-600 dark:text-indigo-300",
    helpText: "Slot sedang digunakan — cek daftar siswa.",
  },
  available: {
    key: "available",
    label: "Tersedia",
    pillClass:
      "bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-400/10 dark:text-emerald-200 dark:border-emerald-500/40",
    icon: "heroicons-outline:sparkles",
    tone: "text-emerald-600 dark:text-emerald-300",
    helpText: "Slot ready — bisa dipakai untuk jadwal baru.",
  },
};

const SLOT_CARD_STYLES = {
  off: "border-rose-200/70 bg-rose-50/80 hover:border-rose-300 hover:bg-rose-50 dark:border-rose-500/40 dark:bg-rose-500/10 dark:hover:border-rose-400/60 dark:hover:bg-rose-500/20",
  booked:
    "border-indigo-200/70 bg-indigo-50/80 hover:border-indigo-300 hover:bg-indigo-50 dark:border-indigo-500/40 dark:bg-indigo-500/10 dark:hover:border-indigo-400/60 dark:hover:bg-indigo-500/20",
  available:
    "border-emerald-200/70 bg-emerald-50/80 hover:border-emerald-300 hover:bg-emerald-50 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:hover:border-emerald-400/60 dark:hover:bg-emerald-500/20",
};

const timeToMinutes = (time) => {
  if (!time) return 0;
  const sanitized = time.replace(/[^0-9:.]/g, "").replace(".", ":");
  const [hour = "0", minute = "0"] = sanitized.split(":");
  return parseInt(hour, 10) * 60 + parseInt(minute, 10);
};

const normalizeTime = (time) => {
  if (!time) return "-";
  return time.includes(".") || time.includes(":")
    ? time.replace(".", ":")
    : time;
};

const extractStudents = (slot) => {
  if (!slot) return [];
  const list = Array.isArray(slot.siswa) ? slot.siswa : slot.students;
  if (!Array.isArray(list)) return [];
  return list
    .map((student) => {
      if (!student) return null;
      if (typeof student === "string") return student;
      if (typeof student === "object") {
        return (
          student.name ||
          student.fullname ||
          student.full_name ||
          student.student_name ||
          student.nickname ||
          null
        );
      }
      return String(student);
    })
    .filter(Boolean);
};

const getRemainingMeetCount = (slot) => {
  if (!slot) return null;
  const value =
    slot.remaining_meet_count ??
    slot.remainingMeetCount ??
    slot.remainingMeet ??
    null;
  if (value === null || value === undefined) return null;
  const numeric = Number(value);
  return Number.isNaN(numeric) ? value : numeric;
};

const getOrderFrequencies = (slot) => {
  if (!slot) return null;

  const directFrequency =
    slot.frequency_per_week ??
    slot.frequencyPerWeek ??
    slot.frequency ??
    slot.order?.frequency_per_week ??
    slot.order?.frequencyPerWeek ??
    slot.orderFrequency ??
    null;

  const structuredFrequency =
    slot.order_frequencies ??
    slot.orderFrequencies ??
    slot.order_frequency ??
    null;

  const normalizeFrequencyValue = (value) => {
    if (value === undefined || value === null) return null;
    const numeric = Number(value);
    return Number.isNaN(numeric) ? value : numeric;
  };

  if (Array.isArray(structuredFrequency)) {
    const normalizedEntries = structuredFrequency
      .map((entry) => {
        if (!entry || typeof entry !== "object") return null;
        const freqValue =
          normalizeFrequencyValue(entry.frequency_per_week) ??
          normalizeFrequencyValue(entry.frequencyPerWeek) ??
          normalizeFrequencyValue(entry.per_week) ??
          normalizeFrequencyValue(entry.perWeek) ??
          normalizeFrequencyValue(entry.value);
        if (freqValue === null) return null;
        return {
          ...entry,
          frequency_per_week: freqValue,
        };
      })
      .filter(Boolean);

    if (normalizedEntries.length === 0) {
      return directFrequency !== null && directFrequency !== undefined
        ? { frequency_per_week: normalizeFrequencyValue(directFrequency) }
        : null;
    }

    const totalFrequency = normalizedEntries.reduce((acc, entry) => {
      const freq = Number(entry.frequency_per_week);
      return Number.isNaN(freq) ? acc : acc + freq;
    }, 0);

    return {
      frequency_per_week:
        totalFrequency > 0
          ? totalFrequency
          : normalizedEntries[0].frequency_per_week,
      entries: normalizedEntries,
    };
  }

  if (structuredFrequency && typeof structuredFrequency === "object") {
    const frequencyValue =
      normalizeFrequencyValue(structuredFrequency.frequency_per_week) ??
      normalizeFrequencyValue(structuredFrequency.frequencyPerWeek) ??
      normalizeFrequencyValue(structuredFrequency.per_week) ??
      normalizeFrequencyValue(structuredFrequency.perWeek) ??
      normalizeFrequencyValue(structuredFrequency.value);

    return frequencyValue !== null && frequencyValue !== undefined
      ? {
          ...structuredFrequency,
          frequency_per_week: frequencyValue,
        }
      : structuredFrequency;
  }

  if (directFrequency === null || directFrequency === undefined) {
    return null;
  }

  return {
    frequency_per_week: normalizeFrequencyValue(directFrequency),
  };
};

const buildSlotMeta = (slot) => {
  const students = extractStudents(slot);
  const remainingMeetCount = getRemainingMeetCount(slot);
  const orderFrequencies = getOrderFrequencies(slot);
  if (!slot?.is_avail) {
    return {
      ...STATUS_STYLES.off,
      description: "Waktu istirahat",
      students,
      remainingMeetCount,
      order_frequencies: orderFrequencies,
    };
  }
  if (students.length > 0) {
    return {
      ...STATUS_STYLES.booked,
      description: `${students.length} siswa terdaftar`,
      students,
      remainingMeetCount,
      order_frequencies: orderFrequencies,
    };
  }
  return {
    ...STATUS_STYLES.available,
    description: "Belum ada jadwal",
    students,
    remainingMeetCount,
    order_frequencies: orderFrequencies,
  };
};

const SummaryItem = ({ label, value, toneClass }) => (
  <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm transition focus-within:ring-2 focus-within:ring-primary-500 dark:border-slate-700/80 dark:bg-slate-800">
    <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
      {label}
    </p>
    <p className={`mt-2 text-2xl font-semibold ${toneClass}`}>{value}</p>
  </div>
);

const OwnSchedule = () => {
  const { user_id: userId, username } = useAuthStore((state) => state.data);
  const [scheduleData, setScheduleData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const fetchSchedule = useCallback(
    async ({ silent = false } = {}) => {
      if (!userId) return;
      try {
        silent ? setIsRefreshing(true) : setIsLoading(true);
        setErrorMessage("");
        const response = await getTrainerScheduleOwn(userId);
        const payload =
          response?.data?.results ??
          response?.data?.data ??
          response?.data ??
          [];
        setScheduleData(Array.isArray(payload) ? payload : []);
      } catch (error) {
        console.error("Failed to fetch trainer schedule", error);
        setErrorMessage("Gagal memuat jadwal. Silakan coba lagi.");
      } finally {
        silent ? setIsRefreshing(false) : setIsLoading(false);
      }
    },
    [userId]
  );

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }
    fetchSchedule();
  }, [userId, fetchSchedule]);

  const scheduleByDay = useMemo(() => {
    if (!Array.isArray(scheduleData)) return [];
    const grouped = scheduleData.reduce((acc, slot) => {
      if (!slot?.day) return acc;
      const day = slot.day;
      if (!acc[day]) acc[day] = [];
      acc[day].push(slot);
      return acc;
    }, {});

    return DAY_ORDER.filter((day) => grouped[day]?.length).map((day) => {
      const sortedSlots = grouped[day].sort(
        (a, b) => timeToMinutes(a?.time) - timeToMinutes(b?.time)
      );
      const activeCount = sortedSlots.reduce(
        (acc, slot) => (slot?.is_avail ? acc + 1 : acc),
        0
      );
      const dayCounts = sortedSlots.reduce(
        (acc, slot) => {
          if (!slot?.is_avail) acc.off += 1;
          else if (extractStudents(slot).length > 0) acc.booked += 1;
          else acc.available += 1;
          return acc;
        },
        { available: 0, booked: 0, off: 0 }
      );
      return { day, slots: sortedSlots, activeCount, dayCounts };
    });
  }, [scheduleData]);

  const summary = useMemo(() => {
    if (!Array.isArray(scheduleData) || scheduleData.length === 0) {
      return { total: 0, available: 0, booked: 0, off: 0 };
    }
    return scheduleData.reduce(
      (acc, slot) => {
        acc.total += 1;
        if (!slot?.is_avail) acc.off += 1;
        else if (extractStudents(slot).length > 0) acc.booked += 1;
        else acc.available += 1;
        return acc;
      },
      { total: 0, available: 0, booked: 0, off: 0 }
    );
  }, [scheduleData]);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            Jadwal Saya
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {username
              ? `Lihat ketersediaan jadwal Coach ${username} sepanjang minggu.`
              : "Lihat ketersediaan jadwal sepanjang minggu."}
          </p>
        </div>
        <Button
          text="Refresh"
          icon="heroicons-outline:arrow-path"
          onClick={() => fetchSchedule({ silent: true })}
          isLoading={isRefreshing}
          className="btn btn-sm bg-primary-500 text-white hover:bg-primary-600 focus:ring-2 focus:ring-primary-400"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryItem
          label="Total Slot"
          value={summary.total}
          toneClass="text-slate-900 dark:text-slate-100"
        />
        <SummaryItem
          label="Libur"
          value={summary.off}
          toneClass="text-rose-600 dark:text-rose-300"
        />
        <SummaryItem
          label="Tersedia"
          value={summary.available}
          toneClass="text-emerald-600 dark:text-emerald-300"
        />
        <SummaryItem
          label="Ada Jadwal"
          value={summary.booked}
          toneClass="text-indigo-600 dark:text-indigo-300"
        />
      </div>

      {errorMessage && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600 dark:border-rose-500/40 dark:bg-rose-400/10 dark:text-rose-200">
          {errorMessage}
        </div>
      )}

      <Card
        className="border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800"
        bodyClass="p-5"
      >
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
          Legend Status
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {Object.values(STATUS_STYLES).map((status) => (
            <div
              key={status.key}
              className="flex items-center gap-3 rounded-xl border border-slate-100/70 bg-slate-50/40 p-3 dark:border-slate-700/40 dark:bg-slate-800/60"
            >
              <span
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${status.pillClass}`}
              >
                <Icon icon={status.icon} className="text-base" />
                {status.label}
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {status.helpText}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {scheduleByDay.length === 0 && !errorMessage && (
        <Card bodyClass="p-10 text-center">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Jadwal belum tersedia
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Belum ada slot yang terdaftar. Coba atur jadwal di halaman master
            data atau tekan tombol refresh.
          </p>
        </Card>
      )}

      {scheduleByDay.length > 0 && (
        <Tab.Group>
          <Tab.List className="flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm no-scrollbar dark:border-slate-700 dark:bg-slate-800">
            {scheduleByDay.map(({ day, slots, activeCount, dayCounts }) => (
              <Tab
                key={day}
                className={({ selected }) =>
                  `flex min-w-[136px] flex-col rounded-xl border px-4 py-3 text-left text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900 ${
                    selected
                      ? "border-primary-300 bg-primary-50 text-primary-600 dark:border-primary-500/60 dark:bg-primary-500/10 dark:text-primary-200"
                      : "border-transparent bg-transparent text-slate-500 hover:border-slate-200 hover:bg-slate-50 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-800/60"
                  }`
                }
              >
                <span>{day}</span>
                <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
                  <Icon icon="heroicons-outline:clock" className="text-xs" />
                  <span>{activeCount} slot aktif</span>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-1 text-[10px] text-slate-400 dark:text-slate-500">
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-emerald-400/80" />
                    {dayCounts.available}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-indigo-400/80" />
                    {dayCounts.booked}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-rose-400/80" />
                    {dayCounts.off}
                  </span>
                </div>
              </Tab>
            ))}
          </Tab.List>
          <Tab.Panels className="mt-4">
            {scheduleByDay.map(({ day, slots, dayCounts }) => (
              <Tab.Panel key={day} className="focus:outline-none">
                <Card
                  title={day}
                  headerslot={
                    <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 font-medium text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-200">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        {dayCounts.available} tersedia
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 px-2 py-1 font-medium text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-200">
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                        {dayCounts.booked} jadwal
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-1 font-medium text-rose-600 dark:bg-rose-500/20 dark:text-rose-200">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                        {dayCounts.off} libur
                      </span>
                    </div>
                  }
                  bodyClass="p-5"
                  className="border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800"
                >
                  <div className="space-y-4">
                    {slots.map((slot, index) => {
                      const id =
                        slot?.trainer_schedule_id ??
                        `${day}-${slot?.time}-${index}`;
                      const meta = buildSlotMeta(slot);
                      const slotStyle =
                        SLOT_CARD_STYLES[meta.key] ??
                        "border-slate-200/80 bg-slate-50/70";
                      return (
                        <div
                          key={id}
                          className={`flex flex-col gap-3 rounded-xl border p-4 shadow-sm transition md:flex-row md:items-center md:justify-between ${slotStyle}`}
                        >
                          <div className="min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-3">
                              <span className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                                {normalizeTime(slot?.time)}
                              </span>
                              <span
                                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${meta.pillClass}`}
                              >
                                {meta.label}
                              </span>
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              {meta.description}
                            </p>
                            {meta.students?.length > 0 &&
                              meta.remainingMeetCount !== null &&
                              meta.remainingMeetCount !== undefined && (
                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                  Sisa pertemuan:{" "}
                                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                                    {meta.remainingMeetCount}
                                  </span>
                                </p>
                              )}
                            {meta.order_frequencies?.frequency_per_week > 0 && (
                              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                <span className="font-semibold text-slate-700 dark:text-slate-200">
                                  {meta.order_frequencies?.frequency_per_week}x
                                  per minggu
                                </span>
                              </p>
                            )}
                            {slot?.pool && (
                              <p className="text-xs font-medium uppercase tracking-wide text-primary-600 dark:text-primary-300">
                                Kolam: {slot.pool}
                              </p>
                            )}
                          </div>
                          {meta.students?.length > 0 && (
                            <div className="flex flex-wrap gap-2 md:justify-end">
                              {meta.students.map(
                                (studentName, studentIndex) => (
                                  <span
                                    key={`${id}-student-${studentIndex}`}
                                    className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-200"
                                  >
                                    {studentName}
                                  </span>
                                )
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </Tab.Panel>
            ))}
          </Tab.Panels>
        </Tab.Group>
      )}
    </div>
  );
};

export default OwnSchedule;
