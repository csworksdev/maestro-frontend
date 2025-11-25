import React, { useEffect, useMemo, useState, useCallback } from "react";
import Chart from "react-apexcharts";
import Card from "@/components/ui/Card";
import GroupChart4 from "@/components/partials/widget/chart/group-chart-4";
import SelectMonth from "@/components/partials/SelectMonth";
import CalendarView from "@/components/partials/widget/CalendarView";
import {
  getDashboardDaily,
  getDashboardDailySchedules,
  getDashboardDailyChart,
} from "@/axios/dashboard_opr/daily";
import Table from "@/components/globals/table/table";
import PaginationComponent from "@/components/globals/table/pagination";
import useDarkMode from "@/hooks/useDarkMode";

const fallbackChartData = [
  {
    month_value: 1,
    month_label: "Januari",
    unattendance: 12,
    schedule: 2588,
    on_schedule: 146,
    reschedule: 2430,
    sum: 5176,
  },
  {
    month_value: 2,
    month_label: "Februari",
    unattendance: 7,
    schedule: 2270,
    on_schedule: 89,
    reschedule: 2174,
    sum: 4540,
  },
];

const DashboardDaily = () => {
  const [isDark] = useDarkMode();
  const fallbackDetails = useMemo(
    () => [
      {
        date: "2025-06-01",
        unattendance: 1,
        on_schedule: 31,
        schedule: 32,
        reschedule: 28,
        sum: 92,
      },
      {
        date: "2025-06-02",
        unattendance: 0,
        on_schedule: 96,
        schedule: 96,
        reschedule: 95,
        sum: 287,
      },
      {
        date: "2025-06-03",
        unattendance: 2,
        on_schedule: 132,
        schedule: 134,
        reschedule: 132,
        sum: 400,
      },
    ],
    []
  );

  const [calendarDetails, setCalendarDetails] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [branchData, setBranchData] = useState([]);
  const [branchMeta, setBranchMeta] = useState({
    current_page: 1,
    total_pages: 1,
    has_next: false,
    has_prev: false,
  });
  const [branchLoading, setBranchLoading] = useState(false);
  const [branchError, setBranchError] = useState(null);
  const [branchPage, setBranchPage] = useState(1);
  const [scheduleList, setScheduleList] = useState({ results: [], count: 0 });
  const [scheduleMeta, setScheduleMeta] = useState({ pageCount: 0 });
  const [schedulePageIndex, setSchedulePageIndex] = useState(0);
  const [schedulePageSize, setSchedulePageSize] = useState(10);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleError, setScheduleError] = useState(null);
  const [chartData, setChartData] = useState(fallbackChartData);
  const [chartLoading, setChartLoading] = useState(false);
  const [chartError, setChartError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getDashboardDaily();
        const payload = res?.data ?? res ?? {};
        const detail =
          payload?.detail ??
          payload?.data?.detail ??
          payload?.results ??
          payload?.data ??
          [];
        const parsed = Array.isArray(detail) ? detail : [];
        const safe = parsed.length ? parsed : fallbackDetails;
        if (!cancelled) {
          setCalendarDetails(safe);
          const firstDate = safe[0]?.date || null;
          setSelectedDate((prev) =>
            prev && safe.find((d) => d.date === prev) ? prev : firstDate
          );
        }
      } catch (err) {
        console.error("Error fetching daily dashboard:", err);
        if (!cancelled) {
          setError("Gagal memuat data");
          setCalendarDetails(fallbackDetails);
          setSelectedDate(fallbackDetails[0]?.date || null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [fallbackDetails]);

  const fetchBranchSummary = async (dateKey, page = 1, pageSize = 20) => {
    if (!dateKey) return;
    setBranchLoading(true);
    setBranchError(null);
    try {
      const res = await getDashboardDaily({
        filter_start_date: dateKey,
        filter_end_date: dateKey,
        filter_group_by: "BRANCH",
        page,
        page_size: pageSize,
      });
      const payload = res?.data ?? res ?? {};
      const list =
        payload?.data ??
        payload?.detail ??
        payload?.results ??
        payload?.items ??
        [];
      const meta = payload?.meta ??
        payload?.pagination ?? {
          current_page: page,
          total_pages: 1,
          has_next: false,
          has_prev: false,
          page_size: pageSize,
          count: list?.length ?? 0,
        };
      setBranchData(Array.isArray(list) ? list : []);
      setBranchMeta({
        current_page: meta.current_page ?? page,
        total_pages: meta.total_pages ?? 1,
        has_next: meta.has_next ?? false,
        has_prev: meta.has_prev ?? false,
        page_size: meta.page_size ?? pageSize,
        count: meta.count ?? 0,
      });
    } catch (err) {
      console.error("Error fetching branch summary:", err);
      setBranchError("Gagal memuat ringkasan cabang");
      setBranchData([]);
    } finally {
      setBranchLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedDate) return;
    fetchBranchSummary(selectedDate, branchPage);
  }, [selectedDate, branchPage]);

  const fetchSchedules = async (
    pageIndex = 0,
    pageSize = 10,
    dateKey = selectedDate
  ) => {
    if (!dateKey) return;
    setScheduleLoading(true);
    setScheduleError(null);
    try {
      const res = await getDashboardDailySchedules({
        page: pageIndex + 1,
        page_size: pageSize,
        filter_start_date: dateKey,
        filter_end_date: dateKey,
      });
      const payload = res?.data ?? res ?? {};
      const list =
        payload?.data ??
        payload?.results ??
        payload?.items ??
        payload?.detail ??
        [];
      const meta = payload?.meta ?? payload?.pagination ?? {};
      const count =
        meta?.count ??
        payload?.count ??
        (Array.isArray(list) ? list.length : 0);
      const totalPages =
        meta?.total_pages ??
        meta?.page_count ??
        (count && pageSize ? Math.ceil(count / pageSize) : 0);

      setScheduleList({
        results: Array.isArray(list) ? list : [],
        count: count ?? 0,
      });
      setScheduleMeta({
        pageCount: totalPages ?? 0,
      });
    } catch (err) {
      console.error("Error fetching schedules:", err);
      setScheduleError("Gagal memuat data tim");
      setScheduleList({ results: [], count: 0 });
      setScheduleMeta({ pageCount: 0 });
    } finally {
      setScheduleLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedDate) return;
    fetchSchedules(schedulePageIndex, schedulePageSize, selectedDate);
  }, [selectedDate, schedulePageIndex, schedulePageSize]);

  useEffect(() => {
    let cancelled = false;
    const loadChart = async () => {
      setChartLoading(true);
      setChartError(null);
      try {
        const res = await getDashboardDailyChart();
        const payload = res?.data ?? res ?? {};
        const list =
          payload?.chart ??
          payload?.data?.chart ??
          payload?.data ??
          payload?.results ??
          [];
        const parsed = Array.isArray(list) ? list : [];
        if (!cancelled) {
          setChartData(parsed.length ? parsed : fallbackChartData);
        }
      } catch (err) {
        console.error("Error fetching chart data:", err);
        if (!cancelled) {
          setChartError("Gagal memuat data chart");
          setChartData(fallbackChartData);
        }
      } finally {
        if (!cancelled) setChartLoading(false);
      }
    };
    loadChart();
    return () => {
      cancelled = true;
    };
  }, []);

  const detailByDate = useMemo(() => {
    const map = new Map();
    calendarDetails.forEach((item) => {
      if (!item?.date) return;
      map.set(item.date, item);
    });
    return map;
  }, [calendarDetails]);

  const selectedDetail = selectedDate
    ? detailByDate.get(selectedDate) || null
    : null;

  const statCards = useMemo(() => {
    const data = selectedDetail || {};
    return [
      {
        title: "Schedule",
        count: data.schedule ?? 0,
        bg: "bg-sky-500",
        text: "text-sky-500",
        icon: "heroicons-outline:calendar",
      },
      {
        title: "On-Schedule",
        count: data.on_schedule ?? 0,
        bg: "bg-emerald-500",
        text: "text-emerald-500",
        icon: "heroicons-outline:check-circle",
      },
      {
        title: "Re-Schedule",
        count: data.reschedule ?? 0,
        bg: "bg-indigo-500",
        text: "text-indigo-500",
        icon: "heroicons-outline:arrow-path",
      },
      {
        title: "Tidak hadir",
        count: data.unattendance ?? 0,
        bg: "bg-amber-500",
        text: "text-amber-500",
        icon: "heroicons-outline:exclamation-circle",
      },
    ];
  }, [selectedDetail]);

  const branchColumns = useMemo(
    () => [
      {
        Header: "Cabang",
        accessor: "branch_name",
        Cell: ({ value }) => value || "-",
      },

      {
        Header: "Schedule",
        accessor: "schedule",
        Cell: ({ value }) => (
          <div className="text-right text-sky-600">{value ?? 0}</div>
        ),
      },
      {
        Header: "On-Schedule",
        accessor: "on_schedule",
        Cell: ({ value }) => (
          <div className="text-right font-semibold text-emerald-600">
            {value ?? 0}
          </div>
        ),
      },
      {
        Header: "Re-Schedule",
        accessor: "reschedule",
        Cell: ({ value }) => (
          <div className="text-right text-orange-600">{value ?? 0}</div>
        ),
      },
      {
        Header: "Tidak hadir",
        accessor: "unattendance",
        Cell: ({ value }) => (
          <div className="text-right text-amber-600">{value ?? 0}</div>
        ),
      },
    ],
    []
  );

  const branchTableData = useMemo(
    () => ({
      results: branchData,
      count:
        branchMeta?.count ?? branchMeta?.page_count ?? branchData?.length ?? 0,
    }),
    [branchData, branchMeta]
  );

  const handleDateChange = async ({ date }) => {
    if (!date) return;
    setSelectedDate(date);
    setBranchPage(1);
    setSchedulePageIndex(0);
    setLoading(true);
    setError(null);
    try {
      const res = await getDashboardDaily({
        filter_start_date: date,
        filter_end_date: date,
      });
      const payload = res?.data ?? res ?? {};
      const detail =
        payload?.detail ??
        payload?.data?.detail ??
        payload?.results ??
        payload?.data ??
        [];
      const parsed = Array.isArray(detail) ? detail : [];
      const safe = parsed.length ? parsed : fallbackDetails;
      setCalendarDetails(safe);
      const firstDate = safe[0]?.date || date;
      setSelectedDate((prev) =>
        prev && safe.find((d) => d.date === prev) ? prev : firstDate
      );
      fetchBranchSummary(date, 1);
    } catch (err) {
      console.error("Error fetching daily dashboard:", err);
      setError("Gagal memuat data");
      setCalendarDetails(fallbackDetails);
      setSelectedDate(date);
    } finally {
      setLoading(false);
    }
  };
  const formatDateId = useCallback((value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date)) return value;
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }, []);

  const scheduleColumns = useMemo(
    () => [
      { Header: "Cabang", accessor: "branch_name" },
      { Header: "Pelatih", accessor: "trainer_fullname" },
      { Header: "Siswa", accessor: "student_fullname" },
      { Header: "Kolam", accessor: "pool_name" },
      { Header: "Hari", accessor: "day" },
      { Header: "Jam", accessor: "time" },
      {
        Header: "Tanggal Jadwal",
        accessor: "schedule_date",
        Cell: ({ value }) => formatDateId(value),
      },
      {
        Header: "Tanggal Real",
        accessor: "real_date",
        Cell: ({ value }) => formatDateId(value),
      },
      {
        Header: "Hadir?",
        accessor: "is_presence",
        Cell: ({ value }) => (value ? "Hadir" : "Tidak hadir"),
      },
    ],
    [formatDateId]
  );

  const schedulePageCount = useMemo(() => {
    if (typeof scheduleMeta?.pageCount === "number")
      return scheduleMeta.pageCount;
    if (!scheduleList?.count) return 0;
    return Math.ceil(scheduleList.count / schedulePageSize);
  }, [scheduleList?.count, scheduleMeta?.pageCount, schedulePageSize]);

  const chartCategories = useMemo(
    () =>
      (chartData || []).map(
        (item) => item?.month_label || `Bulan ${item?.month_value || ""}`
      ),
    [chartData]
  );

  const chartSeries = useMemo(
    () => [
      {
        name: "Schedule",
        data: (chartData || []).map((item) => item?.schedule ?? 0),
      },
      {
        name: "On-Schedule",
        data: (chartData || []).map((item) => item?.on_schedule ?? 0),
      },
      {
        name: "Re-Schedule",
        data: (chartData || []).map((item) => item?.reschedule ?? 0),
      },
      {
        name: "Tidak hadir",
        data: (chartData || []).map((item) => item?.unattendance ?? 0),
      },
    ],
    [chartData]
  );

  const chartOptions = useMemo(
    () => ({
      chart: {
        toolbar: { show: false },
        stacked: false,
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: "55%",
          borderRadius: 6,
        },
      },
      dataLabels: { enabled: false },
      stroke: {
        show: true,
        width: 2,
        colors: ["transparent"],
      },
      grid: {
        show: true,
        borderColor: isDark ? "#334155" : "#e2e8f0",
        strokeDashArray: 10,
      },
      colors: ["#0ea5e9", "#10b981", "#fb923c", "#f59e0b"],
      xaxis: {
        categories: chartCategories,
        labels: {
          style: {
            colors: (chartCategories || []).map(() =>
              isDark ? "#CBD5E1" : "#475569"
            ),
            fontFamily: "Inter",
          },
        },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        labels: {
          style: {
            colors: isDark ? "#CBD5E1" : "#475569",
            fontFamily: "Inter",
          },
        },
      },
      tooltip: { theme: isDark ? "dark" : "light" },
      legend: {
        labels: {
          colors: isDark ? "#CBD5E1" : "#475569",
        },
      },
    }),
    [chartCategories, isDark]
  );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-12 gap-5">
        <div className="lg:col-span-8 col-span-12 space-y-5">
          <Card
            title="Ringkasan Harian"
            headerslot={
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">
                  {loading ? "Memuat..." : "Tanggal dipilih"}
                </span>
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100">
                  {selectedDate || "—"}
                </span>
              </div>
            }
          >
            <div className="grid grid-cols-12 gap-5">
              <div className="col-span-12">
                <div className="grid md:grid-cols-4 sm:grid-cols-2 grid-cols-1 gap-3">
                  <GroupChart4 stats={statCards} />
                </div>
                <div className="mt-5">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      Ringkasan per Cabang
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      {branchLoading ? <span>Memuat...</span> : null}
                      {branchError ? (
                        <span className="text-amber-600 dark:text-amber-300">
                          {branchError}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  {branchLoading && branchData.length === 0 ? (
                    <div className="border border-slate-100 dark:border-slate-800 rounded-lg p-4 text-sm text-slate-500">
                      Memuat data...
                    </div>
                  ) : branchData.length === 0 ? (
                    <div className="border border-slate-100 dark:border-slate-800 rounded-lg p-4 text-sm text-slate-500">
                      Tidak ada data
                    </div>
                  ) : (
                    <Table
                      listData={branchTableData}
                      listColumn={branchColumns}
                      isAction={false}
                      isCheckbox={false}
                      isPagination={false}
                    />
                  )}
                  <div className="flex items-center justify-between mt-3 text-xs text-slate-600 dark:text-slate-300">
                    <span>
                      Halaman {branchMeta.current_page ?? branchPage} dari{" "}
                      {branchMeta.total_pages ?? 1}
                    </span>
                    <div className="flex gap-2">
                      <button
                        className="px-3 py-1 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-40"
                        onClick={() =>
                          branchMeta.has_prev &&
                          setBranchPage((p) => Math.max(1, p - 1))
                        }
                        disabled={!branchMeta.has_prev}
                      >
                        Sebelumnya
                      </button>
                      <button
                        className="px-3 py-1 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-40"
                        onClick={() =>
                          branchMeta.has_next && setBranchPage((p) => p + 1)
                        }
                        disabled={!branchMeta.has_next}
                      >
                        Selanjutnya
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
          <Card title="Distribusi Tahapan">
            {chartError ? (
              <div className="mb-3 text-sm text-amber-600 dark:text-amber-300">
                {chartError} — menampilkan data contoh
              </div>
            ) : null}
            <div className="relative">
              {chartLoading ? (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 dark:bg-slate-900/60 text-sm text-slate-600 dark:text-slate-200 rounded-lg">
                  Memuat chart...
                </div>
              ) : null}
              <Chart
                options={chartOptions}
                series={chartSeries}
                type="bar"
                height={310}
              />
            </div>
          </Card>
        </div>
        <div className="lg:col-span-4 col-span-12 space-y-5">
          <Card
            title="Kalender & Ringkasan"
            headerslot={
              <div className="flex flex-col gap-0.5 text-xs text-slate-500 dark:text-slate-300">
                <span>Pilih tanggal untuk memperbarui metrik</span>
                {error ? (
                  <span className="text-amber-600 dark:text-amber-300">
                    {error} — menampilkan data contoh
                  </span>
                ) : null}
              </div>
            }
          >
            <div className="space-y-5">
              <CalendarView
                details={calendarDetails}
                onDateChange={handleDateChange}
                selectedDate={selectedDate}
              />
              <div className="grid sm:grid-cols-3 grid-cols-2 gap-3">
                <div className="rounded-lg border border-slate-100 dark:border-slate-800 p-3 bg-white dark:bg-slate-900">
                  <p className="text-xs text-slate-500">Tanggal dipilih</p>
                  <p className="text-base font-semibold text-slate-900 dark:text-white mt-1">
                    {selectedDate || "—"}
                  </p>
                </div>
                {/* <div className="rounded-lg border border-slate-100 dark:border-slate-800 p-3 bg-white dark:bg-slate-900">
                  <p className="text-xs text-slate-500">Total</p>
                  <p className="text-xl font-semibold text-slate-900 dark:text-white mt-1">
                    {selectedDetail?.sum ?? 0}
                  </p>
                </div> */}
                <div className="rounded-lg border border-slate-100 dark:border-slate-800 p-3 bg-white dark:bg-slate-900">
                  <p className="text-xs text-slate-500">Rasio hadir</p>
                  <p className="text-xl font-semibold text-emerald-600 dark:text-emerald-300 mt-1">
                    {selectedDetail?.schedule
                      ? `${Math.round(
                          (((selectedDetail.on_schedule || 0) +
                            (selectedDetail.reschedule || 0)) /
                            selectedDetail.schedule) *
                            100
                        )}%`
                      : "0%"}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-100 dark:border-slate-800 p-3 bg-white dark:bg-slate-900">
                  <p className="text-xs text-slate-500">Schedule</p>
                  <p className="text-xl font-semibold text-sky-600 dark:text-sky-300 mt-1">
                    {selectedDetail?.schedule ?? 0}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-100 dark:border-slate-800 p-3 bg-white dark:bg-slate-900">
                  <p className="text-xs text-slate-500">On-Schedule</p>
                  <p className="text-xl font-semibold text-emerald-600 dark:text-emerald-300 mt-1">
                    {selectedDetail?.on_schedule ?? 0}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-100 dark:border-slate-800 p-3 bg-white dark:bg-slate-900">
                  <p className="text-xs text-slate-500">Re-Schedule</p>
                  <p className="text-xl font-semibold text-orange-600 dark:text-orange-300 mt-1">
                    {selectedDetail?.reschedule ?? 0}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-100 dark:border-slate-800 p-3 bg-white dark:bg-slate-900">
                  <p className="text-xs text-slate-500">Tidak hadir</p>
                  <p className="text-xl font-semibold text-amber-600 dark:text-amber-300 mt-1">
                    {selectedDetail?.unattendance ?? 0}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
      <Card title="Team members" noborder>
        {scheduleLoading && scheduleList.results.length === 0 ? (
          <div className="border border-slate-100 dark:border-slate-800 rounded-lg p-4 text-sm text-slate-500">
            Memuat data...
          </div>
        ) : scheduleError ? (
          <div className="border border-slate-100 dark:border-slate-800 rounded-lg p-4 text-sm text-amber-600 dark:text-amber-300">
            {scheduleError}
          </div>
        ) : scheduleList.results.length === 0 ? (
          <div className="border border-slate-100 dark:border-slate-800 rounded-lg p-4 text-sm text-slate-500">
            Tidak ada data
          </div>
        ) : (
          <>
            <Table
              listData={scheduleList}
              listColumn={scheduleColumns}
              isAction={false}
              isCheckbox={false}
              isPagination
            />
            <PaginationComponent
              pageSize={schedulePageSize}
              pageIndex={schedulePageIndex}
              pageCount={schedulePageCount}
              canPreviousPage={schedulePageIndex > 0}
              canNextPage={schedulePageIndex < schedulePageCount - 1}
              gotoPage={setSchedulePageIndex}
              previousPage={() =>
                setSchedulePageIndex((prev) => Math.max(0, prev - 1))
              }
              nextPage={() =>
                setSchedulePageIndex((prev) =>
                  schedulePageCount
                    ? Math.min(schedulePageCount - 1, prev + 1)
                    : prev + 1
                )
              }
              setPageSize={(size) => {
                setSchedulePageSize(size);
                setSchedulePageIndex(0);
              }}
            />
          </>
        )}
      </Card>
    </div>
  );
};

export default DashboardDaily;
