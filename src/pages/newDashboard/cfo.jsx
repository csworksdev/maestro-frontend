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

const formatCurrency = (value, minimumFractionDigits = 0) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: minimumFractionDigits === 0 ? 0 : 2,
    minimumFractionDigits,
  }).format(Number.isFinite(Number(value)) ? Number(value) : 0);

const formatNumber = (value, fallback = "-") => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: Math.abs(numeric) < 10 ? 1 : 0,
  }).format(numeric);
};

const formatPercent = (value, fallback = "–", digits = 1) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  const formatted = numeric.toFixed(digits);
  return `${numeric > 0 ? "+" : ""}${formatted}%`;
};

const indicatorTone = (value, positiveIsGood = true) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-200";
  }
  const isPositive = numeric >= 0;
  const isNeutral = numeric === 0;
  const shouldHighlightPositive = positiveIsGood ? isPositive : !isPositive;
  if (shouldHighlightPositive && !isNeutral) {
    return "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-200 dark:ring-emerald-500/40";
  }
  if (!shouldHighlightPositive && !isNeutral) {
    return "bg-rose-50 text-rose-600 ring-1 ring-rose-100 dark:bg-rose-500/10 dark:text-rose-200 dark:ring-rose-500/40";
  }
  return "bg-amber-50 text-amber-600 ring-1 ring-amber-100 dark:bg-amber-500/10 dark:text-amber-200 dark:ring-amber-500/40";
};

const mapAlertTone = (level = "info") => {
  switch (level) {
    case "danger":
      return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200";
    case "warning":
      return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200";
    case "success":
      return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-500/30 dark:bg-slate-500/10 dark:text-slate-200";
  }
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
  tone,
  title,
  headline,
  description,
  footer,
  loading,
}) => (
  <Card className="h-full" bodyClass="p-5">
    <div className="flex items-start gap-4">
      {icon ? (
        <span
          className={`inline-flex h-12 w-12 items-center justify-center rounded-xl text-lg ${tone}`}
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
            {loading ? "…" : headline}
          </p>
        </div>
        {description ? (
          <p className="text-sm text-slate-500 dark:text-slate-300">
            {loading ? "Memuat..." : description}
          </p>
        ) : null}
        {footer}
      </div>
    </div>
  </Card>
);

const DeltaPill = ({
  value,
  positiveIsGood = true,
  label,
  formatter = (val) => formatPercent(val, "–", 1),
}) => {
  const numeric = Number(value);
  const displayValue = Number.isFinite(numeric)
    ? formatter(numeric)
    : formatter(undefined);
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${indicatorTone(
        numeric,
        positiveIsGood
      )}`}
    >
      <Icon
        icon={
          !Number.isFinite(numeric) || numeric === 0
            ? "heroicons-outline:arrow-path"
            : numeric > 0
            ? "heroicons-solid:arrow-trending-up"
            : "heroicons-solid:arrow-trending-down"
        }
      />
      <span>{displayValue}</span>
      {label ? <span className="text-slate-400 dark:text-slate-200">{label}</span> : null}
    </span>
  );
};

const InsightList = ({ items }) => {
  if (!items?.length) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-300">
        Belum ada insight yang bisa ditampilkan.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((item, index) => (
        <li key={`${item.message}-${index}`} className="flex gap-3">
          <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-slate-400 dark:bg-slate-500" />
          <span className="text-sm text-slate-600 dark:text-slate-200">
            {item.message}
          </span>
        </li>
      ))}
    </ul>
  );
};

const tooltipFormatter = (value) => formatCurrency(value ?? 0);

const tooltipLabelFormatter = (label) => label || "";

const CfoDashboard = () => {
  const cfoSocket = useSalesDashboardSocket("/ws/cfo/overview/");
  const payload = cfoSocket.data || {};

  const financial = payload.financial_overview || {};
  const salary = payload.salary_efficiency || {};
  const cash = payload.cash_position || {};
  const alerts = Array.isArray(payload.alerts) ? payload.alerts : [];

  const financialTrend = useMemo(
    () => (Array.isArray(financial.trend) ? financial.trend : []),
    [financial.trend]
  );
  const salaryTrend = useMemo(
    () => (Array.isArray(salary.trend) ? salary.trend : []),
    [salary.trend]
  );
  const cashProjections = useMemo(
    () => (Array.isArray(cash.projections) ? cash.projections : []),
    [cash.projections]
  );

  const bestMonth = financial.best_month;
  const worstMonth = financial.worst_month;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-semibold text-slate-900 dark:text-white">
            Dashboard CFO
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-300">
            Helicopter view performa keuangan 12 bulan terakhir.
          </p>
        </div>
        <HeaderActions
          readyState={cfoSocket.readyState}
          onRefresh={cfoSocket.refresh}
        />
      </div>

      {cfoSocket.error ? (
        <Alert className="border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
          <span className="font-medium">Tidak dapat memuat data dashboard.</span>{" "}
          {cfoSocket.error}
        </Alert>
      ) : null}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon="heroicons-outline:banknotes"
          tone="bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-200"
          title="Pendapatan TTM"
          headline={formatCurrency(financial.ttm_revenue)}
          description={`Rata-rata ${formatCurrency(
            financial.avg_monthly_revenue
          )} per bulan`}
          footer={
            <DeltaPill
              value={financial.yoy_revenue_growth_pct}
              label="YoY"
            />
          }
          loading={cfoSocket.isLoading && !financialTrend.length}
        />
        <SummaryCard
          icon="heroicons-outline:arrow-trending-up"
          tone="bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-200"
          title="Laba TTM"
          headline={formatCurrency(financial.ttm_profit)}
          description={`MoM ${formatPercent(
            financial.month_over_month_profit_pct,
            "–"
          )}`}
          footer={
            <DeltaPill
              value={financial.yoy_profit_growth_pct}
              label="YoY"
            />
          }
          loading={cfoSocket.isLoading && !financialTrend.length}
        />
        <SummaryCard
          icon="heroicons-outline:adjustments-vertical"
          tone="bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-200"
          title="Margin Laba TTM"
          headline={formatPercent(financial.ttm_margin_pct, "–")}
          description={`Margin bulan berjalan ${formatPercent(
            financial.margin_pct,
            "–"
          )}`}
          footer={
            <DeltaPill
              value={financial.month_over_month_revenue_pct}
              label="MoM Revenue"
            />
          }
          loading={cfoSocket.isLoading && !financialTrend.length}
        />
        <SummaryCard
          icon="heroicons-outline:lifebuoy"
          tone="bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-200"
          title="Runway Kas"
          headline={
            cash.runway_months !== null && cash.runway_months !== undefined
              ? `${formatNumber(cash.runway_months)} bulan`
              : "Stabil"
          }
          description={`Cash on hand ${formatCurrency(cash.current_balance)}`}
          footer={
            <DeltaPill
              value={cash.average_net_flow}
              positiveIsGood
              formatter={(val) => formatCurrency(val, 0)}
              label="Net flow"
            />
          }
          loading={cfoSocket.isLoading && !cashProjections.length}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <Card
          title="Tren Pendapatan vs Biaya"
          subtitle={
            financial.timeframe
              ? `${financial.timeframe.start} – ${financial.timeframe.end}`
              : "12 bulan terakhir"
          }
          className="xl:col-span-2"
          bodyClass="p-6"
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={financialTrend}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F97316" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#F97316" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="label" tickLine={false} />
                <YAxis tickFormatter={(value) => formatNumber(value / 1_000_000)} />
                <Tooltip
                  formatter={tooltipFormatter}
                  labelFormatter={tooltipLabelFormatter}
                  contentStyle={{
                    borderRadius: "12px",
                    borderColor: "#E2E8F0",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#0EA5E9"
                  fill="url(#revenueGradient)"
                  strokeWidth={2}
                  name="Revenue"
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  stroke="#F97316"
                  fill="url(#expenseGradient)"
                  strokeWidth={2}
                  name="Biaya"
                />
                <Area
                  type="monotone"
                  dataKey="profit"
                  stroke="#10B981"
                  fillOpacity={0}
                  strokeDasharray="4 4"
                  strokeWidth={2}
                  name="Laba"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card title="Highlight Bulanan" bodyClass="p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                Profit terbaik
              </h4>
              <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
                {bestMonth
                  ? `${bestMonth.label} • ${formatCurrency(bestMonth.profit)}`
                  : "Belum ada data"}
              </p>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                Profit terendah
              </h4>
              <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
                {worstMonth
                  ? `${worstMonth.label} • ${formatCurrency(worstMonth.profit)}`
                  : "Belum ada data"}
              </p>
            </div>
          </div>
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
              Insight otomatis
            </h4>
            <InsightList items={financial.insights} />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <Card
          title="Rasio Gaji terhadap Revenue"
          subtitle={
            salary.timeframe
              ? `${salary.timeframe.start} – ${salary.timeframe.end}`
              : "12 bulan terakhir"
          }
          bodyClass="p-6 space-y-6 xl:col-span-2"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                Rasio rata-rata
              </p>
              <p className="text-2xl font-semibold text-slate-900 dark:text-white">
                {formatPercent(salary.average_ratio_pct, "–")}
              </p>
              <DeltaPill
                value={salary.yoy_ratio_delta_pct}
                positiveIsGood={false}
                label="Δ YoY"
              />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                Bulan terbaru
              </p>
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-300">
                  {salary.latest?.label || "-"}
                </p>
                <p className="text-lg font-semibold text-slate-900 dark:text-white">
                  {formatPercent(salary.latest?.ratio_pct, "–")}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-300">
                  Gaji {formatCurrency(salary.latest?.salary)} · Revenue{" "}
                  {formatCurrency(salary.latest?.revenue)}
                </p>
              </div>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salaryTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="label" tickLine={false} />
                <YAxis
                  yAxisId="ratio"
                  orientation="left"
                  tickFormatter={(value) => `${value}%`}
                  width={48}
                />
                <YAxis
                  yAxisId="salary"
                  orientation="right"
                  tickFormatter={(value) => `${Math.round(value / 1_000_000)}M`}
                  width={48}
                />
                <Tooltip
                  formatter={(value, dataKey) =>
                    dataKey === "ratio"
                      ? formatPercent(value, "–")
                      : formatCurrency(value)
                  }
                  labelFormatter={tooltipLabelFormatter}
                  contentStyle={{
                    borderRadius: "12px",
                    borderColor: "#E2E8F0",
                  }}
                />
                <Bar
                  yAxisId="salary"
                  dataKey="salary"
                  name="Total gaji"
                  fill="#6366F1"
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  yAxisId="salary"
                  dataKey="revenue"
                  name="Revenue"
                  fill="#22D3EE"
                  radius={[6, 6, 0, 0]}
                />
                <Area
                  yAxisId="ratio"
                  type="monotone"
                  dataKey="ratio"
                  name="Rasio gaji"
                  stroke="#F59E0B"
                  fillOpacity={0}
                  strokeWidth={2}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Posisi Kas" bodyClass="p-6 space-y-6">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
              Update terakhir
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-300">
              {cash.as_of || "-"}
            </p>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-300">
                Saldo saat ini
              </p>
              <p className="text-3xl font-semibold text-slate-900 dark:text-white">
                {formatCurrency(cash.current_balance)}
              </p>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-slate-100 px-4 py-3 dark:bg-slate-700">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-300">
                  Net flow rata-rata
                </p>
                <p className="text-lg font-semibold text-slate-900 dark:text-white">
                  {formatCurrency(cash.average_net_flow, 0)}
                </p>
              </div>
              <DeltaPill value={cash.average_net_flow} label="/bulan" />
            </div>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
              Proyeksi 3 bulan
            </h4>
            <div className="mt-3 space-y-3">
              {cashProjections.length ? (
                cashProjections.map((item) => (
                  <div
                    key={item.month}
                    className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-2 dark:border-slate-600"
                  >
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-300">
                      {item.label}
                    </span>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
                      {formatCurrency(item.projected_balance)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-300">
                  Belum ada proyeksi yang tersedia.
                </p>
              )}
            </div>
          </div>
        </Card>
      </div>

      <Card title="Alert CFO" bodyClass="p-6 space-y-3">
        {alerts.length ? (
          alerts.map((alert, index) => (
            <Alert
              key={`${alert.message}-${index}`}
              className={`${mapAlertTone(alert.level)} rounded-xl`}
              icon="heroicons-outline:bell-alert"
            >
              <span className="text-sm leading-relaxed">{alert.message}</span>
            </Alert>
          ))
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-300">
            Tidak ada alert aktif saat ini.
          </p>
        )}
      </Card>
    </div>
  );
};

export default CfoDashboard;
