import React, { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import {
  SOCKET_READY_STATE,
  useOperationalDashboardSocket,
} from "@/hooks/useOperationalDashboardSocket";

const formatPercent = (value, fallback = "-") => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return `${numeric.toFixed(1)}%`;
};

const formatNumber = (value) =>
  new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(
    Number(value || 0)
  );

const ConnectionIndicator = ({ readyState }) => {
  const color =
    readyState === SOCKET_READY_STATE.OPEN
      ? "bg-emerald-500"
      : readyState === SOCKET_READY_STATE.CONNECTING
      ? "bg-amber-500"
      : "bg-rose-500";
  const label =
    readyState === SOCKET_READY_STATE.OPEN
      ? "Online"
      : readyState === SOCKET_READY_STATE.CONNECTING
      ? "Menghubungkan..."
      : "Terputus";
  return (
    <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-300">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      {label}
    </span>
  );
};

const HeaderActions = ({ readyState, onRefresh }) => (
  <div className="flex items-center gap-3">
    <ConnectionIndicator readyState={readyState} />
    <Button
      onClick={onRefresh}
      icon="heroicons-outline:arrow-path"
      text="Refresh"
      className="btn-sm bg-slate-900 text-white hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600"
    />
  </div>
);

const SectionHeader = ({ title, subtitle }) => (
  <div className="mb-3 space-y-1">
    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
      {title}
    </h3>
    {subtitle ? (
      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {subtitle}
      </p>
    ) : null}
  </div>
);

const buildGaugeData = (value) => [
  { name: "Terisi", value: Math.min(Math.max(value, 0), 100), fill: "#2563eb" },
  {
    name: "Kosong",
    value: Math.max(0, 100 - value),
    fill: "rgba(148, 163, 184, 0.35)",
  },
];

const prepareHorizontalBarData = (items = []) =>
  [...items]
    .filter((item) => item?.trainer_name)
    .sort((a, b) => (b.sessions_per_week || 0) - (a.sessions_per_week || 0))
    .slice(0, 8)
    .map((item) => ({
      ...item,
      label: item.trainer_name,
      sessions: item.sessions_per_week || 0,
      satisfaction: Number(item.satisfaction_rating || 0),
      retention_rate: Number(item.retention_rate || 0),
    }));

const useHeatmapMatrix = (heatmap = []) => {
  return useMemo(() => {
    if (!Array.isArray(heatmap) || !heatmap.length) {
      return {
        hours: [],
        pools: [],
        maxSessions: 0,
      };
    }

    const hourSet = new Set();
    const poolMap = new Map();
    let maxSessions = 0;

    heatmap.forEach((entry) => {
      const hour = entry.hour;
      const poolId = entry.pool_id;
      if (!hour || !poolId) {
        return;
      }

      hourSet.add(hour);
      const poolKey = `${poolId}::${entry.pool_name || "Unknown"}`;
      if (!poolMap.has(poolKey)) {
        poolMap.set(poolKey, new Map());
      }

      const currentValue = Number(entry.sessions || 0);
      poolMap.get(poolKey).set(hour, currentValue);
      maxSessions = Math.max(maxSessions, currentValue);
    });

    const hours = Array.from(hourSet).sort((a, b) => {
      const [aHour] = a.split(":").map(Number);
      const [bHour] = b.split(":").map(Number);
      return aHour - bHour;
    });

    const pools = Array.from(poolMap.entries()).map(([key, hourMap]) => {
      const [poolId, poolName] = key.split("::");
      return { poolId, poolName, hourMap };
    });

    return {
      hours,
      pools,
      maxSessions,
    };
  }, [heatmap]);
};

const HeatmapCell = ({ value, maxValue }) => {
  if (!value || !maxValue) {
    return (
      <div className="h-8 w-full rounded border border-dashed border-slate-200 dark:border-slate-700" />
    );
  }
  const intensity = Math.min(1, value / maxValue);
  const background = `rgba(37, 99, 235, ${0.2 + intensity * 0.6})`;
  const textColor = intensity > 0.5 ? "text-white" : "text-slate-900";
  return (
    <div
      className={`flex h-8 w-full items-center justify-center rounded text-xs font-medium ${textColor}`}
      style={{ backgroundColor: background }}
    >
      {value}
    </div>
  );
};

const DashboardOperational = () => {
  const occupancySocket = useOperationalDashboardSocket(
    "/ws/operational/class-occupancy/"
  );
  const performanceSocket = useOperationalDashboardSocket(
    "/ws/operational/trainer-performance/"
  );
  const attendanceSocket = useOperationalDashboardSocket(
    "/ws/operational/trainer-attendance/"
  );
  const poolSocket = useOperationalDashboardSocket(
    "/ws/operational/pool-utilization/"
  );

  const occupancy = occupancySocket.data || {};
  const trainersPerformance = performanceSocket.data || {
    sessions_range: {},
    satisfaction_range: {},
    trainers: [],
  };
  const attendance = attendanceSocket.data || { range: {}, trainers: [] };
  const poolUtilization = poolSocket.data || {
    range: {},
    heatmap: [],
    top_pools: [],
    peak_hours: [],
  };

  const occupancyGauge = buildGaugeData(Number(occupancy.occupancy_rate || 0));
  const performanceChartData = useMemo(
    () => prepareHorizontalBarData(trainersPerformance.trainers),
    [trainersPerformance.trainers]
  );
  const topSatisfaction = useMemo(
    () =>
      [...(trainersPerformance.trainers || [])]
        .filter((item) => item?.trainer_name)
        .sort(
          (a, b) =>
            Number(b.satisfaction_rating || 0) -
            Number(a.satisfaction_rating || 0)
        )
        .slice(0, 5),
    [trainersPerformance.trainers]
  );
  const heatmapMatrix = useHeatmapMatrix(poolUtilization.heatmap);

  const attendanceLeaders = useMemo(
    () =>
      [...(attendance.trainers || [])]
        .sort(
          (a, b) =>
            Number(b.attendance_rate || 0) - Number(a.attendance_rate || 0)
        )
        .slice(0, 8),
    [attendance.trainers]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
            Dashboard Operasional
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-300">
            Insight realtime untuk okupansi kelas, performa pelatih, dan
            utilisasi kolam.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-12 xl:col-span-4">
          <Card
            title="Rasio Kelas Terisi"
            headerslot={
              <HeaderActions
                readyState={occupancySocket.readyState}
                onRefresh={occupancySocket.refresh}
              />
            }
          >
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <div className="lg:col-span-1">
                <div className="relative mx-auto flex h-60 w-full max-w-xs items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart
                      cx="50%"
                      cy="50%"
                      innerRadius="60%"
                      outerRadius="100%"
                      startAngle={225}
                      endAngle={-45}
                      data={occupancyGauge}
                    >
                      <RadialBar
                        minAngle={15}
                        dataKey="value"
                        clockWise
                        cornerRadius={14}
                      />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xs uppercase text-slate-500 dark:text-slate-300">
                      Terisi
                    </span>
                    <span className="text-3xl font-semibold text-slate-900 dark:text-white">
                      {formatPercent(occupancy.occupancy_rate, "0.0%")}
                    </span>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-1 space-y-4">
                <SectionHeader
                  title="Periode Saat Ini"
                  subtitle={
                    occupancy?.range
                      ? `${occupancy.range.start} s/d ${occupancy.range.end}`
                      : "Minggu berjalan"
                  }
                />
                <div className="space-y-3 rounded-lg border border-slate-100 p-4 dark:border-slate-700">
                  <div>
                    <p className="text-xs uppercase text-slate-500 dark:text-slate-400">
                      Total Sesi
                    </p>
                    <p className="text-lg font-semibold text-slate-900 dark:text-white">
                      {formatNumber(occupancy.total_slots)}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-xs uppercase text-slate-500 dark:text-slate-400">
                        Terisi
                      </p>
                      <p className="font-medium text-emerald-500">
                        {formatNumber(occupancy.filled_slots)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-slate-500 dark:text-slate-400">
                        Kosong
                      </p>
                      <p className="font-medium text-rose-500">
                        {formatNumber(occupancy.empty_slots)}
                      </p>
                    </div>
                  </div>
                </div>
                {occupancySocket.isLoading ? (
                  <p className="text-xs text-slate-400">Memuat data...</p>
                ) : null}
                {occupancySocket.error ? (
                  <p className="text-xs text-rose-500">
                    {occupancySocket.error}
                  </p>
                ) : null}
              </div>
            </div>
          </Card>
        </div>

        <div className="col-span-12 xl:col-span-8">
          <Card
            title="Performa Pelatih"
            headerslot={
              <HeaderActions
                readyState={performanceSocket.readyState}
                onRefresh={performanceSocket.refresh}
              />
            }
          >
            <div className="grid gap-6 lg:grid-cols-5">
              <div className="lg:col-span-3 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={performanceChartData}
                    layout="vertical"
                    margin={{ left: 80, right: 16, top: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      type="number"
                      tickFormatter={(value) => formatNumber(value)}
                    />
                    <YAxis
                      type="category"
                      dataKey="label"
                      width={120}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip
                      formatter={(value, name) => {
                        if (name === "sessions") {
                          return [
                            `${formatNumber(value)} sesi / minggu`,
                            "Sesi",
                          ];
                        }
                        if (name === "satisfaction") {
                          return [`${value.toFixed(2)}/5`, "Rating"];
                        }
                        return [value, name];
                      }}
                    />
                    <Bar
                      dataKey="sessions"
                      name="Sesi / Minggu"
                      fill="#2563eb"
                      radius={[4, 4, 4, 4]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="lg:col-span-2 space-y-4">
                <SectionHeader
                  title="Top Rating Pelatih"
                  subtitle={
                    trainersPerformance?.satisfaction_range
                      ? `${trainersPerformance.satisfaction_range.start} s/d ${trainersPerformance.satisfaction_range.end}`
                      : "90 hari terakhir"
                  }
                />
                <div className="space-y-3">
                  {topSatisfaction.length ? (
                    topSatisfaction.map((item, index) => (
                      <div
                        key={`${item.trainer_id}-${index}`}
                        className="flex items-start justify-between rounded-lg border border-slate-100 p-3 dark:border-slate-700"
                      >
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">
                            {item.trainer_name}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {formatPercent(item.retention_rate)} retention |
                            {` ${formatNumber(item.sessions_per_week || 0)} sesi`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-primary-500">
                            {(Number(item.satisfaction_rating) || 0).toFixed(2)}
                          </p>
                          <p className="text-[10px] uppercase text-slate-400">
                            Rating
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400">
                      Data rating belum tersedia.
                    </p>
                  )}
                </div>
                {performanceSocket.isLoading ? (
                  <p className="text-xs text-slate-400">Memuat data...</p>
                ) : null}
                {performanceSocket.error ? (
                  <p className="text-xs text-rose-500">
                    {performanceSocket.error}
                  </p>
                ) : null}
              </div>
            </div>
          </Card>
        </div>

        <div className="col-span-12 xl:col-span-5">
          <Card
            title="Absensi & Ketepatan Waktu"
            headerslot={
              <HeaderActions
                readyState={attendanceSocket.readyState}
                onRefresh={attendanceSocket.refresh}
              />
            }
          >
            <SectionHeader
              title="Periode Pemantauan"
              subtitle={
                attendance?.range
                  ? `${attendance.range.start} s/d ${attendance.range.end}`
                  : "30 hari terakhir"
              }
            />
            <div className="overflow-hidden rounded-lg border border-slate-100 dark:border-slate-700">
              <table className="min-w-full divide-y divide-slate-100 text-left text-sm dark:divide-slate-700">
                <thead className="bg-slate-50 dark:bg-slate-800">
                  <tr>
                    <th className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-300">
                      Pelatih
                    </th>
                    <th className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-300">
                      Hadir
                    </th>
                    <th className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-300">
                      Kehadiran
                    </th>
                    <th className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-300">
                      Tepat Waktu
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {attendanceLeaders.length ? (
                    attendanceLeaders.map((item) => (
                      <tr key={item.trainer_id}>
                        <td className="px-3 py-2 text-slate-900 dark:text-slate-200">
                          <div className="font-medium">
                            {item.trainer_name || "Tanpa Nama"}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {formatNumber(item.scheduled_sessions)} sesi dijadwalkan
                          </div>
                        </td>
                        <td className="px-3 py-2 text-slate-900 dark:text-slate-200">
                          {formatNumber(item.attended_sessions)}
                        </td>
                        <td className="px-3 py-2">
                          <span className="text-sm font-semibold text-emerald-500">
                            {formatPercent(item.attendance_rate)}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <span className="text-sm font-semibold text-primary-500">
                            {formatPercent(item.punctuality_rate)}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        className="px-3 py-4 text-center text-xs text-slate-400"
                        colSpan={4}
                      >
                        Data absensi belum tersedia.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {attendanceSocket.isLoading ? (
              <p className="mt-3 text-xs text-slate-400">Memuat data...</p>
            ) : null}
            {attendanceSocket.error ? (
              <p className="mt-3 text-xs text-rose-500">
                {attendanceSocket.error}
              </p>
            ) : null}
          </Card>
        </div>

        <div className="col-span-12 xl:col-span-7">
          <Card
            title="Utilisasi Kolam & Jam Sibuk"
            headerslot={
              <HeaderActions
                readyState={poolSocket.readyState}
                onRefresh={poolSocket.refresh}
              />
            }
          >
            <SectionHeader
              title="30 Hari Terakhir"
              subtitle={
                poolUtilization?.range
                  ? `${poolUtilization.range.start} s/d ${poolUtilization.range.end}`
                  : null
              }
            />
            {heatmapMatrix.hours.length && heatmapMatrix.pools.length ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100 text-sm dark:divide-slate-700">
                  <thead>
                    <tr>
                      <th className="sticky left-0 bg-white px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:bg-slate-900 dark:text-slate-300">
                        Kolam
                      </th>
                      {heatmapMatrix.hours.map((hour) => (
                        <th
                          key={hour}
                          className="px-2 py-2 text-center text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-300"
                        >
                          {hour}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {heatmapMatrix.pools.map((pool) => (
                      <tr key={pool.poolId}>
                        <td className="sticky left-0 bg-white px-3 py-2 text-sm font-semibold text-slate-900 dark:bg-slate-900 dark:text-slate-100">
                          {pool.poolName || "Tanpa Nama"}
                        </td>
                        {heatmapMatrix.hours.map((hour) => (
                          <td key={`${pool.poolId}-${hour}`} className="px-2 py-2">
                            <HeatmapCell
                              value={pool.hourMap.get(hour)}
                              maxValue={heatmapMatrix.maxSessions}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-400">
                Data utilisasi belum tersedia.
              </p>
            )}
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <div className="rounded-lg border border-slate-100 p-4 dark:border-slate-700">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Kolam Terlaris
                </h4>
                <ul className="mt-3 space-y-2">
                  {(poolUtilization.top_pools || []).length ? (
                    poolUtilization.top_pools.map((pool) => (
                      <li
                        key={pool.pool_id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-slate-700 dark:text-slate-200">
                          {pool.pool_name || "Tanpa Nama"}
                        </span>
                        <span className="font-medium text-slate-900 dark:text-white">
                          {formatNumber(pool.sessions)} sesi
                        </span>
                      </li>
                    ))
                  ) : (
                    <li className="text-xs text-slate-400">
                      Belum ada data kolam.
                    </li>
                  )}
                </ul>
              </div>
              <div className="rounded-lg border border-slate-100 p-4 dark:border-slate-700">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Jam Tersibuk
                </h4>
                <ul className="mt-3 space-y-2">
                  {(poolUtilization.peak_hours || []).length ? (
                    poolUtilization.peak_hours.map((hour) => (
                      <li
                        key={hour.hour}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-slate-700 dark:text-slate-200">
                          {hour.hour}
                        </span>
                        <span className="font-medium text-slate-900 dark:text-white">
                          {formatNumber(hour.sessions)} sesi
                        </span>
                      </li>
                    ))
                  ) : (
                    <li className="text-xs text-slate-400">
                      Belum ada data jam sibuk.
                    </li>
                  )}
                </ul>
              </div>
            </div>
            {poolSocket.isLoading ? (
              <p className="mt-3 text-xs text-slate-400">Memuat data...</p>
            ) : null}
            {poolSocket.error ? (
              <p className="mt-3 text-xs text-rose-500">
                {poolSocket.error}
              </p>
            ) : null}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DashboardOperational;
