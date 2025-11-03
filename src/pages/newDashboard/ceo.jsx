import React, { useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import Icon from "@/components/ui/Icon";
import {
  SOCKET_READY_STATE,
  useSalesDashboardSocket,
} from "@/hooks/useSalesDashboardSocket";

const formatCurrency = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const formatPercent = (value, fallback = "-") => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return `${numeric.toFixed(1)}%`;
};

const formatNumber = (value, fallback = "-") => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: Math.abs(numeric) < 10 ? 1 : 0,
  }).format(numeric);
};

const indicatorTone = (value, positiveIsGood = true) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-200";
  }
  const positive = positiveIsGood ? numeric >= 0 : numeric <= 0;
  const negative = positiveIsGood ? numeric < 0 : numeric > 0;
  if (positive) {
    return "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-200 dark:ring-emerald-500/40";
  }
  if (negative) {
    return "bg-rose-50 text-rose-600 ring-1 ring-rose-100 dark:bg-rose-500/10 dark:text-rose-200 dark:ring-rose-500/40";
  }
  return "bg-amber-50 text-amber-600 ring-1 ring-amber-100 dark:bg-amber-500/10 dark:text-amber-200 dark:ring-amber-500/40";
};

const ConnectionIndicator = ({ readyState }) => {
  const tone =
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
    <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-300">
      <span className={`h-2 w-2 rounded-full ${tone}`} />
      {label}
    </span>
  );
};

const HeaderActions = ({ readyState, onRefresh }) => (
  <div className="flex items-center gap-3">
    <ConnectionIndicator readyState={readyState} />
    <Button
      onClick={onRefresh}
      className="btn-sm bg-slate-900 text-white hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600"
      icon="heroicons-outline:arrow-path"
      text="Refresh"
    />
  </div>
);

const SummaryCard = ({
  icon,
  iconTone,
  title,
  headline,
  description,
  footer,
}) => (
  <Card className="h-full" bodyClass="p-5">
    <div className="flex items-start gap-4">
      {icon ? (
        <span
          className={`inline-flex h-12 w-12 items-center justify-center rounded-xl text-lg ${iconTone}`}
        >
          <Icon icon={icon} className="text-xl" />
        </span>
      ) : null}
      <div className="flex-1 space-y-3">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-300">
            {title}
          </p>
          <p className="text-2xl font-semibold text-slate-900 dark:text-white">
            {headline}
          </p>
        </div>
        {description ? (
          <p className="text-sm text-slate-500 dark:text-slate-300">
            {description}
          </p>
        ) : null}
        {footer}
      </div>
    </div>
  </Card>
);

const ScoreChip = ({ label, value }) => (
  <span className="inline-flex min-w-[96px] items-center justify-between gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-200">
    <span className="text-slate-400 dark:text-slate-300">{label}</span>
    <span className="text-slate-900 dark:text-white">{value}</span>
  </span>
);

const CeoDashboard = () => {
  const ceoSocket = useSalesDashboardSocket("/ws/ceo/overview/");
  const payload = ceoSocket.data || {};

  const financial = payload.financial || {};
  const customer = payload.customer || {};
  const productivity = payload.productivity || {};
  const cash = payload.cash || {};
  const composite = payload.composite || {};

  const financeTrend = useMemo(
    () => (Array.isArray(financial.trend) ? financial.trend : []),
    [financial.trend]
  );
  const retentionTrend = useMemo(
    () => (Array.isArray(customer.history) ? customer.history : []),
    [customer.history]
  );
  const cashProjection = useMemo(
    () => (Array.isArray(cash.projections) ? cash.projections : []),
    [cash.projections]
  );
  const topTrainers = useMemo(
    () =>
      Array.isArray(productivity.top_trainers)
        ? productivity.top_trainers
        : [],
    [productivity.top_trainers]
  );

  const componentScores = composite.components || {};

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-semibold text-slate-900 dark:text-white">
            Dashboard CEO
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-300">
            Pantau kesehatan bisnis Maestro secara realtime.
          </p>
        </div>
        <HeaderActions
          readyState={ceoSocket.readyState}
          onRefresh={ceoSocket.refresh}
        />
      </div>

      {ceoSocket.error ? (
        <Alert className="border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
          <span className="font-medium">
            Tidak dapat memuat data dashboard.
          </span>{" "}
          {ceoSocket.error}
        </Alert>
      ) : null}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon="heroicons-outline:sparkles"
          iconTone="bg-indigo-100 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-200"
          title="Skor Komposit"
          headline={
            Number.isFinite(composite.score)
              ? composite.score.toFixed(1)
              : "-"
          }
          description="Ringkasan margin, pertumbuhan, retensi, produktivitas, dan runway."
          footer={
            <div className="flex flex-wrap gap-2">
              <ScoreChip
                label="Margin"
                value={formatNumber(componentScores.margin_score, "-")}
              />
              <ScoreChip
                label="Growth"
                value={formatNumber(componentScores.growth_score, "-")}
              />
              <ScoreChip
                label="Retention"
                value={formatNumber(componentScores.retention_score, "-")}
              />
            </div>
          }
        />
        <SummaryCard
          icon="heroicons-outline:banknotes"
          iconTone="bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-200"
          title={`Keuangan - ${financial.current_month || "Periode aktif"}`}
          headline={formatCurrency(financial.revenue)}
          description="Pendapatan kotor bulan ini."
          footer={
            <div className="flex flex-col gap-1 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-300">
                  Profit
                </span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {formatCurrency(financial.profit)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-300">
                  Margin
                </span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {formatPercent(financial.margin_pct)}
                </span>
              </div>
              <div
                className={`flex items-center justify-between rounded-md px-2 py-1 text-sm font-medium ${indicatorTone(financial.growth_pct)}`}
              >
                <span>Pertumbuhan m/m</span>
                <span>{formatPercent(financial.growth_pct, "-")}</span>
              </div>
            </div>
          }
        />
        <SummaryCard
          icon="heroicons-outline:user-group"
          iconTone="bg-sky-100 text-sky-600 dark:bg-sky-500/10 dark:text-sky-200"
          title={`Pelanggan - ${customer.current_month || "Periode aktif"}`}
          headline={formatNumber(customer.customers)}
          description="Jumlah pelanggan aktif dan retensinya."
          footer={
            <div className="flex flex-col gap-1 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-300">
                  Retensi
                </span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {formatPercent(customer.retention_rate)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-300">
                  Returning
                </span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {formatNumber(customer.returning_customers)}
                </span>
              </div>
              <div
                className={`flex items-center justify-between rounded-md px-2 py-1 text-sm font-medium ${indicatorTone(customer.growth_pct)}`}
              >
                <span>Pertumbuhan m/m</span>
                <span>{formatPercent(customer.growth_pct, "-")}</span>
              </div>
            </div>
          }
        />
        <SummaryCard
          icon="heroicons-outline:shield-check"
          iconTone="bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-200"
          title="Likuiditas dan Runway"
          headline={
            Number.isFinite(cash.runway_months)
              ? `${cash.runway_months.toFixed(1)} bln`
              : cash.runway_months === null
              ? "Stabil"
              : "-"
          }
          description={
            cash.runway_months === null
              ? "Cashflow positif, runway bertambah."
              : "Perkiraan bertahan dengan arus kas saat ini."
          }
          footer={
            <div className="flex flex-col gap-1 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-300">
                  Saldo kini
                </span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {formatCurrency(cash.current_balance)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-300">
                  Net flow rata-rata
                </span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {formatCurrency(cash.average_net_flow)}
                </span>
              </div>
            </div>
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Card
          title="Revenue vs Expense"
          subtitle={
            financial.current_month
              ? `Periode terakhir: ${financial.current_month}`
              : null
          }
          headerslot={
            ceoSocket.isLoading ? (
              <span className="text-xs text-slate-400">Memuat...</span>
            ) : null
          }
        >
          <div className="h-80">
            {financeTrend.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={financeTrend}>
                  <defs>
                    <linearGradient
                      id="colorRevenue"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient
                      id="colorExpense"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis
                    tickFormatter={(value) =>
                      new Intl.NumberFormat("id-ID", {
                        notation: "compact",
                        maximumFractionDigits: 1,
                      }).format(value || 0)
                    }
                  />
                  <Tooltip
                    formatter={(value) => formatCurrency(value)}
                    labelFormatter={(value) => `Periode ${value}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="Revenue"
                    stroke="#2563eb"
                    fill="url(#colorRevenue)"
                  />
                  <Area
                    type="monotone"
                    dataKey="expense"
                    name="Expense"
                    stroke="#f97316"
                    fill="url(#colorExpense)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                Data revenue belum tersedia.
              </div>
            )}
          </div>
        </Card>

        <Card title="Retensi Pelanggan" subtitle="12 bulan terakhir">
          <div className="h-80">
            {retentionTrend.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={retentionTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis
                    tickFormatter={(value) =>
                      new Intl.NumberFormat("id-ID", {
                        maximumFractionDigits: 0,
                      }).format(value || 0)
                    }
                  />
                  <Tooltip
                    formatter={(value, name) =>
                      name === "retention_rate"
                        ? formatPercent(value)
                        : formatNumber(value)
                    }
                    labelFormatter={(value) => `Periode ${value}`}
                  />
                  <Bar
                    dataKey="customers"
                    name="Total pelanggan"
                    fill="#0ea5e9"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                Data retensi belum tersedia.
              </div>
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Card title="Produktivitas Lapangan" subtitle="Rata-rata 30 hari terakhir">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="rounded-lg border border-slate-100 p-4 dark:border-slate-700">
                <p className="text-sm text-slate-500 dark:text-slate-300">
                  Occupancy kelas
                </p>
                <p className="text-3xl font-semibold text-slate-900 dark:text-white">
                  {formatPercent(productivity.occupancy_rate)}
                </p>
                {productivity.range ? (
                  <p className="text-xs text-slate-400">
                    Minggu {productivity.range.start} - {productivity.range.end}
                  </p>
                ) : null}
              </div>
              <div className="rounded-lg border border-slate-100 p-4 dark:border-slate-700">
                <p className="text-sm text-slate-500 dark:text-slate-300">
                  Indeks produktivitas
                </p>
                <p className="text-3xl font-semibold text-slate-900 dark:text-white">
                  {formatNumber(productivity.index_score)}
                </p>
                <p className="text-xs text-slate-400">
                  Gabungan attendance, ketepatan waktu, dan occupancy.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-emerald-50 p-3 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-100">
                  <p className="text-xs uppercase tracking-wide">Attendance</p>
                  <p className="text-xl font-semibold">
                    {formatPercent(productivity.avg_attendance_rate)}
                  </p>
                </div>
                <div className="rounded-lg bg-sky-50 p-3 text-sky-700 dark:bg-sky-500/10 dark:text-sky-100">
                  <p className="text-xs uppercase tracking-wide">
                    Tepat waktu
                  </p>
                  <p className="text-xl font-semibold">
                    {formatPercent(productivity.avg_punctuality_rate)}
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-300">
                Top trainer (30 hari)
              </p>
              <ul className="space-y-2">
                {topTrainers.slice(0, 5).map((trainer) => (
                  <li
                    key={trainer.trainer_id}
                    className="flex items-center justify-between rounded-lg border border-slate-100 px-4 py-3 text-sm dark:border-slate-700"
                  >
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {trainer.trainer_name || "Tanpa nama"}
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatPercent(trainer.attendance_rate)} hadir -{" "}
                        {formatPercent(trainer.punctuality_rate)} tepat waktu
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${indicatorTone(trainer.attendance_rate)}`}
                    >
                      {formatPercent(trainer.attendance_rate)}
                    </span>
                  </li>
                ))}
                {!topTrainers.length ? (
                  <li className="rounded-lg border border-dashed border-slate-200 px-4 py-6 text-center text-xs text-slate-400 dark:border-slate-700">
                    Data kehadiran pelatih belum tersedia.
                  </li>
                ) : null}
              </ul>
            </div>
          </div>
        </Card>

        <Card title="Proyeksi Kas" subtitle="3 bulan ke depan">
          <div className="h-80">
            {cashProjection.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cashProjection}>
                  <defs>
                    <linearGradient id="colorCash" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis
                    tickFormatter={(value) =>
                      new Intl.NumberFormat("id-ID", {
                        notation: "compact",
                        maximumFractionDigits: 1,
                      }).format(value || 0)
                    }
                  />
                  <Tooltip
                    formatter={(value) => formatCurrency(value)}
                    labelFormatter={(value) => `Proyeksi ${value}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="projected_balance"
                    name="Saldo"
                    stroke="#22c55e"
                    fill="url(#colorCash)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                Proyeksi kas belum tersedia.
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default CeoDashboard;
