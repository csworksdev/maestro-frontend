import React, { useLayoutEffect, useRef, useState } from "react";
import Icon from "@/components/ui/Icon";
import useCareerDashboard from "./useCareerDashboard";
import { EMPTY_FILTERS, filterParams, formatNumber, number } from "./data";
import { ApplicationStatus, Distribution, Hiring, Jobs, Organization, Panel, QueryContent, Sources, StageFunnel, StatCard, Trend } from "./components";
import "./dashboard.css";

const views = [
  { value: "overview", label: "Ringkasan", icon: "heroicons-outline:view-grid" },
  { value: "profiles", label: "Profil pelamar", icon: "heroicons-outline:user-group" },
  { value: "sources", label: "Sumber & konversi", icon: "heroicons-outline:chart-square-bar" },
  { value: "organization", label: "Departemen & cabang", icon: "heroicons-outline:office-building" },
];
const profiles = [
  { key: "by_education", field: "education_level", title: "Pendidikan terakhir", icon: "heroicons-outline:academic-cap" },
  { key: "by_coach_experience", title: "Pengalaman melatih", icon: "heroicons-outline:badge-check" },
  { key: "by_gender", field: "gender", title: "Jenis kelamin", icon: "heroicons-outline:users" },
  { key: "by_contract_system", title: "Sistem kontrak", icon: "heroicons-outline:document-text" },
  { key: "by_education_status", title: "Status pendidikan", icon: "heroicons-outline:book-open" },
  { key: "by_marital_status", title: "Status pernikahan", icon: "heroicons-outline:heart" },
  { key: "by_religion", title: "Agama", icon: "heroicons-outline:sparkles" },
  { key: "by_source", field: "source", title: "Asal informasi lowongan", icon: "heroicons-outline:megaphone" },
];

function FilterField({ label, name, value, onChange, children, ...props }) {
  return <label className="cd-filter-field"><span>{label}</span>{children ? <select name={name} value={value} onChange={onChange} {...props}>{children}</select> : <input type="date" name={name} value={value} onChange={onChange} {...props} />}</label>;
}

function ActionRequired({ data }) {
  const items = [
    { label: "Menunggu ditinjau", total: data.pending_application, description: "Lamaran baru yang belum diproses.", icon: "heroicons-outline:inbox", tone: "amber" },
    { label: "Perlu tindak lanjut", total: data.in_progress_application, description: "Lamaran yang sedang dalam proses seleksi.", icon: "heroicons-outline:clock", tone: "blue" },
    { label: "Belum menjadi pelatih", total: Math.max(0, number(data.hired_application) - number(data.converted_to_trainer)), description: "Kandidat diterima, belum dikonversi.", icon: "heroicons-outline:user-add", tone: "violet" },
  ];
  return <div className="cd-action-grid">{items.map((item) => <div className={`cd-action cd-tone-${item.tone}`} key={item.label}><span className="cd-stat-icon"><Icon icon={item.icon} width={21} /></span><div><span>{item.label}</span><p>{item.description}</p></div><strong>{formatNumber(item.total)}</strong></div>)}</div>;
}

function DashboardKarir() {
  const [filters, setFilters] = useState({ ...EMPTY_FILTERS });
  const [draft, setDraft] = useState({ ...EMPTY_FILTERS });
  const [view, setView] = useState("overview");
  const [dateError, setDateError] = useState("");
  const viewScrollPosition = useRef(null);
  const dashboard = useCareerDashboard(filters);
  const { summary, jobs, applications, departments, branches, departmentOptions, branchOptions } = dashboard;
  const data = summary.data;
  const activeFilters = Object.keys(filterParams(filters)).length;
  const dirty = Object.keys(EMPTY_FILTERS).some((key) => draft[key] !== filters[key]);
  const changeFilter = (event) => {
    setDraft((previous) => ({ ...previous, [event.target.name]: event.target.value }));
    setDateError("");
  };
  const applyFilters = (event) => {
    event.preventDefault();
    if (draft.filter_date_from && draft.filter_date_to && draft.filter_date_from > draft.filter_date_to) {
      setDateError("Tanggal akhir harus sama dengan atau setelah tanggal mulai.");
      return;
    }
    setDateError("");
    setFilters({ ...draft });
  };
  const resetFilters = () => {
    setDraft({ ...EMPTY_FILTERS });
    setFilters({ ...EMPTY_FILTERS });
    setDateError("");
  };
  const changeView = (nextView) => {
    if (nextView === view) return;
    viewScrollPosition.current = { left: window.scrollX, top: window.scrollY };
    setView(nextView);
  };
  useLayoutEffect(() => {
    if (!viewScrollPosition.current) return;
    const { left, top } = viewScrollPosition.current;
    viewScrollPosition.current = null;
    window.scrollTo(left, top);
  }, [view]);
  const updatedAt = summary.dataUpdatedAt ? new Date(summary.dataUpdatedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : null;

  return <div className="career-dashboard">

    <section className="cd-filter-panel" aria-label="Filter dashboard">
      <div className="cd-filter-heading"><div><Icon icon="heroicons-outline:adjustments" width={18} /><b>Filter dashboard</b>{activeFilters > 0 && <span className="cd-count-badge">{activeFilters} aktif</span>}</div><span>Sesuaikan lingkup data yang ingin dilihat</span></div>
      <form onSubmit={applyFilters} noValidate>
        <div className="cd-filter-grid">
          <FilterField label="Departemen" name="filter_department_id" value={draft.filter_department_id} onChange={changeFilter} disabled={departmentOptions.isPending}>
            <option value="">{departmentOptions.isPending ? "Memuat departemen…" : "Semua departemen"}</option>
            {(departmentOptions.data || []).map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}
          </FilterField>
          <FilterField label="Cabang" name="filter_branch_id" value={draft.filter_branch_id} onChange={changeFilter} disabled={branchOptions.isPending}>
            <option value="">{branchOptions.isPending ? "Memuat cabang…" : "Semua cabang"}</option>
            {(branchOptions.data || []).map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}
          </FilterField>
          <FilterField label="Tanggal mulai" name="filter_date_from" value={draft.filter_date_from} max={draft.filter_date_to || undefined} onChange={changeFilter} aria-invalid={!!dateError} aria-describedby={dateError ? "cd-date-error" : undefined} />
          <FilterField label="Tanggal akhir" name="filter_date_to" value={draft.filter_date_to} min={draft.filter_date_from || undefined} onChange={changeFilter} aria-invalid={!!dateError} aria-describedby={dateError ? "cd-date-error" : undefined} />
          <div className="cd-filter-actions"><button type="submit" className="cd-button cd-button-primary">Terapkan filter</button><button type="button" className="cd-button cd-button-light" onClick={resetFilters} disabled={!activeFilters && !dirty} aria-label="Reset filter"><Icon icon="heroicons-outline:refresh" width={17} /><span>Reset</span></button></div>
        </div>
        {dateError && <p className="cd-filter-error" id="cd-date-error" role="alert">{dateError}</p>}
        {dirty && !dateError && <p className="cd-filter-hint" role="status">Filter berubah. Klik Terapkan filter untuk memperbarui data.</p>}
      </form>
      {(departmentOptions.isError || branchOptions.isError) && <div className="cd-notice" role="alert">Pilihan {departmentOptions.isError && branchOptions.isError ? "departemen dan cabang" : departmentOptions.isError ? "departemen" : "cabang"} gagal dimuat. <button type="button" className="cd-text-button" onClick={() => { if (departmentOptions.isError) departmentOptions.refetch(); if (branchOptions.isError) branchOptions.refetch(); }}>Coba lagi</button></div>}
    </section>

    <div className="cd-scope" aria-live="polite"><span><span className={`cd-live-dot ${dashboard.isFetching ? "cd-live-dot-loading" : ""}`} />{dashboard.isFetching ? "Memperbarui data dashboard…" : activeFilters ? "Menampilkan data sesuai filter aktif" : "Menampilkan seluruh periode, departemen, dan cabang"}</span>{updatedAt && <span>Ringkasan diperbarui pukul {updatedAt}</span>}</div>

    <QueryContent query={summary}>{(summaryData) => {
      const overview = summaryData.overview || summaryData;
      return <div className="cd-stat-grid">
        <StatCard label="Total lowongan" value={overview.total_job} icon="heroicons-outline:briefcase" tone="blue" badge="LOWONGAN" detail={`${formatNumber(overview.total_job)} total lowongan`} />
        <StatCard label="Total lamaran" value={overview.total_application} icon="heroicons-outline:document-duplicate" tone="violet" badge="LAMARAN" detail={`${formatNumber(overview.total_application)} total lamaran masuk`} />
        <StatCard label="Menunggu ditinjau" value={overview.pending_application} icon="heroicons-outline:inbox" tone="amber" badge="PENDING" detail={`${formatNumber(overview.pending_application)} lamaran menunggu ditinjau`} />
        <StatCard label="Dalam proses" value={overview.in_progress_application} icon="heroicons-outline:users" tone="amber" badge="SELEKSI" detail={`${formatNumber(overview.in_progress_application)} lamaran dalam proses`} />
        <StatCard label="Lamaran ditolak" value={overview.rejected_application} icon="heroicons-outline:x-circle" tone="violet" badge="DITOLAK" detail={`${formatNumber(overview.rejected_application)} lamaran tidak lolos`} />
        <StatCard label="Kandidat diterima" value={overview.hired_application} icon="heroicons-outline:badge-check" tone="green" badge="HASIL REKRUTMEN" detail={`${formatNumber(overview.hired_application)} kandidat diterima`} />
        <StatCard label="Menjadi pelatih" value={overview.converted_to_trainer} icon="heroicons-outline:academic-cap" tone="green" badge="KONVERSI" detail={`${formatNumber(overview.converted_to_trainer)} kandidat menjadi pelatih`} />
      </div>;
    }}</QueryContent>

    <nav className="cd-view-nav" aria-label="Bagian dashboard">{views.map((item) => <button key={item.value} type="button" aria-pressed={view === item.value} onClick={() => changeView(item.value)}><Icon icon={item.icon} width={18} /><span>{item.label}</span></button>)}</nav>

    {view === "overview" && <div className="cd-view-content">
      <div className="cd-section-label"><h2>Perlu perhatian</h2><span>Prioritas tindak lanjut tim rekrutmen</span></div>
      <QueryContent query={summary}>{(value) => <ActionRequired data={value.action_required || value} />}</QueryContent>
      <div className="cd-grid cd-grid-wide">
        <Panel title="Tren lamaran" subtitle="Perkembangan lamaran dan hasil seleksi per bulan" icon="heroicons-outline:chart-bar"><QueryContent query={summary}>{(value) => <Trend rows={value.trend} />}</QueryContent></Panel>
        <Panel title="Status lamaran" subtitle="Komposisi seluruh status rekrutmen" icon="heroicons-outline:chart-pie"><QueryContent query={applications} fallback={data?.applications}>{(value) => <ApplicationStatus data={value} />}</QueryContent></Panel>
        <Panel title="Alur seleksi" subtitle="Jumlah lamaran yang pernah mencapai setiap tahapan" icon="heroicons-outline:filter"><QueryContent query={summary}>{(value) => <StageFunnel rows={value.stages?.funnel} />}</QueryContent></Panel>
        <Panel title="Lowongan terpopuler" subtitle="Diurutkan berdasarkan jumlah lamaran" icon="heroicons-outline:briefcase"><QueryContent query={jobs} fallback={data?.jobs}>{(value) => <Jobs data={value} />}</QueryContent></Panel>
      </div>
      <div className="cd-grid cd-grid-two">
        <Panel title="Posisi pelamar saat ini" subtitle="Distribusi lamaran pada tahapan yang sedang dijalani" icon="heroicons-outline:location-marker"><QueryContent query={summary}>{(value) => <StageFunnel rows={value.stages?.current} current />}</QueryContent></Panel>
        <Panel title="Konversi menjadi pelatih" subtitle="Tindak lanjut kandidat yang telah diterima" icon="heroicons-outline:academic-cap"><QueryContent query={summary}>{(value) => value.hiring ? <Hiring data={value.hiring} /> : <p className="cd-unavailable">Data konversi belum tersedia.</p>}</QueryContent></Panel>
      </div>
    </div>}

    {view === "profiles" && <div className="cd-view-content"><div className="cd-section-label"><h2>Kenali profil pelamar</h2><span>{applications.data ? `${formatNumber(applications.data.total)} lamaran dalam lingkup terpilih` : "Distribusi profil berdasarkan lamaran"}</span></div><div className="cd-grid cd-grid-profiles">{profiles.map((profile) => <Panel title={profile.title} icon={profile.icon} key={profile.key}><QueryContent query={applications}>{(value) => <Distribution rows={value[profile.key]} field={profile.field} />}</QueryContent></Panel>)}</div></div>}

    {view === "sources" && <div className="cd-view-content"><div className="cd-section-label"><h2>Dari sumber hingga bergabung</h2><span>Evaluasi kanal rekrutmen dan konversi kandidat</span></div><div className="cd-grid cd-grid-two">
      <Panel title="Kanal lamaran" subtitle="Kontribusi setiap asal informasi lowongan" icon="heroicons-outline:share"><QueryContent query={applications} fallback={data?.applications}>{(value) => <Distribution rows={value.by_source} field="source" />}</QueryContent></Panel>
      <Panel title="Konversi menjadi pelatih" subtitle="Kandidat diterima yang sudah menjadi pelatih" icon="heroicons-outline:academic-cap"><QueryContent query={summary}>{(value) => value.hiring ? <Hiring data={value.hiring} /> : <p className="cd-unavailable">Data konversi belum tersedia.</p>}</QueryContent></Panel>
    </div><Panel title="Efektivitas sumber lamaran" subtitle="Konversi dihitung dari kandidat diterima pada masing-masing sumber" icon="heroicons-outline:chart-square-bar" aside={data?.sources && <span className="cd-count-badge">{formatNumber(data.sources.total_sources)} sumber</span>}><QueryContent query={summary}>{(value) => <Sources data={value.sources || {}} />}</QueryContent></Panel></div>}

    {view === "organization" && <div className="cd-view-content"><div className="cd-section-label"><h2>Performa organisasi</h2><span>Bandingkan kebutuhan dan hasil rekrutmen setiap unit</span></div>
      <Panel title="Rekrutmen per departemen" subtitle="Lowongan dan status lamaran pada setiap departemen" icon="heroicons-outline:office-building"><QueryContent query={departments} fallback={data?.departments}>{(value) => <Organization rows={value} type="department" />}</QueryContent></Panel>
      <Panel title="Rekrutmen per cabang" subtitle="Sebaran lamaran dan hasil seleksi di setiap cabang" icon="heroicons-outline:location-marker"><QueryContent query={branches} fallback={data?.branches}>{(value) => <Organization rows={value} type="branch" />}</QueryContent></Panel>
    </div>}
  </div>;
}

export default DashboardKarir;
