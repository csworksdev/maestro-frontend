import React, { useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import {
  SOCKET_READY_STATE,
  useSalesDashboardSocket,
} from "@/hooks/useSalesDashboardSocket";

const formatCurrency = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value || 0);

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

const SalesDashboardHeader = ({ title }) => (
  <div className="flex justify-between flex-wrap items-center mb-6">
    <h4 className="font-medium lg:text-2xl text-xl capitalize text-slate-900 inline-block ltr:pr-4 rtl:pl-4">
      {title}
    </h4>
  </div>
);

const SalesDashboard = () => {
  const monthlyTotalSocket = useSalesDashboardSocket(
    "/ws/sales/monthly-total/"
  );
  const retentionSocket = useSalesDashboardSocket(
    "/ws/sales/customer-retention/"
  );
  const aovSocket = useSalesDashboardSocket("/ws/sales/aov/");

  const monthlyTotals = useMemo(
    () =>
      Array.isArray(monthlyTotalSocket.data) ? monthlyTotalSocket.data : [],
    [monthlyTotalSocket.data]
  );
  const retentionSeries = useMemo(
    () => (Array.isArray(retentionSocket.data) ? retentionSocket.data : []),
    [retentionSocket.data]
  );
  const aovSeries = useMemo(
    () => (Array.isArray(aovSocket.data) ? aovSocket.data : []),
    [aovSocket.data]
  );

  const latestSales = monthlyTotals.at(-1);
  const latestRetention = retentionSeries.at(-1);
  const latestAov = aovSeries.at(-1);
  const totalYearlySales = monthlyTotals.reduce(
    (acc, curr) => acc + Number(curr.total_sales || 0),
    0
  );
  const growthValue = Number(latestAov?.mom_growth);
  const growthClass = Number.isFinite(growthValue)
    ? growthValue > 0
      ? "text-emerald-500"
      : growthValue < 0
      ? "text-rose-500"
      : "text-slate-900 dark:text-white"
    : "text-slate-900 dark:text-white";

  return (
    <div className="space-y-6">
      <SalesDashboardHeader title="Dashboard Penjualan" />

      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-12">
          <Card
            title="Total Penjualan Bulanan"
            headerslot={
              <HeaderActions
                readyState={monthlyTotalSocket.readyState}
                onRefresh={monthlyTotalSocket.refresh}
              />
            }
          >
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
              <div className="lg:col-span-1 space-y-3">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-300">
                    Total bulan ini
                  </p>
                  <p className="text-2xl font-semibold text-slate-900 dark:text-white">
                    {latestSales
                      ? formatCurrency(latestSales.total_sales)
                      : "-"}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {latestSales?.label || "Menunggu data"}
                  </p>
                </div>
                {/* <div className="rounded-md border border-slate-100 p-3 dark:border-slate-700">
                  <p className="text-xs font-medium uppercase text-slate-500 dark:text-slate-300">
                    12 bulan terakhir
                  </p>
                  <p className="text-lg font-semibold text-primary-500">
                    {formatCurrency(totalYearlySales)}
                  </p>
                </div> */}
                {monthlyTotalSocket.isLoading && (
                  <p className="text-xs text-slate-400">Memuat data...</p>
                )}
                {monthlyTotalSocket.error && (
                  <p className="text-xs text-rose-500">
                    {monthlyTotalSocket.error}
                  </p>
                )}
              </div>
              <div className="lg:col-span-3 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyTotals}>
                    <defs>
                      <linearGradient
                        id="colorSales"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#2563eb"
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor="#2563eb"
                          stopOpacity={0}
                        />
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
                      labelFormatter={(label) => `Periode: ${label}`}
                    />
                    <Area
                      type="monotone"
                      dataKey="total_sales"
                      stroke="#2563eb"
                      fillOpacity={1}
                      fill="url(#colorSales)"
                      name="Total Penjualan"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>
        </div>

        <div className="col-span-12 lg:col-span-6">
          <Card
            title="Customer Retention Rate"
            headerslot={
              <HeaderActions
                readyState={retentionSocket.readyState}
                onRefresh={retentionSocket.refresh}
              />
            }
          >
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs uppercase text-slate-500 dark:text-slate-300">
                    Retensi terakhir
                  </p>
                  <p className="text-xl font-semibold text-slate-900 dark:text-white">
                    {formatPercent(latestRetention?.retention_rate)}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase text-slate-500 dark:text-slate-300">
                    Pelanggan aktif
                  </p>
                  <p className="text-xl font-semibold text-slate-900 dark:text-white">
                    {latestRetention?.total_customers ?? "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase text-slate-500 dark:text-slate-300">
                    Kembali lagi
                  </p>
                  <p className="text-xl font-semibold text-slate-900 dark:text-white">
                    {latestRetention?.returning_customers ?? "-"}
                  </p>
                </div>
              </div>
              {retentionSocket.isLoading && (
                <p className="text-xs text-slate-400">Memuat data...</p>
              )}
              {retentionSocket.error && (
                <p className="text-xs text-rose-500">{retentionSocket.error}</p>
              )}
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={retentionSeries}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis
                      domain={[0, 100]}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <Tooltip
                      formatter={(value, name) =>
                        name === "retention_rate"
                          ? [formatPercent(value), "Retention"]
                          : [
                              value,
                              name === "total_customers"
                                ? "Total Customer"
                                : "Returning",
                            ]
                      }
                      labelFormatter={(label) => `Periode: ${label}`}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="retention_rate"
                      stroke="#2563eb"
                      strokeWidth={2}
                      dot={false}
                      name="Retention %"
                    />
                    <Line
                      type="monotone"
                      dataKey="total_customers"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      name="Total Customer"
                    />
                    <Line
                      type="monotone"
                      dataKey="returning_customers"
                      stroke="#10b981"
                      strokeWidth={2}
                      name="Returning Customer"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>
        </div>

        <div className="col-span-12 lg:col-span-6">
          <Card
            title="Average Order Value (AOV)"
            headerslot={
              <HeaderActions
                readyState={aovSocket.readyState}
                onRefresh={aovSocket.refresh}
              />
            }
          >
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs uppercase text-slate-500 dark:text-slate-300">
                    AOV terakhir
                  </p>
                  <p className="text-xl font-semibold text-slate-900 dark:text-white">
                    {latestAov ? formatCurrency(latestAov.aov) : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase text-slate-500 dark:text-slate-300">
                    Order
                  </p>
                  <p className="text-xl font-semibold text-slate-900 dark:text-white">
                    {latestAov?.order_count ?? "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase text-slate-500 dark:text-slate-300">
                    Growth MoM
                  </p>
                  <p className={`text-xl font-semibold ${growthClass}`}>
                    {formatPercent(latestAov?.mom_growth)}
                  </p>
                </div>
              </div>
              {aovSocket.isLoading && (
                <p className="text-xs text-slate-400">Memuat data...</p>
              )}
              {aovSocket.error && (
                <p className="text-xs text-rose-500">{aovSocket.error}</p>
              )}
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={aovSeries}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis
                      yAxisId="left"
                      tickFormatter={(value) =>
                        new Intl.NumberFormat("id-ID", {
                          notation: "compact",
                          maximumFractionDigits: 1,
                        }).format(value || 0)
                      }
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tickFormatter={(value) => `${value}%`}
                    />
                    <Tooltip
                      formatter={(value, name) =>
                        name === "aov"
                          ? [formatCurrency(value), "AOV"]
                          : [formatPercent(value), "Growth"]
                      }
                      labelFormatter={(label) => `Periode: ${label}`}
                    />
                    <Legend />
                    <Bar
                      yAxisId="left"
                      dataKey="aov"
                      name="AOV"
                      fill="#2563eb"
                      radius={[4, 4, 0, 0]}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="mom_growth"
                      stroke="#10b981"
                      strokeWidth={2}
                      name="Growth %"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SalesDashboard;
