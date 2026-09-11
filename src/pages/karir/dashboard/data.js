export const EMPTY_FILTERS = {
  filter_department_id: "",
  filter_branch_id: "",
  filter_date_from: "",
  filter_date_to: "",
};

export const number = (value) => {
  const result = Number(value);
  return Number.isFinite(result) ? Math.max(0, result) : 0;
};
export const formatNumber = (value) => number(value).toLocaleString("id-ID");
export const percent = (value, total) => total > 0 ? Math.min(100, number(value) / total * 100) : 0;
export const formatPercent = (value) => `${number(value).toLocaleString("id-ID", { maximumFractionDigits: 1 })}%`;
export const asArray = (value) => Array.isArray(value) ? value : [];
export const filterParams = (filters) => Object.fromEntries(
  Object.keys(EMPTY_FILTERS).filter((key) => filters[key]).map((key) => [key, filters[key]])
);

export const APPLICATION_STATUSES = [
  { value: "pending", label: "Menunggu", color: "#f59e0b" },
  { value: "in_progress", label: "Dalam proses", color: "#4669fa" },
  { value: "hired", label: "Diterima", color: "#10b981" },
  { value: "rejected", label: "Ditolak", color: "#f1595c" },
];
export const JOB_STATUSES = [
  { value: "published", label: "Published", color: "#10b981" },
  { value: "draft", label: "Draft", color: "#94a3b8" },
  { value: "closed", label: "Closed", color: "#f59e0b" },
];
export const COLORS = ["#4669fa", "#14b8a6", "#8b5cf6", "#f59e0b", "#f472b6", "#38bdf8"];
const LABELS = {
  male: "Laki-laki", female: "Perempuan", single: "Belum menikah", married: "Menikah",
  student: "Siswa/Mahasiswa", graduated: "Lulusan", fulltime: "Full Time", freelance: "Freelance", hybrid: "Hybrid",
  company_website: "Website perusahaan", linkedin: "LinkedIn", instagram: "Instagram", job_portal: "Job portal",
  employee_referral: "Referensi karyawan", friend: "Teman", family: "Keluarga", other: "Lainnya",
  no_experience: "0 tahun", less_than_1_year: "< 1 tahun", one_to_three_years: "1–3 tahun",
  three_to_five_years: "3–5 tahun", more_than_5_years: "> 5 tahun",
};
export const labelFor = (value) => LABELS[value] || (/^(sma|smk|[ds][1-4])$/.test(value) ? value.toUpperCase() : String(value || "Tidak diketahui").replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase()));

// The summary uses domain keys; detail endpoints use value/label pairs.
export const distribution = (rows, field = "value", defaults = []) => {
  const grouped = new Map();
  asArray(rows).filter(Boolean).forEach((row) => {
    const value = row.value ?? row[field] ?? "unknown";
    const existing = grouped.get(value);
    grouped.set(value, { value, label: row.label || labelFor(value), total: number(row.total) + (existing?.total || 0) });
  });
  return [
    ...defaults.map((item) => ({ ...item, total: grouped.get(item.value)?.total || 0 })),
    ...[...grouped.values()].filter((item) => !defaults.some((entry) => entry.value === item.value)),
  ].map((item, index) => ({ ...item, color: item.color || COLORS[index % COLORS.length] }));
};

export const readDashboard = (response) => {
  const envelope = response?.data;
  if (envelope?.status !== "success" || envelope.data == null || typeof envelope.data !== "object") {
    throw new Error(envelope?.message || "Format data dashboard belum sesuai.");
  }
  return envelope.data;
};

// Organization detail examples are not specified; accept the list envelopes used by this app.
export const readList = (payload, key) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.[key])) return payload[key];
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.data)) return payload.data;
  if (payload?.data && payload.data !== payload) return readList(payload.data, key);
  throw new Error("Format daftar data belum sesuai.");
};

export const monthLabel = (period) => {
  const match = /^(\d{4})-(\d{2})$/.exec(String(period));
  if (!match || Number(match[2]) < 1 || Number(match[2]) > 12) return String(period || "—");
  return new Date(Number(match[1]), Number(match[2]) - 1, 1).toLocaleDateString("id-ID", { month: "short", year: "numeric" });
};
