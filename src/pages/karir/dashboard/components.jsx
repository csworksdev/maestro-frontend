import React, { useId } from "react";
import { Link } from "react-router-dom";
import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import Icon from "@/components/ui/Icon";
import CareerErrorState from "@/pages/karir/components/CareerErrorState";
import { APPLICATION_STATUSES, JOB_STATUSES, asArray, distribution, formatNumber, formatPercent, labelFor, monthLabel, number, percent } from "./data";

export function Panel({ title, subtitle, icon, aside, children, className = "" }) {
  return <section className={`cd-panel ${className}`} aria-label={title}>
    <div className="cd-panel-heading">
      <div className="cd-panel-title">{icon && <span className="cd-icon"><Icon icon={icon} width={19} /></span>}<div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div></div>
      {aside}
    </div>
    {children}
  </section>;
}

function TableScroll({ label, children }) {
  const hintId = useId();
  return <div className="cd-table-wrapper">
    <p className="cd-table-hint" id={hintId}><Icon icon="heroicons-outline:arrows-expand" width={16} />Geser tabel ke samping untuk melihat semua kolom.</p>
    <div className="cd-table-scroll" tabIndex={0} role="region" aria-label={label} aria-describedby={hintId}>{children}</div>
  </div>;
}

const axisNumber = new Intl.NumberFormat("id-ID", { notation: "compact", maximumFractionDigits: 1 });

export function Empty({ text = "Belum ada data untuk filter ini." }) {
  return <div className="cd-empty"><Icon icon="heroicons-outline:chart-bar" width={28} /><p>{text}</p></div>;
}

export function Loading({ compact = false }) {
  return <div className={`cd-loading ${compact ? "cd-loading-compact" : ""}`} role="status" aria-label="Memuat data dashboard">
    <span className="sr-only">Memuat data dashboard…</span>
    {[1, 2, 3].map((item) => <div className="cd-skeleton" key={item} />)}
  </div>;
}

export function QueryContent({ query, fallback, children }) {
  const data = query.data ?? fallback;
  if (data == null) {
    if (query.isPending) return <Loading />;
    return <CareerErrorState error={query.error} onRetry={() => query.refetch()} isRetrying={query.isFetching} />;
  }
  return <>
    {query.isError && <div className="cd-notice" role="status">{query.data ? "Pembaruan gagal. Menampilkan data terakhir." : "Rincian belum tersedia. Menampilkan data dari ringkasan."} <button type="button" className="cd-text-button" disabled={query.isFetching} onClick={() => query.refetch()}>Coba lagi</button></div>}
    {children(data)}
  </>;
}

export function StatCard({ label, value, icon, tone, detail, badge }) {
  return <article className={`cd-stat cd-tone-${tone}`} aria-label={label}>
    <div className="cd-stat-top"><span className="cd-stat-icon"><Icon icon={icon} width={22} /></span><span className="cd-stat-tag">{badge}</span></div>
    <p>{label}</p><strong>{value == null ? "—" : formatNumber(value)}</strong><div className="cd-stat-detail">{detail}</div>
  </article>;
}

export function Distribution({ rows, field, defaults, suffix = "lamaran" }) {
  const items = distribution(rows, field, defaults);
  const total = items.reduce((sum, item) => sum + item.total, 0);
  if (!total) return <Empty />;
  return <div className="cd-distribution">{items.map((item) => <div key={item.value}>
    <div className="cd-distribution-label"><span><i style={{ background: item.color }} />{item.label}</span><span><b>{formatNumber(item.total)}</b> <small>{formatPercent(percent(item.total, total))}</small></span></div>
    <div className="cd-track" role="img" aria-label={`${item.label}: ${formatNumber(item.total)} ${suffix}, ${formatPercent(percent(item.total, total))}`}><div style={{ width: `${percent(item.total, total)}%`, background: item.color }} /></div>
  </div>)}</div>;
}

export function ApplicationStatus({ data }) {
  const safeData = data || {};
  const items = distribution(safeData.by_status, "status", APPLICATION_STATUSES);
  const total = items.reduce((sum, item) => sum + item.total, 0);
  let offset = 0;
  const stops = items.map((item) => {
    const start = offset;
    offset += percent(item.total, total);
    return `${item.color} ${start}% ${offset}%`;
  });
  return <div className="cd-status-content">
    <div className="cd-donut" role="img" aria-label={items.map((item) => `${item.label}: ${formatNumber(item.total)}`).join(", ")} style={{ background: total ? `conic-gradient(${stops.join(",")})` : "var(--cd-track)" }}><div><strong>{formatNumber(safeData.total ?? total)}</strong><span>Total lamaran</span></div></div>
    <div className="cd-status-legend">{items.map((item) => <div key={item.value}><span><i style={{ background: item.color }} />{item.label}</span><b>{formatNumber(item.total)}</b><small>{formatPercent(percent(item.total, total))}</small></div>)}</div>
  </div>;
}

function TrendTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return <div className="cd-tooltip"><b>{label}</b>{payload.map((entry) => <div key={entry.dataKey}><span><i style={{ background: entry.color }} />{entry.name}</span><strong>{formatNumber(entry.value)}</strong></div>)}</div>;
}

export function Trend({ rows }) {
  const data = asArray(rows).filter(Boolean).slice().sort((a, b) => String(a.period).localeCompare(String(b.period))).map((row) => ({
    period: row.period, label: monthLabel(row.period), total: number(row.total),
    ...Object.fromEntries(APPLICATION_STATUSES.map(({ value }) => [value, number(row[value])])),
  }));
  if (!data.length) return <Empty text="Belum ada tren lamaran pada periode ini." />;
  return <>
    <div className="cd-chart-legend"><span><i className="cd-total-line" />Total lamaran</span>{APPLICATION_STATUSES.map((item) => <span key={item.value}><i style={{ background: item.color }} />{item.label}</span>)}</div>
    <div className="cd-trend-chart">
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <ComposedChart data={data} margin={{ top: 18, right: 12, bottom: 0, left: 0 }} accessibilityLayer>
          <CartesianGrid stroke="var(--cd-border)" strokeDasharray="4 5" vertical={false} />
          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "var(--cd-muted)", fontSize: 11 }} tickMargin={12} minTickGap={24} />
          <YAxis width={52} allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "var(--cd-muted)", fontSize: 11 }} tickFormatter={(value) => axisNumber.format(value)} />
          <Tooltip content={<TrendTooltip />} cursor={{ fill: "var(--cd-soft)" }} />
          {APPLICATION_STATUSES.map((item) => <Bar key={item.value} dataKey={item.value} name={item.label} stackId="status" fill={item.color} maxBarSize={44} isAnimationActive={false} />)}
          <Line type="monotone" dataKey="total" name="Total lamaran" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 4, fill: "#8b5cf6", strokeWidth: 2 }} isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
    <details className="cd-chart-data"><summary>Lihat data tren</summary><TableScroll label="Data tren lamaran"><table className="cd-table"><thead><tr><th scope="col">Periode</th><th scope="col">Total</th>{APPLICATION_STATUSES.map((item) => <th scope="col" key={item.value}>{item.label}</th>)}</tr></thead><tbody>{data.map((row) => <tr key={row.period}><th scope="row">{row.label}</th><td>{formatNumber(row.total)}</td>{APPLICATION_STATUSES.map((item) => <td key={item.value}>{formatNumber(row[item.value])}</td>)}</tr>)}</tbody></table></TableScroll></details>
  </>;
}

export function StageFunnel({ rows, current = false }) {
  const stages = asArray(rows).filter(Boolean).slice().sort((a, b) => number(a.stage_order) - number(b.stage_order));
  const max = Math.max(1, ...stages.map((row) => number(row.total)));
  if (!stages.length) return <Empty text={current ? "Belum ada lamaran pada tahapan aktif." : "Belum ada data tahapan seleksi."} />;
  return <ol className={`cd-stages ${current ? "cd-stages-current" : ""}`}>{stages.map((row, index) => <li key={row.stage_id || `${row.stage_order}-${index}`}>
    <span className="cd-stage-number">{row.stage_order ?? index + 1}</span>
    <div className="cd-stage-body"><div><span>{row.stage_name}</span><b>{formatNumber(row.total)} <small>lamaran</small></b></div><div className="cd-track"><div style={{ width: `${percent(row.total, max)}%`, opacity: 1 - (index / Math.max(stages.length, 1)) * 0.5 }} /></div></div>
  </li>)}</ol>;
}

export function Jobs({ data }) {
  const safeData = data || {};
  const rows = asArray(safeData.most_applied).filter(Boolean).slice().sort((a, b) => number(b.total_applications) - number(a.total_applications));
  const max = Math.max(1, ...rows.map((row) => number(row.total_applications)));
  const statuses = distribution(safeData.by_status, "status", JOB_STATUSES);
  return <>
    <div className="cd-job-statuses">{statuses.map((item) => <span key={item.value}><i style={{ background: item.color }} />{item.label}<b>{formatNumber(item.total)}</b></span>)}</div>
    {rows.length ? <ol className="cd-jobs">{rows.map((row, index) => <li key={row.job_id || index}><span className={`cd-job-rank ${index === 0 && number(row.total_applications) > 0 ? "cd-job-rank-first" : ""}`}>{String(index + 1).padStart(2, "0")}</span><div><div className="cd-job-label"><span>{row.title}</span><b>{formatNumber(row.total_applications)} <small>lamaran</small></b></div><div className="cd-track"><div style={{ width: `${percent(row.total_applications, max)}%` }} /></div></div></li>)}</ol> : <Empty text="Belum ada lowongan pada filter ini." />}
    <Link to="/karir/loker" className="cd-panel-link">Kelola {formatNumber(safeData.total)} lowongan <Icon icon="heroicons-outline:arrow-right" width={16} /></Link>
  </>;
}

export function Hiring({ data }) {
  const safeData = data || {};
  const metrics = [["Diterima", safeData.total_hired], ["Menjadi pelatih", safeData.converted_to_trainer], ["Belum dikonversi", safeData.not_converted]];
  return <div className="cd-hiring"><div className="cd-hiring-rate"><span className="cd-hiring-icon"><Icon icon="heroicons-outline:academic-cap" width={30} /></span><div><strong>{formatPercent(safeData.conversion_rate)}</strong><p>Konversi kandidat diterima menjadi pelatih</p></div></div><div className="cd-track cd-track-large"><div style={{ width: `${Math.min(100, number(safeData.conversion_rate))}%` }} /></div><div className="cd-hiring-metrics">{metrics.map(([label, value]) => <div key={label}><strong>{formatNumber(value)}</strong><span>{label}</span></div>)}</div></div>;
}

export function Organization({ rows, type }) {
  const items = asArray(rows).filter(Boolean).slice().sort((a, b) => number(b.total_applications) - number(a.total_applications));
  if (!items.length) return <Empty text={`Belum ada data ${type === "department" ? "departemen" : "cabang"} untuk filter ini.`} />;
  return <TableScroll label={`Tabel ${type === "department" ? "departemen" : "cabang"}`}><table className="cd-table"><thead><tr><th scope="col">{type === "department" ? "Departemen" : "Cabang"}</th><th scope="col">Lowongan</th><th scope="col">Lamaran</th>{APPLICATION_STATUSES.map((status) => <th scope="col" key={status.value}>{status.label}</th>)}</tr></thead><tbody>{items.map((row, index) => <tr key={row[`${type}_id`] || index}><th scope="row"><span className="cd-org-name"><span className="cd-org-icon"><Icon icon={type === "department" ? "heroicons-outline:office-building" : "heroicons-outline:location-marker"} width={18} /></span>{row[`${type}_name`] || row.name || "—"}</span></th><td>{formatNumber(row.total_jobs)}</td><td><b>{formatNumber(row.total_applications)}</b></td>{APPLICATION_STATUSES.map((status) => <td key={status.value}>{status.value === "hired" ? <span className="cd-hired-badge">{formatNumber(row[status.value])}</span> : formatNumber(row[status.value])}</td>)}</tr>)}</tbody></table></TableScroll>;
}

export function Sources({ data }) {
  const rows = asArray(data?.data).filter(Boolean).slice().sort((a, b) => number(b.total_applications) - number(a.total_applications));
  if (!rows.length) return <Empty text="Belum ada data sumber lamaran." />;
  return <TableScroll label="Tabel efektivitas sumber"><table className="cd-table"><thead><tr><th scope="col">Sumber</th><th scope="col">Nama sumber / referensi</th><th scope="col">Lamaran</th><th scope="col">Diterima</th><th scope="col">Ditolak</th><th scope="col">Konversi diterima</th></tr></thead><tbody>{rows.map((row, index) => <tr key={`${row.source}-${row.source_name}-${index}`}><th scope="row">{labelFor(row.source)}</th><td>{row.source_name || "—"}</td><td><b>{formatNumber(row.total_applications)}</b></td><td><span className="cd-hired-badge">{formatNumber(row.hired)}</span></td><td>{formatNumber(row.rejected)}</td><td><div className="cd-source-rate"><span>{formatPercent(row.conversion_rate)}</span><div className="cd-track"><div style={{ width: `${Math.min(100, number(row.conversion_rate))}%` }} /></div></div></td></tr>)}</tbody></table></TableScroll>;
}
