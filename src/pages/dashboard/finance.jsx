import React, { useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Line,
} from "recharts";

import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import {
  SOCKET_READY_STATE,
  useFinanceDashboardSocket,
} from "@/hooks/useFinanceDashboardSocket";

const formatCurrency = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(Number(value)) ? Number(value) : 0);

const formatSignedCurrency = (value) => {
  const numeric = Number(value) || 0;
  const formatted = formatCurrency(Math.abs(numeric));
  return numeric >= 0 ? formatted : `-${formatted}`;
};

const formatPercent = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return "-";
  }
  return `${numeric.toFixed(2)}%`;
};

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

const DashboardHeader = ({ title }) => (
  <div className="mb-6 flex flex-wrap items-center justify-between">
    <h4 className="inline-block text-xl font-semibold capitalize text-slate-900 lg:text-2xl">
      {title}
    </h4>
  </div>
);

const FinanceDashboard = () => {
  const revenueExpenseSocket = useFinanceDashboardSocket(
    "/ws/finance/revenue-expense/"
  );
  const cashflowSocket = useFinanceDashboardSocket(
    "/ws/finance/cashflow-trend/"
  );
  const salaryRatioSocket = useFinanceDashboardSocket(
    "/ws/finance/salary-ratio/"
  );
  const projectionSocket = useFinanceDashboardSocket(
    "/ws/finance/cash-projection/"
  );

  const monthlyFinancials = useMemo(
    () =>
      Array.isArray(revenueExpenseSocket.data)
        ? revenueExpenseSocket.data.map((item) => ({
            ...item,
            revenue: Number(item.revenue || 0),
            expense: Number(item.expense || 0),
            net: Number(item.revenue || 0) - Number(item.expense || 0),
          }))
        : [],
    [revenueExpenseSocket.data]
  );

  const latestMonthly = monthlyFinancials.at(-1);
  const totalNetYear = monthlyFinancials.reduce(
    (acc, curr) => acc + (curr.net || 0),
    0
  );

  const cashflowSeries = useMemo(
    () =>
      Array.isArray(cashflowSocket.data)
        ? cashflowSocket.data.map((item) => ({
            ...item,
            positive: Number(item.positive || 0),
            negative: Number(item.negative || 0),
            net: Number(item.net || 0),
          }))
        : [],
    [cashflowSocket.data]
  );

  const cashflowAggregates = useMemo(() => {
    return cashflowSeries.reduce(
      (acc, curr) => {
        acc.positive += Math.max(0, curr.positive || 0);
        acc.negative += Math.min(0, curr.negative || 0);
        acc.net += curr.net || 0;
        return acc;
      },
      { positive: 0, negative: 0, net: 0 }
    );
  }, [cashflowSeries]);

  const salaryRatioSeries = useMemo(
    () =>
      Array.isArray(salaryRatioSocket.data)
        ? salaryRatioSocket.data.map((item) => ({
            ...item,
            ratio: Number.isFinite(Number(item.ratio))
              ? Number(item.ratio)
              : null,
            revenue: Number(item.revenue || 0),
            salary: Number(item.salary || 0),
          }))
        : [],
    [salaryRatioSocket.data]
  );

  const latestSalaryRatio = salaryRatioSeries.at(-1);

  const cashProjection = projectionSocket.data || {};
  const projectionSeries = useMemo(() => {
    const data = [];
    const asOf = cashProjection?.as_of;
    const currentBalance = Number(cashProjection?.current_balance || 0);
    if (asOf) {
      const baseDate = new Date(asOf);
      const monthLabel = baseDate.toLocaleDateString("id-ID", {
        month: "short",
        year: "numeric",
      });
      data.push({
        label: `Saldo ${monthLabel}`,
        projected_balance: currentBalance,
        isCurrent: true,
      });
    }
    if (Array.isArray(cashProjection?.projections)) {
      cashProjection.projections.forEach((item) => {
        data.push({
          label: item.label,
          projected_balance: Number(item.projected_balance || 0),
          isCurrent: false,
        });
      });
    }
    return data;
  }, [cashProjection]);

  const averageNetFlow = Number(cashProjection?.average_net_flow || 0);

  return (
    <div className="space-y-6">
      <DashboardHeader title="Dashboard Keuangan" />

      <Card
        title="Pendapatan vs Pengeluaran Bulanan"
        headerslot={
          <HeaderActions
            readyState={revenueExpenseSocket.readyState}
            onRefresh={revenueExpenseSocket.refresh}
          />
        }
      >
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          <div className="space-y-4 lg:col-span-1">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-300">
                Bulan Terakhir
              </p>
              <h3 className="text-2xl font-semibold text-slate-900 dark:text-white">
                {latestMonthly?.label || "-"}
              </h3>
            </div>
            <div className="rounded-lg border border-slate-100 p-4 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-300">
                Pendapatan
              </p>
              <p className="text-lg font-semibold text-emerald-500">
                {formatCurrency(latestMonthly?.revenue || 0)}
              </p>
            </div>
            <div className="rounded-lg border border-slate-100 p-4 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-300">
                Pengeluaran
              </p>
              <p className="text-lg font-semibold text-rose-500">
                {formatCurrency(latestMonthly?.expense || 0)}
              </p>
            </div>
            <div className="rounded-lg border border-slate-100 p-4 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-300">
                Net 12 Bulan
              </p>
              <p className="text-lg font-semibold text-slate-900 dark:text-white">
                {formatSignedCurrency(totalNetYear)}
              </p>
            </div>
            {revenueExpenseSocket.isLoading && (
              <p className="text-xs text-slate-400">Memuat data...</p>
            )}
            {revenueExpenseSocket.error && (
              <p className="text-xs text-rose-500">
                {revenueExpenseSocket.error}
              </p>
            )}
          </div>
          <div className="lg:col-span-3 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyFinancials}>
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
                  formatter={(value, _name, item) => {
                    const dataKey = item?.dataKey;
                    const label =
                      dataKey === "revenue"
                        ? "Pendapatan"
                        : dataKey === "expense"
                        ? "Pengeluaran"
                        : dataKey;
                    return [formatCurrency(value), label];
                  }}
                />
                <Legend
                  formatter={(_value, entry) => {
                    const dataKey = entry?.dataKey;
                    if (dataKey === "revenue") return "Pendapatan";
                    if (dataKey === "expense") return "Pengeluaran";
                    return entry?.value || dataKey;
                  }}
                />
                <Bar
                  dataKey="revenue"
                  fill="#2563eb"
                  radius={[4, 4, 0, 0]}
                  name="Pendapatan"
                />
                <Bar
                  dataKey="expense"
                  fill="#f97316"
                  radius={[4, 4, 0, 0]}
                  name="Pengeluaran"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card
          title="Cashflow Positif/Negatif"
          headerslot={
            <HeaderActions
              readyState={cashflowSocket.readyState}
              onRefresh={cashflowSocket.refresh}
            />
          }
        >
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-1">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-300">
                  30 Hari Terakhir
                </p>
                <h3 className="text-2xl font-semibold text-slate-900 dark:text-white">
                  {formatSignedCurrency(cashflowAggregates.net)}
                </h3>
              </div>
              <div className="rounded-lg border border-slate-100 p-4 dark:border-slate-700">
                <p className="text-xs text-slate-500 dark:text-slate-300">
                  Arus Masuk
                </p>
                <p className="text-lg font-semibold text-emerald-500">
                  {formatCurrency(cashflowAggregates.positive)}
                </p>
              </div>
              <div className="rounded-lg border border-slate-100 p-4 dark:border-slate-700">
                <p className="text-xs text-slate-500 dark:text-slate-300">
                  Arus Keluar
                </p>
                <p className="text-lg font-semibold text-rose-500">
                  {formatCurrency(Math.abs(cashflowAggregates.negative))}
                </p>
              </div>
              {cashflowSocket.isLoading && (
                <p className="text-xs text-slate-400">Memuat data...</p>
              )}
              {cashflowSocket.error && (
                <p className="text-xs text-rose-500">
                  {cashflowSocket.error}
                </p>
              )}
            </div>
            <div className="lg:col-span-2 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cashflowSeries} stackOffset="sign">
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
                    formatter={(value, _name, item) => {
                      const dataKey = item?.dataKey;
                      const label =
                        dataKey === "positive"
                          ? "Arus Masuk"
                          : dataKey === "negative"
                          ? "Arus Keluar"
                          : "Net";
                      return [formatCurrency(value), label];
                    }}
                  />
                  <Legend
                    formatter={(_value, entry) =>
                      entry?.dataKey === "positive"
                        ? "Arus Masuk"
                        : entry?.dataKey === "negative"
                        ? "Arus Keluar"
                        : "Net"
                    }
                  />
                  <Bar
                    dataKey="positive"
                    fill="#10b981"
                    name="Arus Masuk"
                    stackId="cash"
                  />
                  <Bar
                    dataKey="negative"
                    fill="#ef4444"
                    name="Arus Keluar"
                    stackId="cash"
                  />
                  <Line
                    type="monotone"
                    dataKey="net"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={false}
                    name="Net"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>

        <Card
          title="Rasio Gaji terhadap Revenue"
          headerslot={
            <HeaderActions
              readyState={salaryRatioSocket.readyState}
              onRefresh={salaryRatioSocket.refresh}
            />
          }
        >
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-1">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-300">
                  Terakhir
                </p>
                <h3 className="text-2xl font-semibold text-slate-900 dark:text-white">
                  {formatPercent(latestSalaryRatio?.ratio)}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {latestSalaryRatio?.label || "-"}
                </p>
              </div>
              <div className="rounded-lg border border-slate-100 p-4 dark:border-slate-700">
                <p className="text-xs text-slate-500 dark:text-slate-300">
                  Total Gaji
                </p>
                <p className="text-lg font-semibold text-emerald-500">
                  {formatCurrency(latestSalaryRatio?.salary || 0)}
                </p>
              </div>
              <div className="rounded-lg border border-slate-100 p-4 dark:border-slate-700">
                <p className="text-xs text-slate-500 dark:text-slate-300">
                  Total Revenue
                </p>
                <p className="text-lg font-semibold text-slate-900 dark:text-white">
                  {formatCurrency(latestSalaryRatio?.revenue || 0)}
                </p>
              </div>
              {salaryRatioSocket.isLoading && (
                <p className="text-xs text-slate-400">Memuat data...</p>
              )}
              {salaryRatioSocket.error && (
                <p className="text-xs text-rose-500">
                  {salaryRatioSocket.error}
                </p>
              )}
            </div>
            <div className="lg:col-span-2 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={salaryRatioSeries}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis
                    yAxisId="left"
                    tickFormatter={(value) => `${Number(value || 0).toFixed(0)}%`}
                    width={40}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tickFormatter={(value) =>
                      new Intl.NumberFormat("id-ID", {
                        notation: "compact",
                        maximumFractionDigits: 1,
                      }).format(value || 0)
                    }
                    width={60}
                  />
                  <Tooltip
                    formatter={(value, _name, item) => {
                      const dataKey = item?.dataKey;
                      const labelMap = {
                        ratio: "Rasio",
                        salary: "Gaji",
                        revenue: "Revenue",
                      };
                      const key = dataKey || item?.name;
                      const isRatio = key === "ratio";
                      return [
                        isRatio ? formatPercent(value) : formatCurrency(value),
                        labelMap[key] || key,
                      ];
                    }}
                  />
                  <Legend
                    formatter={(_value, entry) => {
                      const labelMap = {
                        ratio: "Rasio",
                        salary: "Gaji",
                        revenue: "Revenue",
                      };
                      const key = entry?.dataKey;
                      return labelMap[key] || entry?.value || key;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="salary"
                    stroke="#22c55e"
                    fill="rgba(34, 197, 94, 0.15)"
                    name="Gaji"
                    yAxisId="right"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#2563eb"
                    fill="rgba(37, 99, 235, 0.15)"
                    name="Revenue"
                    yAxisId="right"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="ratio"
                    stroke="#6366f1"
                    strokeWidth={3}
                    dot={false}
                    name="Rasio"
                    yAxisId="left"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>
      </div>

      <Card
        title="Saldo Kas & Proyeksi 3 Bulan"
        headerslot={
          <HeaderActions
            readyState={projectionSocket.readyState}
            onRefresh={projectionSocket.refresh}
          />
        }
      >
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          <div className="space-y-4 lg:col-span-1">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-300">
                Saldo Saat Ini
              </p>
              <h3 className="text-2xl font-semibold text-slate-900 dark:text-white">
                {formatCurrency(cashProjection?.current_balance || 0)}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Per {cashProjection?.as_of || "-"}
              </p>
            </div>
            <div className="rounded-lg border border-slate-100 p-4 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-300">
                Rata-rata Arus Bersih
              </p>
              <p className="text-lg font-semibold text-slate-900 dark:text-white">
                {formatSignedCurrency(averageNetFlow)}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Berdasarkan 6 bulan terakhir
              </p>
            </div>
            {projectionSocket.isLoading && (
              <p className="text-xs text-slate-400">Memuat data...</p>
            )}
            {projectionSocket.error && (
              <p className="text-xs text-rose-500">
                {projectionSocket.error}
              </p>
            )}
          </div>
          <div className="lg:col-span-3 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={projectionSeries}>
                <defs>
                  <linearGradient id="cashGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
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
                  formatter={(value) => [formatCurrency(value), "Saldo"]}
                />
                <Area
                  type="monotone"
                  dataKey="projected_balance"
                  stroke="#2563eb"
                  fill="url(#cashGradient)"
                  strokeWidth={3}
                  name="Saldo"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default FinanceDashboard;
