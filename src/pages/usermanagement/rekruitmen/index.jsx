import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Checkbox from "@/components/ui/Checkbox";
import Icon from "@/components/ui/Icon";
import PoolLoader from "@/components/PoolLoader";
import Search from "@/components/globals/table/search";
import Table from "@/components/globals/table/table";
import TableAction from "@/components/globals/table/tableAction";
import PaginationComponent from "@/components/globals/table/pagination";
import { getApplicationsAll } from "@/axios/career/application";
import { getJobBranchesAll, getJobsAll } from "@/axios/career/job";
import { getStagesByDepartment } from "@/axios/career/stage";
import { getDepartmentsAll } from "@/axios/userManagement/department";
import {
  RECRUITMENT_STAGE_DEFINITIONS,
  getLatestApplicationStage,
  getStageNotes,
  getStageOrder,
  getStageStatus,
  getStageStatusDisplay,
  isRejectedStage,
} from "./stageConfig";
import { processApplicationStage } from "./stageProcess";

const dropdownParams = { page: 1, page_size: 200, ordering: "name" };

const educationLabels = {
  sd: "SD",
  smp: "SMP",
  sma: "SMA",
  smk: "SMK",
  d1: "D1",
  d2: "D2",
  d3: "D3",
  d4: "D4",
  s1: "S1",
  s2: "S2",
  s3: "S3",
};

const genderOptions = [
  { value: "male", label: "Laki-laki" },
  { value: "female", label: "Perempuan" },
];

const educationOptions = Object.entries(educationLabels).map(([value, label]) => ({
  value,
  label,
}));

const maritalOptions = [
  { value: "single", label: "Belum Menikah" },
  { value: "married", label: "Menikah" },
  { value: "divorced", label: "Cerai" },
  { value: "widowed", label: "Duda/Janda" },
];

const religionOptions = [
  { value: "islam", label: "Islam" },
  { value: "christian", label: "Kristen" },
  { value: "catholic", label: "Katolik" },
  { value: "hindu", label: "Hindu" },
  { value: "buddhist", label: "Buddha" },
  { value: "confucian", label: "Konghucu" },
];

const educationStatusOptions = [
  { value: "student", label: "Masih Kuliah" },
  { value: "graduated", label: "Lulusan" },
];

const contractSystemOptions = [
  { value: "full_time", label: "Full Time" },
  { value: "part_time", label: "Part Time" },
  { value: "freelance", label: "Freelance" },
  { value: "internship", label: "Internship" },
];

const coachExperienceOptions = [
  { value: "no_experience", label: "Belum Berpengalaman" },
  { value: "less_than_one_year", label: "< 1 Tahun" },
  { value: "one_to_three_years", label: "1 - 3 Tahun" },
  { value: "three_to_five_years", label: "3 - 5 Tahun" },
  { value: "more_than_five_years", label: "> 5 Tahun" },
];

const sourceOptions = [
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "website", label: "Website" },
  { value: "job_portal", label: "Job Portal" },
  { value: "friend", label: "Teman" },
  { value: "family", label: "Keluarga" },
  { value: "other", label: "Lainnya" },
];

const filterConfig = [
  { key: "filter_gender", title: "Gender", options: genderOptions },
  {
    key: "filter_marital_status",
    title: "Status Pernikahan",
    options: maritalOptions,
  },
  { key: "filter_religion", title: "Agama", options: religionOptions },
  {
    key: "filter_education_level",
    title: "Pendidikan",
    options: educationOptions,
  },
  {
    key: "filter_education_status",
    title: "Status Pendidikan",
    options: educationStatusOptions,
  },
  {
    key: "filter_contract_system",
    title: "Sistem Kontrak",
    options: contractSystemOptions,
  },
  {
    key: "filter_coach_experience",
    title: "Pengalaman Coach",
    options: coachExperienceOptions,
  },
  {
    key: "filter_source",
    title: "Sumber Info",
    options: sourceOptions,
  },
];

const getApplicationWorkStatusDisplay = (application) =>
  application?.employment_status_display ||
  application?.contract_system_display ||
  application?.employment_status ||
  application?.contract_system ||
  "-";

const getErrorMessage = (error) =>
  error?.response?.data?.detail ||
  error?.response?.data?.message ||
  error?.message ||
  "Gagal memproses pelamar.";

const isCanceledRequest = (error) =>
  error?.name === "CanceledError" ||
  error?.code === "ERR_CANCELED" ||
  error?.message === "canceled";

const useDebouncedValue = (value, delay = 250) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => window.clearTimeout(timeoutId);
  }, [delay, value]);

  return debouncedValue;
};

const extractResults = (response) => {
  const data = response?.data ?? response;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.data?.results)) return data.data.results;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data)) return data;
  return [];
};

const normalizeListData = (response) => {
  const data = response?.data ?? response;
  const results = extractResults(response);
  const count = Number(data?.count ?? data?.data?.count ?? results.length);

  return {
    ...(data && typeof data === "object" && !Array.isArray(data) ? data : {}),
    count: Number.isFinite(count) ? count : results.length,
    results,
  };
};

const getOptionText = (...values) => {
  const value = values.find(
    (item) => typeof item === "string" && item.trim() !== "",
  );

  return value || "-";
};

const getOptionId = (...values) => {
  const value = values.find((item) => {
    if (item == null || item === "") return false;
    if (typeof item === "object") {
      return Boolean(item.department_id || item.branch_id || item.job_id || item.id);
    }
    return true;
  });

  if (value && typeof value === "object") {
    return String(
      value.department_id || value.branch_id || value.job_id || value.id || "",
    );
  }

  return value == null ? "" : String(value);
};

const displayText = (value, fallback = "-") => {
  if (value == null || value === "") return fallback;
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }
  if (typeof value === "boolean") return value ? "Ya" : "Tidak";
  return fallback;
};

const getApplicationStageStatusDisplay = (application = {}, stage = null) => {
  const safeStage = stage || {};
  return (
    getStageStatusDisplay(safeStage, "") ||
    getStageStatusDisplay(application?.current_stage, "") ||
    getStageStatusDisplay(
      {
        status: application?.status,
        status_display: application?.status_display,
      },
      "",
    ) ||
    getStageStatus(safeStage)
  );
};

const getGenderBadgeClass = (gender = "") =>
  String(gender).toLowerCase() === "female"
    ? "bg-pink-50 text-pink-700 ring-pink-100 dark:bg-pink-500/10 dark:text-pink-200 dark:ring-pink-500/20"
    : "bg-sky-50 text-sky-700 ring-sky-100 dark:bg-sky-500/10 dark:text-sky-200 dark:ring-sky-500/20";

const getStageBadgeMeta = (value = "") => {
  const status = String(value).trim().toLowerCase();

  if (
    status.includes("tidak lulus") ||
    status.includes("gagal") ||
    status.includes("tolak") ||
    status.includes("reject") ||
    status.includes("failed")
  ) {
    return {
      className:
        "bg-rose-100 text-rose-800 ring-rose-200 shadow-sm dark:bg-rose-500/20 dark:text-rose-100 dark:ring-rose-400/30",
      icon: "heroicons-outline:x-circle",
    };
  }

  if (
    status.includes("lulus") ||
    status.includes("approve") ||
    status.includes("diterima") ||
    status.includes("selesai") ||
    status.includes("passed")
  ) {
    return {
      className:
        "bg-emerald-100 text-emerald-800 ring-emerald-200 shadow-sm dark:bg-emerald-500/20 dark:text-emerald-100 dark:ring-emerald-400/30",
      icon: "heroicons-outline:check-circle",
    };
  }

  if (
    status.includes("proses") ||
    status.includes("sedang") ||
    status.includes("diproses") ||
    status.includes("process") ||
    status.includes("berjalan")
  ) {
    return {
      className:
        "bg-amber-100 text-amber-900 ring-amber-200 shadow-sm dark:bg-amber-500/20 dark:text-amber-100 dark:ring-amber-400/30",
      icon: "heroicons-outline:clock",
    };
  }

  if (
    status.includes("pending") ||
    status.includes("menunggu") ||
    status.includes("submit") ||
    status.includes("baru")
  ) {
    return {
      className:
        "bg-sky-100 text-sky-800 ring-sky-200 shadow-sm dark:bg-sky-500/20 dark:text-sky-100 dark:ring-sky-400/30",
      icon: "heroicons-outline:document-text",
    };
  }

  if (
    status.includes("jadwal") ||
    status.includes("dijadwalkan") ||
    status.includes("schedule")
  ) {
    return {
      className:
        "bg-violet-100 text-violet-800 ring-violet-200 shadow-sm dark:bg-violet-500/20 dark:text-violet-100 dark:ring-violet-400/30",
      icon: "heroicons-outline:calendar",
    };
  }

  return {
    className:
      "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-700/60 dark:text-slate-200 dark:ring-slate-600",
    icon: "heroicons-outline:information-circle",
  };
};

const RecruitmentBadge = ({
  children,
  className = "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-700/60 dark:text-slate-200 dark:ring-slate-600",
  icon,
}) => (
  <span
    className={`inline-flex max-w-full items-center justify-center gap-1.5 rounded-full px-2.5 py-1 text-center text-[11px] font-semibold leading-4 ring-1 ${className}`}
  >
    {icon ? (
      <Icon icon={icon} className="h-3.5 w-3.5 flex-none" />
    ) : null}
    <span className="min-w-0 break-words">{children}</span>
  </span>
);

const CenterCell = ({ children }) => (
  <div className="flex min-w-0 justify-center text-center">{children}</div>
);

const getInitialFilters = () => ({
  filter_departement_id: "",
  filter_job_id: "",
  filter_branch_id: "",
  filter_gender: [],
  filter_marital_status: [],
  filter_religion: [],
  filter_education_level: [],
  filter_education_status: [],
  filter_contract_system: [],
  filter_coach_experience: [],
  filter_source: [],
  filter_is_working: "",
  filter_stage_order: "",
});

const normalizeParams = (params) =>
  Object.entries(params).reduce((result, [key, value]) => {
    if (Array.isArray(value)) {
      if (value.length) result[key] = value.join(",");
      return result;
    }

    if (value !== "" && value != null) {
      result[key] = value;
    }

    return result;
  }, {});

const getApplicationJobId = (application = {}) =>
  getOptionId(application?.job, application?.job_id);

const getApplicationDepartmentId = (application = {}) =>
  getOptionId(
    application?.department,
    application?.department_id,
    application?.department?.department_id,
    application?.job_department,
    application?.job_department_id,
  );

const getJobDepartmentId = (job = {}) =>
  getOptionId(job?.department, job?.department_id);

const getApplicationBranchId = (application = {}) =>
  getOptionId(application?.branch, application?.branch_id);

const getApplicationStageOrder = (application = {}) => {
  const latestStage = getLatestApplicationStage(application);
  const stageOrder = getStageOrder(latestStage);

  return stageOrder == null ? "" : String(stageOrder);
};

const filterMatches = (application, filters) => {
  const singleValueFilters = [
    ["filter_job_id", getApplicationJobId(application)],
    ["filter_branch_id", getApplicationBranchId(application)],
    ["filter_is_working", application?.is_working],
    ["filter_stage_order", getApplicationStageOrder(application)],
  ];

  for (const [key, rawValue] of singleValueFilters) {
    const filterValue = filters[key];
    if (!filterValue) continue;
    if (rawValue == null || rawValue === "") continue;
    if (String(rawValue) !== String(filterValue)) return false;
  }

  const multiValueFilters = [
    ["filter_gender", application?.gender],
    ["filter_marital_status", application?.marital_status],
    ["filter_religion", application?.religion],
    ["filter_education_level", application?.education_level],
    ["filter_education_status", application?.education_status],
    ["filter_contract_system", application?.contract_system],
    ["filter_coach_experience", application?.coach_experience],
    ["filter_source", application?.source],
  ];

  for (const [key, rawValue] of multiValueFilters) {
    const filterValues = filters[key] || [];
    if (!filterValues.length || rawValue == null || rawValue === "") continue;
    if (!filterValues.includes(String(rawValue))) return false;
  }

  return true;
};

const FilterCheckboxGroup = ({
  group,
  values,
  disabled,
  onToggle,
}) => (
  <div className="border-t border-slate-100 pt-3 dark:border-slate-700/70">
    <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
      {group.title}
    </div>
    <div className="space-y-1">
      {group.options.map((option) => (
        <Checkbox
          key={`${group.key}-${option.value}`}
          id={`${group.key}-${option.value}`}
          label={option.label}
          value={(values[group.key] || []).includes(option.value)}
          disabled={disabled}
          onChange={() => onToggle(group.key, option.value)}
        />
      ))}
    </div>
  </div>
);

const TableLoading = () => (
  <div className="rounded border border-slate-200 p-8 text-center dark:border-slate-700">
    <PoolLoader size="sm" className="mx-auto" />
    <div className="mt-2 text-sm font-medium text-slate-500">
      Memuat data rekruitmen...
    </div>
  </div>
);

const FilterSelect = ({
  label,
  value,
  placeholder,
  options,
  disabled = false,
  required = false,
  onChange,
}) => (
  <div>
    <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">
      {label}
    </label>
    <div className="relative">
      <select
        className="form-control min-h-[40px] appearance-none rounded-md py-2 pr-9 text-sm"
        value={value || ""}
        disabled={disabled}
        onChange={onChange}
      >
        <option value="" disabled={required}>
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={`${label}-${option.value}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-lg text-slate-500 dark:text-slate-300">
        <Icon icon="heroicons:chevron-down" />
      </span>
    </div>
  </div>
);

const Rekruitmen = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialFilterLoading, setIsInitialFilterLoading] = useState(false);
  const [isStageLoading, setIsStageLoading] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [listData, setListData] = useState({ count: 0, results: [] });
  const [departments, setDepartments] = useState([]);
  const [branches, setBranches] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [stages, setStages] = useState([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState(getInitialFilters);
  const [isProcessing, setIsProcessing] = useState(false);
  const selectedDepartmentId = filters.filter_departement_id;
  const debouncedFilters = useDebouncedValue(filters);
  const debouncedSelectedDepartmentId = debouncedFilters.filter_departement_id;
  const applicationRequestRef = useRef(0);
  const stageRequestRef = useRef(0);

  const departmentOptions = useMemo(
    () =>
      departments
        .map((department) => ({
          value: getOptionId(department.department_id, department.id),
          label: getOptionText(department.name, department.department_name),
        }))
        .filter((option) => option.value),
    [departments],
  );

  const branchOptions = useMemo(
    () =>
      branches
        .map((branch) => ({
          value: getOptionId(branch.branch_id, branch.id),
          label: getOptionText(branch.name, branch.branch_name),
        }))
        .filter((option) => option.value),
    [branches],
  );

  const selectedDepartmentJobs = useMemo(
    () =>
      jobs
        .filter((job) => getJobDepartmentId(job) === selectedDepartmentId)
        .filter((job) => getOptionId(job.job_id, job.id)),
    [jobs, selectedDepartmentId],
  );

  const jobOptions = useMemo(
    () =>
      selectedDepartmentJobs
        .map((job) => ({
          value: getOptionId(job.job_id, job.id),
          label: getOptionText(job.title, job.job_title, job.name),
        }))
        .filter((option) => option.value),
    [selectedDepartmentJobs],
  );

  const stageOptions = useMemo(() => {
    const sourceStages = stages.length
      ? stages
      : RECRUITMENT_STAGE_DEFINITIONS.map((stage) => ({
          stage_order: stage.order,
          name: stage.title,
        }));

    return sourceStages
      .map((stage) => {
        const order = getStageOrder(stage);
        return {
          value: order == null ? "" : String(order),
          label: getOptionText(stage.name, stage.stage_name, `Tahap ${order}`),
        };
      })
      .filter((option) => option.value);
  }, [stages]);

  const displayedListData = useMemo(() => {
    const results = Array.isArray(listData?.results) ? listData.results : [];

    if (!selectedDepartmentId) {
      return { ...listData, count: 0, results: [] };
    }

    const selectedJobIds = new Set(
      selectedDepartmentJobs
        .map((job) => getOptionId(job.job_id, job.id))
        .filter(Boolean),
    );

    const filteredResults = results.filter((application) => {
      const applicationDepartmentId = getApplicationDepartmentId(application);
      if (applicationDepartmentId) {
        return (
          applicationDepartmentId === selectedDepartmentId &&
          filterMatches(application, filters)
        );
      }

      if (selectedJobIds.size) {
        return (
          selectedJobIds.has(getApplicationJobId(application)) &&
          filterMatches(application, filters)
        );
      }

      if (jobs.length) {
        return false;
      }

      return filterMatches(application, filters);
    });

    return {
      ...listData,
      count:
        filteredResults.length !== results.length
          ? filteredResults.length
          : listData?.count || filteredResults.length,
      results: filteredResults,
    };
  }, [filters, jobs.length, listData, selectedDepartmentId, selectedDepartmentJobs]);

  const activeFilterCount = useMemo(
    () =>
      Object.entries(filters).reduce((total, [key, value]) => {
        if (key === "filter_departement_id") return total;
        if (Array.isArray(value)) return total + value.length;
        return value ? total + 1 : total;
      }, 0),
    [filters],
  );

  const fetchInitialFilters = useCallback(async (signal) => {
    try {
      setIsInitialFilterLoading(true);
      const [departmentResult, branchResult, jobResult] = await Promise.allSettled([
        getDepartmentsAll(dropdownParams, { signal }),
        getJobBranchesAll(dropdownParams, { signal }),
        getJobsAll(dropdownParams, { signal }),
      ]);

      if (departmentResult.status === "fulfilled") {
        setDepartments(extractResults(departmentResult.value));
      } else if (!isCanceledRequest(departmentResult.reason)) {
        console.error("Error fetching recruitment departments", departmentResult.reason);
      }

      if (branchResult.status === "fulfilled") {
        setBranches(extractResults(branchResult.value));
      } else if (!isCanceledRequest(branchResult.reason)) {
        console.error("Error fetching recruitment branches", branchResult.reason);
      }

      if (jobResult.status === "fulfilled") {
        setJobs(extractResults(jobResult.value));
      } else if (!isCanceledRequest(jobResult.reason)) {
        console.error("Error fetching recruitment jobs", jobResult.reason);
      }

      const hasRejectedRequest =
        departmentResult.status === "rejected" ||
        branchResult.status === "rejected" ||
        jobResult.status === "rejected";

      if (!signal?.aborted && hasRejectedRequest) {
        Swal.fire(
          "Peringatan",
          "Sebagian data filter rekruitmen gagal dimuat.",
          "warning",
        );
      }
    } catch (error) {
      if (!isCanceledRequest(error)) {
        console.error("Error fetching recruitment filters", error);
        Swal.fire("Error!", "Gagal memuat data filter rekruitmen.", "error");
      }
    } finally {
      if (!signal?.aborted) {
        setIsInitialFilterLoading(false);
      }
    }
  }, []);

  const fetchDepartmentFilters = useCallback(async (departmentId, signal) => {
    if (!departmentId) {
      setStages([]);
      return;
    }

    const requestId = stageRequestRef.current + 1;
    stageRequestRef.current = requestId;

    try {
      setIsStageLoading(true);

      const stageResponse = await getStagesByDepartment(
        departmentId,
        {
          page: 1,
          page_size: 100,
          ordering: "stage_order",
        },
        { signal },
      );

      if (stageRequestRef.current === requestId && !signal?.aborted) {
        setStages(extractResults(stageResponse));
      }
    } catch (error) {
      if (!isCanceledRequest(error)) {
        setStages([]);
        console.error("Error fetching recruitment stages", error);
      }
    } finally {
      if (stageRequestRef.current === requestId && !signal?.aborted) {
        setIsStageLoading(false);
      }
    }
  }, []);

  const fetchData = useCallback(async (
    page,
    size,
    query,
    departmentId,
    nextFilters,
    signal,
  ) => {
    if (!departmentId) {
      setListData({ count: 0, results: [] });
      setIsLoading(false);
      return;
    }

    const requestId = applicationRequestRef.current + 1;
    applicationRequestRef.current = requestId;

    try {
      setIsLoading(true);
      const res = await getApplicationsAll(normalizeParams({
        page: page + 1,
        page_size: size,
        search: query,
        ordering: "-id",
        ...nextFilters,
        filter_departement_id: departmentId,
      }), { signal });

      if (applicationRequestRef.current === requestId && !signal?.aborted) {
        setListData(normalizeListData(res));
      }
    } catch (error) {
      if (!isCanceledRequest(error)) {
        console.error("Error fetching applications", error);
        Swal.fire("Error!", "Gagal mengambil data rekruitmen.", "error");
      }
    } finally {
      if (applicationRequestRef.current === requestId && !signal?.aborted) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchInitialFilters(controller.signal);
    return () => controller.abort();
  }, [fetchInitialFilters]);

  useEffect(() => {
    const controller = new AbortController();
    fetchDepartmentFilters(debouncedSelectedDepartmentId, controller.signal);
    return () => controller.abort();
  }, [debouncedSelectedDepartmentId, fetchDepartmentFilters]);

  useEffect(() => {
    const controller = new AbortController();
    fetchData(
      pageIndex,
      pageSize,
      search,
      debouncedSelectedDepartmentId,
      debouncedFilters,
      controller.signal,
    );
    return () => controller.abort();
  }, [
    debouncedFilters,
    debouncedSelectedDepartmentId,
    fetchData,
    pageIndex,
    pageSize,
    search,
  ]);

  const handlePageChange = (page) => {
    setPageIndex(page);
  };

  const handlePageSizeChange = (size) => {
    setPageSize(size);
    setPageIndex(0);
  };

  const handleSearch = (query) => {
    setSearch(query);
    setPageIndex(0);
  };

  const handleDepartmentChange = (event) => {
    const departmentId = event.target.value;
    setListData({ count: 0, results: [] });
    setPageIndex(0);
    setFilters({
      ...getInitialFilters(),
      filter_departement_id: departmentId,
    });
  };

  const handleFilterToggle = (filterKey, value) => {
    setFilters((current) => {
      const values = current[filterKey] || [];
      const nextValues = values.includes(value)
        ? values.filter((item) => item !== value)
        : [...values, value];

      return {
        ...current,
        [filterKey]: nextValues,
      };
    });
    setPageIndex(0);
  };

  const handleResetFilters = () => {
    setFilters({
      ...getInitialFilters(),
      filter_departement_id: selectedDepartmentId,
    });
    setPageIndex(0);
  };

  const handleSingleFilterChange = (name, value) => {
    setFilters((current) => ({ ...current, [name]: value }));
    setPageIndex(0);
  };

  const handleDetail = useCallback((application) => {
    navigate(`detail/${application.application_id}`, {
      state: { data: application },
    });
  }, [navigate]);

  const handleDecision = useCallback(async (application, status) => {
    const latestStage = getLatestApplicationStage(application);
    const isApproved = status === "approved";
    const isStarting = isApproved && !latestStage;
    const processLabel = isStarting ? "Mulai" : "Lanjut";
    const result = await Swal.fire({
      title: isApproved
        ? isStarting
          ? "Mulai proses rekrutmen?"
          : "Lanjutkan ke tahap selanjutnya?"
        : "Tolak pelamar?",
      text: isStarting
        ? "Pelamar akan masuk ke tahap Cek CV."
        : undefined,
      input: "textarea",
      inputLabel: "Catatan tahapan (opsional)",
      inputPlaceholder: "Tambahkan catatan bila diperlukan",
      inputValue: getStageNotes(latestStage),
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: isApproved ? "#22c55e" : "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: isApproved ? processLabel : "Tolak",
      cancelButtonText: "Batal",
    });

    if (!result.isConfirmed) return;

    try {
      setIsProcessing(true);
      await processApplicationStage({
        application,
        status,
        notes: result.value?.trim() || "",
      });
      Swal.fire("Berhasil!", "Pelamar berhasil diproses.", "success");
      fetchData(pageIndex, pageSize, search, selectedDepartmentId, filters);
    } catch (error) {
      Swal.fire("Error!", getErrorMessage(error), "error");
    } finally {
      setIsProcessing(false);
    }
  }, [fetchData, filters, pageIndex, pageSize, search, selectedDepartmentId]);

  const actions = useMemo(
    () => [
      {
        name: "Detail",
        icon: "heroicons-outline:eye",
        className: "!h-8 !w-8 !rounded-lg",
        onClick: (row) => handleDetail(row.row.original),
      },
      {
        name: "Lanjut",
        icon: "heroicons-outline:arrow-right-circle",
        className: "!h-8 !w-8 !rounded-lg",
        onClick: (row) => handleDecision(row.row.original, "approved"),
      },
      {
        name: "Tolak",
        icon: "heroicons-outline:x-circle",
        className: "!h-8 !w-8 !rounded-lg",
        onClick: (row) => handleDecision(row.row.original, "rejected"),
      },
    ],
    [handleDecision, handleDetail],
  );

  const columns = useMemo(() => [
    {
      Header: "Nama",
      accessor: "name",
      Cell: (row) => (
        <CenterCell>
          <div className="min-w-0 break-words font-semibold text-slate-900 dark:text-white">
            {displayText(row?.cell?.value)}
          </div>
        </CenterCell>
      ),
    },
    {
      Header: "Loker",
      accessor: "job_title",
      Cell: (row) => (
        <CenterCell>
          <span className="break-words text-slate-700 dark:text-slate-200">
            {displayText(row?.cell?.value)}
          </span>
        </CenterCell>
      ),
    },
    {
      Header: "Cabang",
      accessor: "branch_name",
      Cell: (row) => (
        <CenterCell>
          <RecruitmentBadge className="bg-cyan-50 text-cyan-700 ring-cyan-100 dark:bg-cyan-500/10 dark:text-cyan-200 dark:ring-cyan-500/20">
            {displayText(row?.cell?.value)}
          </RecruitmentBadge>
        </CenterCell>
      ),
    },
    {
      Header: "Gender",
      accessor: "gender_display",
      Cell: (row) => (
        <CenterCell>
          <RecruitmentBadge
            className={getGenderBadgeClass(row?.row?.original?.gender)}
          >
            {displayText(row?.cell?.value)}
          </RecruitmentBadge>
        </CenterCell>
      ),
    },
    {
      Header: "Pendidikan",
      accessor: "education_level_display",
      Cell: (row) => (
        <CenterCell>
          <RecruitmentBadge className="bg-violet-50 text-violet-700 ring-violet-100 dark:bg-violet-500/10 dark:text-violet-200 dark:ring-violet-500/20">
            {displayText(row?.cell?.value)}
          </RecruitmentBadge>
        </CenterCell>
      ),
    },
    {
      Header: "Status Pekerjaan",
      accessor: "contract_system_display",
      Cell: (row) => (
        <CenterCell>
          <RecruitmentBadge className="bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-200 dark:ring-emerald-500/20">
            {displayText(getApplicationWorkStatusDisplay(row?.row?.original))}
          </RecruitmentBadge>
        </CenterCell>
      ),
    },
    {
      Header: "Tahap",
      accessor: "stages",
      Cell: (row) => {
        const application = row?.row?.original || {};
        const latestStage = getLatestApplicationStage(application);
        const statusDisplay = getApplicationStageStatusDisplay(
          application,
          latestStage,
        );
        const stageBadge = getStageBadgeMeta(statusDisplay);

        return (
          <CenterCell>
            <RecruitmentBadge
              className={stageBadge.className}
              icon={stageBadge.icon}
            >
              {displayText(statusDisplay, "Belum diproses")}
            </RecruitmentBadge>
          </CenterCell>
        );
      },
    },
    {
      Header: "action",
      accessor: "action",
      id: "action",
      sticky: "right",
      Cell: (row) => {
        const latestStage = getLatestApplicationStage(row?.row?.original);
        const rowActions = isRejectedStage(latestStage)
          ? [actions[0]]
          : [
              actions[0],
              latestStage
                ? actions[1]
                : {
                    ...actions[1],
                    name: "Mulai",
                    icon: "heroicons-outline:play-circle",
                  },
              actions[2],
            ];

        return (
          <div className="flex justify-center gap-1">
            {rowActions.map((action, index) => (
              <TableAction key={action.id || index} action={action} row={row} />
            ))}
          </div>
        );
      },
    },
  ], [actions]);

  const pageCount = Math.ceil((displayedListData?.count || 0) / pageSize);
  const isRecruitmentLoading = isLoading;
  const filterPanelClass = `${
    isFilterOpen ? "grid" : "hidden"
  } grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid xl:max-h-[calc(100dvh-210px)] xl:grid-cols-1 xl:overflow-y-auto xl:pr-1`;

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[276px_minmax(0,1fr)] 2xl:grid-cols-[288px_minmax(0,1fr)] xl:items-start">
      <Card bodyClass="p-0" className="overflow-hidden xl:sticky xl:top-5 xl:self-start">
        <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-700">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-900 dark:text-white">
                Filter
              </div>
              <div className="mt-0.5 text-[11px] font-medium text-slate-500">
                {selectedDepartmentId
                  ? `${activeFilterCount} filter tambahan`
                  : "Pilih department"}
              </div>
            </div>
            {selectedDepartmentId && activeFilterCount > 0 && (
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-primary-600 dark:text-slate-300 dark:hover:bg-slate-700"
                onClick={handleResetFilters}
                aria-label="Reset filter"
              >
                <Icon icon="heroicons-outline:arrow-path" width={16} />
              </button>
            )}
          </div>
        </div>

        <div className="space-y-3 px-4 py-4">
          <FilterSelect
            label="Department"
            placeholder={
              isInitialFilterLoading ? "Memuat department..." : "Pilih department"
            }
            value={selectedDepartmentId}
            required
            disabled={isInitialFilterLoading && !departmentOptions.length}
            options={departmentOptions}
            onChange={handleDepartmentChange}
          />

          <div className="flex items-center justify-between gap-3 rounded-md border border-slate-200 px-3 py-2 dark:border-slate-700 xl:hidden">
            <span className="text-xs font-semibold uppercase text-slate-500">
              {activeFilterCount ? `${activeFilterCount} filter aktif` : "Filter tambahan"}
            </span>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-primary-300 hover:text-primary-600 dark:border-slate-700 dark:text-slate-300"
              onClick={() => setIsFilterOpen((current) => !current)}
            >
              <Icon
                icon={isFilterOpen ? "heroicons-outline:chevron-up" : "heroicons-outline:adjustments-horizontal"}
                width={16}
              />
              {isFilterOpen ? "Tutup" : "Filter"}
            </button>
          </div>

          <div className={filterPanelClass}>
            <FilterSelect
              label="Loker"
              placeholder="Semua loker"
              value={filters.filter_job_id}
              disabled={!selectedDepartmentId}
              options={jobOptions}
              onChange={(event) =>
                handleSingleFilterChange("filter_job_id", event.target.value)
              }
            />

            <FilterSelect
              label="Cabang"
              placeholder="Semua cabang"
              value={filters.filter_branch_id}
              disabled={!selectedDepartmentId}
              options={branchOptions}
              onChange={(event) =>
                handleSingleFilterChange("filter_branch_id", event.target.value)
              }
            />

            <FilterSelect
              label="Status Pekerjaan"
              placeholder="Semua status"
              value={filters.filter_is_working}
              disabled={!selectedDepartmentId}
              options={[
                { value: "true", label: "Sedang Bekerja" },
                { value: "false", label: "Tidak Bekerja" },
              ]}
              onChange={(event) =>
                handleSingleFilterChange("filter_is_working", event.target.value)
              }
            />

            <FilterSelect
              label="Tahapan"
              placeholder={isStageLoading ? "Memuat tahapan..." : "Semua tahapan"}
              value={filters.filter_stage_order}
              disabled={!selectedDepartmentId || isStageLoading}
              options={stageOptions}
              onChange={(event) =>
                handleSingleFilterChange("filter_stage_order", event.target.value)
              }
            />

            {filterConfig.map((group) => (
              <FilterCheckboxGroup
                key={group.key}
                group={group}
                values={filters}
                disabled={!selectedDepartmentId}
                onToggle={handleFilterToggle}
              />
            ))}

            <div className="sm:col-span-2 lg:col-span-3 xl:col-span-1">
              <Button
                text="Reset Filter"
                type="button"
                className="w-full bg-slate-100 text-slate-700"
                icon="heroicons-outline:arrow-path"
                onClick={handleResetFilters}
                disabled={!selectedDepartmentId || !activeFilterCount}
              />
            </div>
          </div>
        </div>
      </Card>

      <Card title="Rekruitmen" bodyClass="p-4">
        <div className="mb-3 max-w-xl">
          <Search
            searchValue={search}
            handleSearch={handleSearch}
            isLoading={isRecruitmentLoading}
            disabled={!selectedDepartmentId || isProcessing}
            placeholder="Cari pelamar"
            align="left"
          />
        </div>

        {!selectedDepartmentId ? (
          <div className="rounded border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700">
            Pilih department terlebih dahulu untuk menampilkan list pelamar.
          </div>
        ) : isRecruitmentLoading ? (
          <TableLoading />
        ) : (
          <>
            <Table
              tableId="rekruitmen"
              listData={displayedListData}
              listColumn={columns}
              searchValue={search}
              handleSearch={handleSearch}
              density="tight"
              showDensityControl={false}
              allowHorizontalScroll={false}
              actionColumnClassName="w-28 min-w-[7rem]"
            />
            <PaginationComponent
              pageSize={pageSize}
              pageIndex={pageIndex}
              pageCount={pageCount}
              canPreviousPage={pageIndex > 0}
              canNextPage={pageIndex < pageCount - 1}
              gotoPage={handlePageChange}
              previousPage={() => handlePageChange(pageIndex - 1)}
              nextPage={() => handlePageChange(pageIndex + 1)}
              setPageSize={handlePageSizeChange}
            />
          </>
        )}
      </Card>
    </div>
  );
};

export default Rekruitmen;
