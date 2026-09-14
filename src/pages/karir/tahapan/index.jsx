import React, { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import Modal from "@/components/ui/Modal";
import Tooltip from "@/components/ui/Tooltip";
import Table from "@/components/globals/table/table";
import PaginationComponent from "@/components/globals/table/pagination";
import SkeletionTable from "@/components/skeleton/Table";
import CareerErrorState from "@/pages/karir/components/CareerErrorState";
import getErrorMessage from "@/utils/careerErrorMessage";
import "./tahapan.css";
import {
  addCareerStage,
  deleteCareerStage,
  editCareerStage,
  getBranches,
  getCareerApplications,
  getCareerJobs,
  getCareerStages,
  getDepartments,
  processCareerApplicationStage,
  saveCareerApplicationStageCustomData,
} from "@/axios/career/jobs";

const emptyStageForm = {
  name: "",
  stage_order: "",
  description: "",
  custom_fields: [],
};

const emptyProcessForm = {
  action: "next",
  notes: "",
};

const customFieldTypes = [
  { value: "text", label: "Teks" },
  { value: "date", label: "Tanggal" },
  { value: "time", label: "Jam" },
];

const createCustomFieldDraft = (field = {}) => ({
  _localId:
    field._localId ||
    `field-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  key: field.key || "",
  label: field.label || "",
  type: field.type || "text",
  required: Boolean(field.required),
});

const createCustomFieldDrafts = (fields) =>
  (Array.isArray(fields) ? fields : []).map(createCustomFieldDraft);

const normalizeCustomFields = (fields) =>
  (Array.isArray(fields) ? fields : [])
    .map((field) => ({
      key: String(field?.key || "").trim(),
      label: String(field?.label || "").trim(),
      type: field?.type || "text",
      required: Boolean(field?.required),
    }))
    .filter((field) => field.key && field.label);

const getStageCustomValues = (stage) =>
  stage?.custom_field_values || stage?.custom_fields_values || stage?.custom_data || {};

const getPaginatedResults = (payload) => {
  if (Array.isArray(payload)) {
    return { count: payload.length, results: payload };
  }

  if (Array.isArray(payload?.results)) {
    return { count: payload.count ?? payload.results.length, results: payload.results };
  }

  if (Array.isArray(payload?.data)) {
    return { count: payload.count ?? payload.data.length, results: payload.data };
  }

  return { count: 0, results: [] };
};

const normalizeValue = (value) => String(value || "").trim().toLowerCase();

const toBoolean = (value) =>
  value === true ||
  value === 1 ||
  ["true", "1", "yes"].includes(normalizeValue(value));

const getWhatsappHref = (phoneNumber) => {
  const digits = String(phoneNumber || "").replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  if (digits.startsWith("0")) {
    return `https://wa.me/62${digits.slice(1)}`;
  }

  return `https://wa.me/${digits}`;
};

const openNativePicker = (input) => {
  try {
    input?.showPicker?.();
  } catch {
    // Some browsers only allow showPicker from a direct user gesture.
  }
};

const normalizeDepartments = (payload) => {
  const { results } = getPaginatedResults(payload);

  return results
    .map((department) => ({
      value: department.department_id,
      label: department.name,
    }));
};

const optionFromBranch = (branch) => ({
  value: branch.branch_id || branch.id,
  label: branch.name || branch.branch_name,
});

const optionFromJob = (job) => ({
  value: job.job_id || job.id,
  label: job.title,
  department:
    typeof job.department === "object"
      ? job.department.department_id || job.department.id
      : job.department,
  departmentName: job.department_name || job.department?.name,
});

const normalizeOptions = (payload, mapper) => {
  const { results } = getPaginatedResults(payload);
  return results.map(mapper).filter((option) => option.value && option.label);
};

const mergeOptions = (baseOptions, dynamicOptions) => {
  const seen = new Set();
  return [...baseOptions, ...dynamicOptions].filter((option) => {
    const key = normalizeValue(option.value);
    if (!key || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
};

const optionFromDisplayFields = (items, valueKey, labelKey) => {
  const seen = new Set();

  return items
    .map((item) => ({
      value: item[valueKey],
      label: item[labelKey] || item[valueKey],
    }))
    .filter((option) => {
      const key = normalizeValue(option.value);
      if (!key || seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
};

const matchesOption = (selectedValue, currentValue, currentLabel, selectedLabel) => {
  if (!selectedValue) {
    return true;
  }

  const selectedValueText = normalizeValue(selectedValue);
  const selectedLabelText = normalizeValue(selectedLabel);
  const currentValueText = normalizeValue(currentValue);
  const currentLabelText = normalizeValue(currentLabel);

  return (
    currentValueText === selectedValueText ||
    (!!selectedLabelText && currentLabelText === selectedLabelText)
  );
};

const matchesMultiOption = (selectedValues, currentValue) => {
  if (!selectedValues.length) {
    return true;
  }

  return selectedValues.map(normalizeValue).includes(normalizeValue(currentValue));
};

const normalizeStages = (payload) => {
  const { count, results } = getPaginatedResults(payload);
  const mappedResults = results.map((stage) => ({
      id: stage.stage_id,
      departmentId: stage.department,
      departmentName: stage.department_name || "-",
      stageOrder: stage.stage_order,
      name: stage.name || "-",
      description: stage.description || "-",
      customFields: normalizeCustomFields(stage.custom_fields),
      raw: stage,
    })).sort((a, b) => (a.stageOrder || 0) - (b.stageOrder || 0));
  return {
    count,
    results: mappedResults,
  };
};

const stageToneClass = {
  green: "border-emerald-100 bg-emerald-50 text-emerald-600 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300",
  blue: "border-sky-100 bg-sky-50 text-sky-600 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300",
  yellow: "border-warning-200 bg-warning-500/10 text-warning-600",
  orange: "border-orange-200 bg-orange-500/10 text-orange-600 dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-orange-300",
  red: "border-danger-200 bg-danger-500/10 text-danger-600",
  slate: "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-700 dark:text-slate-200",
  pink: "border-pink-100 bg-pink-50 text-pink-600 dark:border-pink-500/20 dark:bg-pink-500/10 dark:text-pink-300",
  purple: "border-violet-100 bg-violet-50 text-violet-600 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300",
  teal: "border-teal-100 bg-teal-50 text-teal-600 dark:border-teal-500/20 dark:bg-teal-500/10 dark:text-teal-300",
};

const genderOptions = [
  { value: "male", label: "Laki-laki" },
  { value: "female", label: "Perempuan" },
];

const maritalStatusOptions = [
  { value: "single", label: "Belum Menikah" },
  { value: "married", label: "Menikah" },
  { value: "divorced", label: "Cerai" },
  { value: "widowed", label: "Duda/Janda" },
];

const religionOptions = [
  { value: "islam", label: "Islam" },
  { value: "kristen", label: "Kristen" },
  { value: "katolik", label: "Katolik" },
  { value: "hindu", label: "Hindu" },
  { value: "buddha", label: "Buddha" },
  { value: "konghucu", label: "Konghucu" },
];

const educationLevelOptions = [
  { value: "sma", label: "SMA" },
  { value: "smk", label: "SMK" },
  { value: "d1", label: "D1" },
  { value: "d2", label: "D2" },
  { value: "d3", label: "D3" },
  { value: "d4", label: "D4" },
  { value: "s1", label: "S1" },
  { value: "s2", label: "S2" },
  { value: "s3", label: "S3" },
];

const educationStatusOptions = [
  { value: "student", label: "Mahasiswa" },
  { value: "graduated", label: "Lulusan" },
];

const contractSystemOptions = [
  { value: "fulltime", label: "Full Time" },
  { value: "full_time", label: "Full Time" },
  { value: "part_time", label: "Part Time" },
  { value: "freelance", label: "Freelance" },
  { value: "hybrid", label: "Hybrid" },
  { value: "internship", label: "Internship" },
];

const applicationStatusOptions = [
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "Dalam Proses" },
  { value: "accepted", label: "Lulus" },
  { value: "rejected", label: "Tidak Lulus" },
];

const coachExperienceOptions = [
  { value: "no_experience", label: "0 Tahun" },
  { value: "less_than_1_year", label: "< 1 Tahun" },
  { value: "1_year", label: "1 Tahun" },
  { value: "2_years", label: "2 Tahun" },
  { value: "more_than_3_years", label: "> 3 Tahun" },
];

const sourceOptions = [
  { value: "instagram", label: "Instagram" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "website", label: "Website" },
  { value: "referral", label: "Referral" },
  { value: "jobstreet", label: "Jobstreet" },
  { value: "other", label: "Lainnya" },
];

const workingOptions = [
  { value: "true", label: "Ya" },
  { value: "false", label: "Tidak" },
];

const getStageTone = (status) => {
  const value = normalizeValue(status);

  if (["passed", "accepted", "approved", "hired"].includes(value)) {
    return "green";
  }

  if (["rejected", "failed", "not_passed", "declined"].includes(value)) {
    return "red";
  }

  if (["in_progress", "progress"].includes(value)) {
    return "yellow";
  }

  if (value === "pending") {
    return "orange";
  }

  return "slate";
};

const getStageIcon = (status) => {
  const value = normalizeValue(status);

  if (["passed", "accepted", "approved", "hired"].includes(value)) {
    return "heroicons-outline:check-circle";
  }

  if (["rejected", "failed", "not_passed", "declined"].includes(value)) {
    return "heroicons-outline:x-circle";
  }

  if (["pending", "in_progress", "progress"].includes(value)) {
    return "heroicons-outline:clock";
  }

  return "heroicons-outline:minus-circle";
};

const genderTone = (gender) => {
  const value = normalizeValue(gender);

  if (value === "female" || value === "perempuan") {
    return "pink";
  }

  if (value === "male" || value === "laki-laki" || value === "laki laki") {
    return "blue";
  }

  return "slate";
};

const contractSystemTone = (contractSystem) => {
  const value = normalizeValue(contractSystem).replace(/[\s-]+/g, "_");

  if (value === "fulltime" || value === "full_time") {
    return "green";
  }

  if (value === "hybrid") {
    return "purple";
  }

  if (value === "freelance") {
    return "orange";
  }

  if (value === "part_time") {
    return "teal";
  }

  if (value === "internship") {
    return "blue";
  }

  return "slate";
};

const Badge = ({ children, tone = "slate", icon }) => (
  <span
    className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${stageToneClass[tone]}`}
  >
    {icon ? <Icon icon={icon} width={14} /> : null}
    {children || "-"}
  </span>
);

const FilterSelect = ({ label, value, options, onChange }) => (
  <label className="block">
    <span className="mb-2 block text-sm font-semibold text-slate-600 dark:text-slate-300">
      {label}
    </span>
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-12 w-full rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </label>
);

const CheckboxGroup = ({ title, options, selectedValues, onChange }) => (
  <div className="border-t border-slate-100 pt-4 dark:border-slate-700">
    <h4 className="mb-3 text-xs font-bold uppercase text-slate-500 dark:text-slate-300">
      {title}
    </h4>
    <div className="space-y-3">
      {options.map((option) => {
        const checked = selectedValues.includes(option.value);

        return (
          <label
            key={option.value}
            className="flex cursor-pointer items-center gap-3 text-sm font-semibold text-slate-500 dark:text-slate-300"
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => onChange(option.value)}
              className="h-5 w-5 rounded border-slate-200 text-primary-500 focus:ring-primary-500 dark:border-slate-700"
            />
            <span>{option.label}</span>
          </label>
        );
      })}
    </div>
  </div>
);

const ActionTooltipButton = ({
  tooltip,
  icon,
  className,
  onClick,
}) => (
  <Tooltip
    content={tooltip}
    placement="top"
    theme="dark"
    animation="shift-away"
  >
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-md border text-xs font-bold shadow-sm transition ${className}`}
      aria-label={tooltip}
    >
      <Icon icon={icon} width={16} />
    </button>
  </Tooltip>
);

const isProcessStageStatus = (status) =>
  ["pending", "in_progress", "progress"].includes(normalizeValue(status));

const findApplicationStage = (application, stageId) =>
  (application.stages || []).find((stage) => {
    const currentStageId = stage.stage || stage.stage_id;
    return currentStageId === stageId;
  });

const matchesSearch = (search, application) => {
  if (!search) {
    return true;
  }

  const searchText = normalizeValue(search);
  return [
    application.name,
    application.nickname,
    application.email,
    application.phoneNumber,
    application.jobTitle,
    application.branchName,
    application.stageName,
  ].some((value) => normalizeValue(value).includes(searchText));
};

const isValidUrl = (value) => /^https?:\/\//i.test(String(value || ""));

const Tahapan = () => {
  const stageFormRef = useRef(null);
  const processFormRef = useRef(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [departmentId, setDepartmentId] = useState("");
  const [activeStageId, setActiveStageId] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [jobFilter, setJobFilter] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [contractSystemFilter, setContractSystemFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [workingFilter, setWorkingFilter] = useState("");
  const [genderFilter, setGenderFilter] = useState([]);
  const [maritalStatusFilter, setMaritalStatusFilter] = useState([]);
  const [religionFilter, setReligionFilter] = useState([]);
  const [educationLevelFilter, setEducationLevelFilter] = useState([]);
  const [educationStatusFilter, setEducationStatusFilter] = useState([]);
  const [coachExperienceFilter, setCoachExperienceFilter] = useState([]);
  const [sourceFilter, setSourceFilter] = useState([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false);
  const [isStageModalOpen, setIsStageModalOpen] = useState(false);
  const [editingStage, setEditingStage] = useState(null);
  const [stageForm, setStageForm] = useState(emptyStageForm);
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [processingApplication, setProcessingApplication] = useState(null);
  const [processForm, setProcessForm] = useState(emptyProcessForm);
  const [isCustomDataModalOpen, setIsCustomDataModalOpen] = useState(false);
  const [customDataApplication, setCustomDataApplication] = useState(null);
  const [customDataDrafts, setCustomDataDrafts] = useState({});

  const resetToFirstPage = () => {
    setPageIndex(0);
  };

  const departmentsQuery = useQuery({
    queryKey: ["careerDepartments"],
    queryFn: async () => {
      const res = await getDepartments({
        page: 1,
        page_size: 100,
        ordering: "name",
      });
      return normalizeDepartments(res.data);
    },
  });

  const jobsOptionsQuery = useQuery({
    queryKey: ["careerJobsOptions"],
    queryFn: async () => {
      const res = await getCareerJobs({
        page: 1,
        page_size: 100,
        ordering: "title",
      });
      return normalizeOptions(res.data, optionFromJob);
    },
  });

  const branchesQuery = useQuery({
    queryKey: ["careerBranches"],
    queryFn: async () => {
      const res = await getBranches({
        page: 1,
        page_size: 100,
        ordering: "name",
      });
      return normalizeOptions(res.data, optionFromBranch);
    },
  });

  const stagesQuery = useQuery({
    queryKey: ["careerStages", { departmentId }],
    queryFn: async () => {
      const res = await getCareerStages(departmentId, {
        page: 1,
        page_size: 100,
        ordering: "stage_order",
      });
      return normalizeStages(res.data);
    },
    enabled: Boolean(departmentId),
  });

  const applicationsQuery = useQuery({
    queryKey: [
      "careerApplications",
      "stagePipeline",
      {
        departmentId,
        searchQuery,
        jobFilter,
        branchFilter,
        contractSystemFilter,
        statusFilter,
        workingFilter,
        genderFilter,
        maritalStatusFilter,
        religionFilter,
        educationLevelFilter,
        educationStatusFilter,
        coachExperienceFilter,
        sourceFilter,
      },
    ],
    queryFn: async () => {
      const allResults = [];
      let page = 1;
      let hasNext = true;

      while (hasNext && page <= 20) {
        const params = {
          page,
          page_size: 100,
          filter_department_id: departmentId,
        };

        if (searchQuery) params.search = searchQuery;
        if (jobFilter) params.filter_job_id = jobFilter;
        if (branchFilter) params.filter_branch_id = branchFilter;
        if (contractSystemFilter) params.filter_contract_system = contractSystemFilter;
        if (statusFilter) params.filter_status = statusFilter;
        if (workingFilter) params.filter_is_working = workingFilter;
        if (genderFilter.length) params.filter_gender = genderFilter.join(",");
        if (maritalStatusFilter.length) params.filter_marital_status = maritalStatusFilter.join(",");
        if (religionFilter.length) params.filter_religion = religionFilter.join(",");
        if (educationLevelFilter.length) params.filter_education_level = educationLevelFilter.join(",");
        if (educationStatusFilter.length) params.filter_education_status = educationStatusFilter.join(",");
        if (coachExperienceFilter.length) params.filter_coach_experience = coachExperienceFilter.join(",");
        if (sourceFilter.length) params.filter_source = sourceFilter.join(",");

        const res = await getCareerApplications(params);
        const payload = getPaginatedResults(res.data);

        allResults.push(...payload.results);
        hasNext = Boolean(res.data?.next);
        page += 1;
      }

      return {
        count: allResults.length,
        results: allResults,
      };
    },
    enabled: Boolean(departmentId && activeStageId),
    keepPreviousData: true,
  });

  const departmentOptions = departmentsQuery.data ?? [];
  const jobOptions = jobsOptionsQuery.data ?? [];
  const branchOptions = branchesQuery.data ?? [];

  const filteredJobOptions = useMemo(() => {
    if (!departmentId) {
      return jobOptions;
    }

    const selectedDepartmentOption = departmentOptions.find(
      (option) => option.value === departmentId
    );

    return jobOptions.filter((job) =>
      matchesOption(
        departmentId,
        job.department,
        job.departmentName,
        selectedDepartmentOption?.label
      )
    );
  }, [departmentId, departmentOptions, jobOptions]);

  const selectedDepartment = departmentOptions.find(
    (department) => department.value === departmentId
  );
  const stages = stagesQuery.data?.results ?? [];
  const activeStage = stages.find((stage) => stage.id === activeStageId);
  const normalizedActiveStageName = normalizeValue(activeStage?.name).replace(
    /[_-]+/g,
    " "
  );
  const showDocumentColumn =
    Number(activeStage?.stageOrder) === 1 || normalizedActiveStageName === "cek cv";

  useEffect(() => {
    if (!departmentId || !stages.length) {
      return;
    }

    if (!activeStageId || !stages.some((stage) => stage.id === activeStageId)) {
      setActiveStageId(stages[0].id);
    }
  }, [activeStageId, departmentId, stages]);

  const mappedApplications = useMemo(() => {
    const payload = applicationsQuery.data ?? { count: 0, results: [] };

    return payload.results.map((application) => {
      const currentStage = findApplicationStage(application, activeStageId);

      return {
        id: application.application_id,
        jobId: application.job,
        jobTitle: application.job_title || "-",
        departmentId: application.department,
        departmentName: application.department_name || "-",
        branchId: application.branch,
        branchName: application.branch_name || "-",
        name: application.name || "-",
        nickname: application.nickname || "",
        email: application.email || "-",
        phoneNumber: application.phone_number || "-",
        whatsappLink: application.whatsapp_link,
        gender: application.gender,
        genderDisplay: application.gender_display || application.gender || "-",
        maritalStatus: application.marital_status,
        maritalStatusDisplay:
          application.marital_status_display || application.marital_status || "-",
        religion: application.religion,
        religionDisplay:
          application.religion_display || application.religion || "-",
        educationLevel: application.education_level,
        educationLevelDisplay:
          application.education_level_display || application.education_level || "-",
        educationStatus: application.education_status,
        educationStatusDisplay:
          application.education_status_display || application.education_status || "-",
        contractSystem: application.contract_system,
        contractSystemDisplay:
          application.contract_system_display || application.contract_system || "-",
        coachExperience: application.coach_experience,
        coachExperienceDisplay:
          application.coach_experience_display || application.coach_experience || "-",
        source: application.source,
        sourceDisplay: application.source_display || application.source || "-",
        isWorking: toBoolean(application.is_working),
        uploadCv: application.upload_cv,
        uploadSertificates: Array.isArray(application.upload_sertificates)
          ? application.upload_sertificates
          : [],
        applicationStatus: application.status,
        applicationStatusDisplay:
          application.status_display || application.status || "-",
        stageId: currentStage?.stage || currentStage?.stage_id,
        stageName: currentStage?.stage_name || activeStage?.name || "-",
        stageStatus: currentStage?.status || application.status,
        stageStatusDisplay:
          currentStage?.status_display || application.status_display || "-",
        notes: currentStage?.notes || "-",
        customFieldValues: getStageCustomValues(currentStage),
        raw: application,
      };
    });
  }, [activeStage?.name, activeStageId, applicationsQuery.data]);

  const applicantsByStage = useMemo(() => {
    const selectedJob = jobOptions.find((option) => option.value === jobFilter);
    const selectedBranch = branchOptions.find(
      (option) => option.value === branchFilter
    );

    const filteredResults = mappedApplications.filter((application) => {
      const currentStage = findApplicationStage(application.raw, activeStageId);
      return (
        currentStage &&
        isProcessStageStatus(currentStage.status) &&
        matchesSearch(searchQuery, application) &&
        matchesOption(
          jobFilter,
          application.jobId,
          application.jobTitle,
          selectedJob?.label
        ) &&
        matchesOption(
          branchFilter,
          application.branchId,
          application.branchName,
          selectedBranch?.label
        ) &&
        matchesOption(
          contractSystemFilter,
          application.contractSystem,
          application.contractSystemDisplay,
          contractSystemOptions.find((option) => option.value === contractSystemFilter)?.label
        ) &&
        matchesOption(
          statusFilter,
          application.applicationStatus,
          application.applicationStatusDisplay,
          applicationStatusOptions.find((option) => option.value === statusFilter)?.label
        ) &&
        matchesOption(
          workingFilter,
          application.isWorking,
          application.isWorking === true ? "Ya" : application.isWorking === false ? "Tidak" : "",
          workingOptions.find((option) => option.value === workingFilter)?.label
        ) &&
        matchesMultiOption(genderFilter, application.gender) &&
        matchesMultiOption(maritalStatusFilter, application.maritalStatus) &&
        matchesMultiOption(religionFilter, application.religion) &&
        matchesMultiOption(educationLevelFilter, application.educationLevel) &&
        matchesMultiOption(educationStatusFilter, application.educationStatus) &&
        matchesMultiOption(coachExperienceFilter, application.coachExperience) &&
        matchesMultiOption(sourceFilter, application.source)
      );
    });

    return {
      count: filteredResults.length,
      results: filteredResults,
    };
  }, [
    activeStageId,
    branchFilter,
    branchOptions,
    coachExperienceFilter,
    contractSystemFilter,
    educationLevelFilter,
    educationStatusFilter,
    genderFilter,
    jobFilter,
    jobOptions,
    mappedApplications,
    maritalStatusFilter,
    religionFilter,
    searchQuery,
    sourceFilter,
    statusFilter,
    workingFilter,
  ]);

  const stageCounts = useMemo(() => {
    const counts = {};

    mappedApplications.forEach((application) => {
      (application.raw.stages || []).forEach((stage) => {
        const currentStageId = stage.stage || stage.stage_id;

        if (currentStageId && isProcessStageStatus(stage.status)) {
          counts[currentStageId] = (counts[currentStageId] || 0) + 1;
        }
      });
    });

    return counts;
  }, [mappedApplications]);

  const dynamicOptions = useMemo(
    () => ({
      contractSystems: optionFromDisplayFields(
        mappedApplications,
        "contractSystem",
        "contractSystemDisplay"
      ),
      statuses: optionFromDisplayFields(
        mappedApplications,
        "applicationStatus",
        "applicationStatusDisplay"
      ),
      coachExperiences: optionFromDisplayFields(
        mappedApplications,
        "coachExperience",
        "coachExperienceDisplay"
      ),
      sources: optionFromDisplayFields(mappedApplications, "source", "sourceDisplay"),
    }),
    [mappedApplications]
  );

  const activeFilterCount = [
    departmentId,
    jobFilter,
    branchFilter,
    contractSystemFilter,
    statusFilter,
    workingFilter,
    ...genderFilter,
    ...maritalStatusFilter,
    ...religionFilter,
    ...educationLevelFilter,
    ...educationStatusFilter,
    ...coachExperienceFilter,
    ...sourceFilter,
  ].filter(Boolean).length;

  const selectOptions = {
    departments: [{ value: "", label: "Pilih department" }, ...departmentOptions],
    jobs: [{ value: "", label: "Semua loker" }, ...filteredJobOptions],
    branches: [{ value: "", label: "Semua cabang" }, ...branchOptions],
    contractSystems: [
      { value: "", label: "Semua status" },
      ...mergeOptions(contractSystemOptions, dynamicOptions.contractSystems),
    ],
    statuses: [
      { value: "", label: "Semua status" },
      ...mergeOptions(applicationStatusOptions, dynamicOptions.statuses),
    ],
    working: [{ value: "", label: "Semua kondisi" }, ...workingOptions],
  };

  const pageCount = Math.max(1, Math.ceil((applicantsByStage.count || 0) / pageSize));
  const safePageIndex = Math.min(pageIndex, pageCount - 1);
  const pagedApplicants = useMemo(() => {
    const start = safePageIndex * pageSize;

    return {
      count: applicantsByStage.count,
      results: applicantsByStage.results.slice(start, start + pageSize),
    };
  }, [applicantsByStage, pageSize, safePageIndex]);

  const invalidatePipeline = () => {
    queryClient.invalidateQueries({ queryKey: ["careerApplications"] });
    queryClient.invalidateQueries({ queryKey: ["careerApplication"] });
  };

  const invalidateStages = () => {
    queryClient.invalidateQueries({ queryKey: ["careerStages"] });
  };

  const handleDepartmentChange = (value) => {
    setDepartmentId(value);
    setActiveStageId("");
    setJobFilter("");
    setSearchInput("");
    setSearchQuery("");
    resetToFirstPage();
  };

  const handleSearch = () => {
    setSearchQuery(searchInput);
    resetToFirstPage();
  };

  const handleFilterChange = (setter) => (value) => {
    setter(value);
    resetToFirstPage();
  };

  const toggleMultiFilter = (setter) => (value) => {
    setter((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value]
    );
    resetToFirstPage();
  };

  const handleResetFilter = () => {
    setDepartmentId("");
    setActiveStageId("");
    setSearchInput("");
    setSearchQuery("");
    setJobFilter("");
    setBranchFilter("");
    setContractSystemFilter("");
    setStatusFilter("");
    setWorkingFilter("");
    setGenderFilter([]);
    setMaritalStatusFilter([]);
    setReligionFilter([]);
    setEducationLevelFilter([]);
    setEducationStatusFilter([]);
    setCoachExperienceFilter([]);
    setSourceFilter([]);
    resetToFirstPage();
  };

  const closeStageModal = () => {
    setIsStageModalOpen(false);
    setEditingStage(null);
    setStageForm(emptyStageForm);
  };

  const openCreateStageModal = () => {
    if (!departmentId) {
      Swal.fire("Pilih department", "Pilih department terlebih dahulu.", "info");
      return;
    }

    setEditingStage(null);
    setStageForm({
      ...emptyStageForm,
      stage_order: String((stages.at(-1)?.stageOrder || 0) + 1),
      custom_fields: [],
    });
    setIsStageModalOpen(true);
  };

  const openEditStageModal = (stage) => {
    if (!stage) {
      Swal.fire("Pilih tahapan", "Pilih tahapan yang ingin diedit.", "info");
      return;
    }

    setEditingStage(stage);
    setStageForm({
      name: stage.name === "-" ? "" : stage.name,
      stage_order: stage.stageOrder ?? "",
      description: stage.description === "-" ? "" : stage.description,
      custom_fields: createCustomFieldDrafts(stage.customFields),
    });
    setIsStageModalOpen(true);
  };

  const handleDeleteStage = (stage) => {
    if (!stage) {
      Swal.fire("Pilih tahapan", "Pilih tahapan yang ingin dihapus.", "info");
      return;
    }

    Swal.fire({
      title: "Yakin hapus tahapan?",
      text: "Aksi ini tidak bisa dibatalkan.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#22c55e",
      cancelButtonColor: "#ef4444",
      confirmButtonText: "Ya, hapus",
      cancelButtonText: "Batal",
    }).then((result) => {
      if (result.isConfirmed) {
        deleteStageMutation.mutate(stage.id);
      }
    });
  };

  const addStageMutation = useMutation({
    mutationFn: (data) => addCareerStage(departmentId, data),
    onSuccess: () => {
      closeStageModal();
      invalidateStages();
      Swal.fire("Berhasil", "Tahapan berhasil ditambahkan.", "success");
    },
    onError: (error) => {
      Swal.fire(
        "Gagal",
        getErrorMessage(error, "Tahapan gagal ditambahkan."),
        "error"
      );
    },
  });

  const editStageMutation = useMutation({
    mutationFn: ({ stageId, data }) => editCareerStage(departmentId, stageId, data),
    onSuccess: () => {
      closeStageModal();
      invalidateStages();
      Swal.fire("Berhasil", "Tahapan berhasil diperbarui.", "success");
    },
    onError: (error) => {
      Swal.fire(
        "Gagal",
        getErrorMessage(error, "Tahapan gagal diperbarui."),
        "error"
      );
    },
  });

  const deleteStageMutation = useMutation({
    mutationFn: (stageId) => deleteCareerStage(departmentId, stageId),
    onSuccess: () => {
      setActiveStageId("");
      invalidateStages();
      Swal.fire("Berhasil", "Tahapan berhasil dihapus.", "success");
    },
    onError: (error) => {
      Swal.fire(
        "Gagal",
        getErrorMessage(error, "Tahapan gagal dihapus."),
        "error"
      );
    },
  });

  const processApplicationMutation = useMutation({
    mutationFn: async ({ application, action, notes }) => {
      const payload = {
        stage_id: activeStageId,
        status:
          action === "reject"
            ? "failed"
            : action === "skip"
            ? "skipped"
            : "passed",
        notes: notes.trim(),
      };

      return processCareerApplicationStage(application.id, payload);
    },
    onSuccess: () => {
      closeProcessModal();
      invalidatePipeline();
      Swal.fire("Berhasil", "Tahapan pelamar berhasil diproses.", "success");
    },
    onError: (error) => {
      Swal.fire(
        "Gagal",
        getErrorMessage(error, "Tahapan pelamar gagal diproses."),
        "error"
      );
    },
  });

  const customDataMutation = useMutation({
    mutationFn: ({ applicationId, stageId, customData }) =>
      saveCareerApplicationStageCustomData(applicationId, stageId, customData),
    onSuccess: (_, variables) => {
      setCustomDataDrafts((current) => {
        const next = { ...current };
        variables.draftKeys?.forEach((draftKey) => {
          delete next[draftKey];
        });
        return next;
      });
      closeCustomDataModal();
      invalidatePipeline();
    },
    onError: (error) => {
      Swal.fire(
        "Gagal",
        getErrorMessage(error, "Data tahapan gagal disimpan."),
        "error"
      );
    },
  });

  const getCustomDataDraftKey = (applicationId, fieldKey) =>
    `${applicationId}:${activeStageId}:${fieldKey}`;

  const openCustomDataModal = (application) => {
    setCustomDataApplication(application);
    setIsCustomDataModalOpen(true);
  };

  const closeCustomDataModal = () => {
    setIsCustomDataModalOpen(false);
    setCustomDataApplication(null);
  };

  const handleCustomDataChange = (application, field, value) => {
    const draftKey = getCustomDataDraftKey(application.id, field.key);
    setCustomDataDrafts((current) => ({ ...current, [draftKey]: value }));
  };

  const handleSubmitCustomData = () => {
    if (!customDataApplication || !activeStage) {
      return;
    }

    const customData = { ...(customDataApplication.customFieldValues || {}) };
    const draftKeys = [];

    for (const field of activeStage.customFields || []) {
      const draftKey = getCustomDataDraftKey(customDataApplication.id, field.key);
      const hasDraft = Object.prototype.hasOwnProperty.call(
        customDataDrafts,
        draftKey
      );
      const value = hasDraft ? customDataDrafts[draftKey] : customData[field.key] || "";

      if (field.required && !String(value).trim()) {
        Swal.fire("Lengkapi data", `${field.label} wajib diisi.`, "info");
        return;
      }

      customData[field.key] = value;
      draftKeys.push(draftKey);
    }

    customDataMutation.mutate({
      applicationId: customDataApplication.id,
      stageId: activeStageId,
      customData,
      draftKeys,
    });
  };

  const isStageMutating =
    addStageMutation.isPending ||
    editStageMutation.isPending ||
    deleteStageMutation.isPending;

  const updateStageForm = (field, value) => {
    setStageForm((current) => ({ ...current, [field]: value }));
  };

  const addStageCustomField = () => {
    setStageForm((current) => ({
      ...current,
      custom_fields: [...current.custom_fields, createCustomFieldDraft()],
    }));
  };

  const updateStageCustomField = (index, updates) => {
    setStageForm((current) => ({
      ...current,
      custom_fields: current.custom_fields.map((field, itemIndex) =>
        itemIndex === index ? { ...field, ...updates } : field
      ),
    }));
  };

  const removeStageCustomField = (index) => {
    setStageForm((current) => ({
      ...current,
      custom_fields: current.custom_fields.filter(
        (_, itemIndex) => itemIndex !== index
      ),
    }));
  };

  const handleSubmitStage = (event) => {
    event.preventDefault();
    const payload = {
      name: stageForm.name.trim(),
      stage_order: Number(stageForm.stage_order),
      description: stageForm.description.trim(),
      custom_fields: normalizeCustomFields(stageForm.custom_fields),
    };

    if (editingStage) {
      editStageMutation.mutate({ stageId: editingStage.id, data: payload });
      return;
    }

    addStageMutation.mutate(payload);
  };

  const openProcessModal = (application, action) => {
    setProcessingApplication(application);
    setProcessForm({
      action,
      notes: application.notes === "-" ? "" : application.notes,
    });
    setIsProcessModalOpen(true);
  };

  const closeProcessModal = () => {
    setIsProcessModalOpen(false);
    setProcessingApplication(null);
    setProcessForm(emptyProcessForm);
  };

  const handleSubmitProcess = (event) => {
    event.preventDefault();

    if (!processingApplication) {
      return;
    }

    processApplicationMutation.mutate({
      application: processingApplication,
      action: processForm.action,
      notes: processForm.notes,
    });
  };

  const columns = useMemo(
    () => {
      const customFields = activeStage?.customFields || [];
      const customDataColumn = customFields.length
        ? [
            {
              Header: "Data Tahapan",
              accessor: "customFieldValues",
              width: 290,
              Cell: ({ row }) => {
                const filledFieldCount = customFields.filter((field) =>
                  String(row.original.customFieldValues?.[field.key] || "").trim()
                ).length;
                const hasCustomData = filledFieldCount > 0;
                const savedFields = customFields.filter((field) =>
                  String(row.original.customFieldValues?.[field.key] || "").trim()
                );

                return (
                  <div className="flex min-w-0 flex-col items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openCustomDataModal(row.original)}
                      title={hasCustomData ? "Edit data tahapan" : "Isi data tahapan"}
                      aria-label={hasCustomData ? "Edit data tahapan" : "Isi data tahapan"}
                      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-md border px-3 py-1.5 text-left transition focus:outline-none focus:ring-2 focus:ring-primary-500/20 ${
                        hasCustomData
                          ? "border-success-200 bg-success-50 text-success-700 hover:border-success-300 hover:bg-success-100 dark:border-success-500/30 dark:bg-success-500/10 dark:text-success-300 dark:hover:bg-success-500/20"
                          : "border-primary-200 bg-primary-50 text-primary-700 hover:border-primary-300 hover:bg-primary-100 dark:border-primary-500/30 dark:bg-primary-500/10 dark:text-primary-300 dark:hover:bg-primary-500/20"
                      }`}
                    >
                      <Icon
                        icon={hasCustomData ? "heroicons-outline:pencil-alt" : "heroicons-outline:plus"}
                        width={15}
                      />
                      <span>
                        <span className="block text-xs font-bold">
                          {hasCustomData ? "Edit Data" : "Isi Data"}
                        </span>
                        <span className="block text-[10px] font-semibold opacity-70">
                          {hasCustomData
                            ? `${filledFieldCount}/${customFields.length} field terisi`
                            : "Belum diisi"}
                        </span>
                      </span>
                    </button>
                    {savedFields.length ? (
                      <div className="w-full min-w-0 space-y-1 rounded-md bg-slate-50 px-2.5 py-2 text-left dark:bg-slate-800/70">
                        {savedFields.map((field) => {
                          const value = String(
                            row.original.customFieldValues[field.key]
                          );
                          const isLink = /^https?:\/\//i.test(value);

                          return (
                            <div key={field.key} className="min-w-0">
                              <p
                                className="truncate text-[9px] font-bold uppercase tracking-wide text-slate-400"
                                title={field.label}
                              >
                                {field.label}
                              </p>
                              {isLink ? (
                                <a
                                  href={value}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(event) => event.stopPropagation()}
                                  className="block max-w-full truncate text-[11px] font-semibold text-primary-600 hover:underline dark:text-primary-300"
                                  title={value}
                                >
                                  {value}
                                </a>
                              ) : (
                                <p
                                  className="break-words text-[11px] font-semibold text-slate-600 dark:text-slate-300"
                                  title={value}
                                >
                                  {value}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                );
              },
            },
          ]
        : [];
      const documentColumn = showDocumentColumn
        ? [
            {
              Header: "Cek CV",
              accessor: "documents",
              width: 170,
              Cell: ({ row }) => {
                const cvLink = row.original.uploadCv;
                const certificateLinks =
                  row.original.uploadSertificates.filter(isValidUrl);
                const hasCv = isValidUrl(cvLink);

                if (!hasCv && !certificateLinks.length) {
                  return (
                    <span className="text-sm font-semibold text-slate-400">
                      -
                    </span>
                  );
                }

                return (
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {hasCv && (
                      <a
                        href={cvLink}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(event) => event.stopPropagation()}
                        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-primary-100 bg-primary-50 px-3 text-xs font-bold text-primary-600 transition hover:border-primary-200 hover:bg-primary-100"
                        title="Lihat CV"
                      >
                        <Icon icon="heroicons-outline:document-text" width={15} />
                        CV
                      </a>
                    )}
                    {certificateLinks.map((link, index) => (
                      <a
                        key={`${link}-${index}`}
                        href={link}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(event) => event.stopPropagation()}
                        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-emerald-100 bg-emerald-50 px-3 text-xs font-bold text-emerald-600 transition hover:border-emerald-200 hover:bg-emerald-100"
                        title={`Lihat sertifikat ${index + 1}`}
                      >
                        <Icon icon="heroicons-outline:paper-clip" width={15} />
                        {certificateLinks.length > 1
                          ? `S${index + 1}`
                          : "Sertifikat"}
                      </a>
                    ))}
                  </div>
                );
              },
            },
          ]
        : [];

      return [
      {
        Header: "Nama",
        accessor: "name",
        width: 180,
        Cell: ({ row }) => (
          <div className="text-center">
            <p className="font-bold text-slate-700 dark:text-slate-200">
              {row.original.name}
            </p>
            {row.original.phoneNumber !== "-" ? (
              <a
                href={row.original.whatsappLink || getWhatsappHref(row.original.phoneNumber)}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-block text-xs font-semibold text-success-600 hover:underline"
                onClick={(event) => event.stopPropagation()}
              >
                {row.original.phoneNumber}
              </a>
            ) : (
              <p className="mt-1 text-xs font-semibold text-slate-400">-</p>
            )}
          </div>
        ),
      },
      ...documentColumn,
      ...customDataColumn,
      {
        Header: "Loker",
        accessor: "jobTitle",
        width: 160,
        Cell: ({ cell }) => (
          <span className="font-semibold text-slate-600 dark:text-slate-300">
            {cell.value}
          </span>
        ),
      },
      {
        Header: "Cabang",
        accessor: "branchName",
        width: 140,
        Cell: ({ cell }) => <Badge tone="blue">{cell.value}</Badge>,
      },
      {
        Header: "Gender",
        accessor: "genderDisplay",
        width: 120,
        Cell: ({ row }) => (
          <Badge tone={genderTone(row.original.gender)}>{row.original.genderDisplay}</Badge>
        ),
      },
      {
        Header: "Status Pekerjaan",
        accessor: "contractSystemDisplay",
        width: 160,
        Cell: ({ row }) => (
          <Badge tone={contractSystemTone(row.original.contractSystem)}>
            {row.original.contractSystemDisplay}
          </Badge>
        ),
      },
      {
        Header: "Status",
        accessor: "stageStatusDisplay",
        width: 150,
        Cell: ({ row }) => (
          <Badge
            tone={getStageTone(row.original.stageStatus)}
            icon={getStageIcon(row.original.stageStatus)}
          >
            {row.original.stageStatusDisplay}
          </Badge>
        ),
      },
      {
        Header: "Aksi",
        accessor: "action",
        id: "action",
        sticky: "right",
        Cell: ({ row }) => (
          <div className="flex items-center justify-center gap-2">
            <ActionTooltipButton
              icon="heroicons-outline:check-circle"
              tooltip="Lanjut"
              onClick={() => openProcessModal(row.original, "next")}
              className="border-success-100 bg-success-50 text-success-600 hover:border-success-200 hover:bg-success-100"
            />
            <ActionTooltipButton
              icon="heroicons-outline:x-circle"
              tooltip="Tolak"
              onClick={() => openProcessModal(row.original, "reject")}
              className="border-danger-100 bg-danger-50 text-danger-600 hover:border-danger-200 hover:bg-danger-100"
            />
            <ActionTooltipButton
              icon="heroicons-outline:eye"
              tooltip="Detail"
              onClick={() => navigate(`/karir/rekruitmen/${row.original.id}`)}
              className="border-slate-200 bg-slate-50 text-slate-600 hover:border-primary-200 hover:bg-primary-50 hover:text-primary-600"
            />
          </div>
        ),
      },
      ];
    },
    [
      activeStage?.customFields,
      activeStageId,
      customDataDrafts,
      navigate,
      showDocumentColumn,
    ]
  );
  const tahapanTableMinWidth = activeStage?.customFields?.length
    ? showDocumentColumn
      ? "1270px"
      : "1100px"
    : showDocumentColumn
    ? "1230px"
    : "1060px";

  return (
    <div className="career-stages-page min-w-0 space-y-5">
      <Card bodyClass="min-w-0 p-4 sm:p-5">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Filter Pelamar
              </h3>
              <p className="mt-1 text-sm font-semibold text-slate-400">
                {activeFilterCount
                  ? `${activeFilterCount} filter aktif`
                  : "Pilih department untuk melihat pipeline tahapan rekrutmen."}
              </p>
            </div>
            <div className="career-stages-filter-actions grid grid-cols-2 items-center gap-2 sm:flex sm:flex-wrap">
              <button
                type="button"
                onClick={() => setIsAdvancedFiltersOpen((current) => !current)}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 transition hover:border-primary-200 hover:text-primary-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                aria-expanded={isAdvancedFiltersOpen}
              >
                <Icon icon="heroicons-outline:adjustments" width={16} />
                {isAdvancedFiltersOpen ? "Sembunyikan Filter" : "Filter Lanjutan"}
              </button>
              <button
                type="button"
                onClick={handleResetFilter}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-slate-100 px-3 text-xs font-bold text-slate-600 transition hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200"
              >
                <Icon icon="heroicons-outline:arrow-path" width={16} />
                Reset
              </button>
            </div>
          </div>

          <div className="career-stages-filter-grid grid grid-cols-1 gap-3">
            <FilterSelect
              label="Department"
              value={departmentId}
              options={selectOptions.departments}
              onChange={handleDepartmentChange}
            />
            <FilterSelect
              label="Loker"
              value={jobFilter}
              options={selectOptions.jobs}
              onChange={handleFilterChange(setJobFilter)}
            />
            <FilterSelect
              label="Cabang"
              value={branchFilter}
              options={selectOptions.branches}
              onChange={handleFilterChange(setBranchFilter)}
            />
            <FilterSelect
              label="Status Pekerjaan"
              value={contractSystemFilter}
              options={selectOptions.contractSystems}
              onChange={handleFilterChange(setContractSystemFilter)}
            />
            <FilterSelect
              label="Status"
              value={statusFilter}
              options={selectOptions.statuses}
              onChange={handleFilterChange(setStatusFilter)}
            />
            <FilterSelect
              label="Sedang Bekerja"
              value={workingFilter}
              options={selectOptions.working}
              onChange={handleFilterChange(setWorkingFilter)}
            />
          </div>

          {isAdvancedFiltersOpen && (
            <div className="career-stages-advanced-grid grid grid-cols-1 gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
              <CheckboxGroup
                title="Gender"
                options={genderOptions}
                selectedValues={genderFilter}
                onChange={toggleMultiFilter(setGenderFilter)}
              />
              <CheckboxGroup
                title="Status Pernikahan"
                options={maritalStatusOptions}
                selectedValues={maritalStatusFilter}
                onChange={toggleMultiFilter(setMaritalStatusFilter)}
              />
              <CheckboxGroup
                title="Agama"
                options={religionOptions}
                selectedValues={religionFilter}
                onChange={toggleMultiFilter(setReligionFilter)}
              />
              <CheckboxGroup
                title="Pendidikan"
                options={educationLevelOptions}
                selectedValues={educationLevelFilter}
                onChange={toggleMultiFilter(setEducationLevelFilter)}
              />
              <CheckboxGroup
                title="Status Pendidikan"
                options={educationStatusOptions}
                selectedValues={educationStatusFilter}
                onChange={toggleMultiFilter(setEducationStatusFilter)}
              />
              <CheckboxGroup
                title="Pengalaman Coach"
                options={mergeOptions(coachExperienceOptions, dynamicOptions.coachExperiences)}
                selectedValues={coachExperienceFilter}
                onChange={toggleMultiFilter(setCoachExperienceFilter)}
              />
              <CheckboxGroup
                title="Sumber"
                options={mergeOptions(sourceOptions, dynamicOptions.sources)}
                selectedValues={sourceFilter}
                onChange={toggleMultiFilter(setSourceFilter)}
              />
            </div>
          )}
        </div>
      </Card>

      <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-[300px_minmax(0,1fr)]">
        <Card className="career-stages-menu-card min-w-0 overflow-hidden" bodyClass="p-0">
          <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-700">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Menu Tahapan
                </h3>
                <p className="mt-1 text-sm font-semibold text-slate-400">
                  {stages.length} stage
                </p>
              </div>
              <button
                type="button"
                onClick={openCreateStageModal}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-primary-500 text-white shadow-sm transition hover:bg-primary-600"
                title="Tambah tahapan"
              >
                <Icon icon="heroicons-outline:plus" width={18} />
              </button>
            </div>
          </div>

          <div className="career-stages-menu-list space-y-2 p-4">
            {!departmentId ? (
              <div className="rounded-md bg-slate-50 px-4 py-5 text-sm font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                Pilih department terlebih dahulu.
              </div>
            ) : stagesQuery.isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="h-11 animate-pulse rounded-md bg-slate-100 dark:bg-slate-800"
                  />
                ))}
              </div>
            ) : stages.length ? (
              stages.map((stage) => (
                <button
                  key={stage.id}
                  type="button"
                  onClick={() => {
                    setActiveStageId(stage.id);
                    resetToFirstPage();
                  }}
                  className={`career-stages-menu-item flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-sm font-semibold transition ${
                    activeStageId === stage.id
                      ? "bg-primary-500 text-white shadow-sm"
                      : "bg-slate-50 text-slate-600 hover:bg-primary-50 hover:text-primary-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-primary-500/10"
                  }`}
                >
                  <span
                    className={`inline-flex h-7 w-7 flex-none items-center justify-center rounded-full text-xs font-bold ${
                      activeStageId === stage.id
                        ? "bg-white/15 text-white"
                        : "bg-white text-primary-600 dark:bg-slate-900"
                    }`}
                  >
                    {stage.stageOrder}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{stage.name}</span>
                  <span
                    className={`inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full px-2 text-[11px] font-bold ${
                      activeStageId === stage.id
                        ? "bg-white/15 text-white"
                        : "bg-slate-100 text-slate-500 dark:bg-slate-900"
                    }`}
                  >
                    {stageCounts[stage.id] || 0}
                  </span>
                </button>
              ))
            ) : (
              <div className="rounded-md bg-slate-50 px-4 py-5 text-sm font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                Belum ada tahapan.
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 border-t border-slate-200 p-4 dark:border-slate-700">
            <button
              type="button"
              onClick={() => openEditStageModal(activeStage)}
              disabled={!activeStage}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-sky-100 bg-sky-50 text-xs font-bold text-sky-600 transition hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Icon icon="heroicons:pencil-square" width={16} />
              Edit
            </button>
            <button
              type="button"
              onClick={() => handleDeleteStage(activeStage)}
              disabled={!activeStage}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-danger-100 bg-danger-50 text-xs font-bold text-danger-600 transition hover:bg-danger-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Icon icon="heroicons-outline:trash" width={16} />
              Hapus
            </button>
          </div>
        </Card>

        <Card
          className="career-stages-applicants-card min-w-0 overflow-hidden"
          title={activeStage ? activeStage.name : "Tahapan"}
          bodyClass="p-4 sm:p-6"
          subtitle={
            activeStage?.description && activeStage.description !== "-"
              ? activeStage.description
              : undefined
          }
        >
          <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full min-w-0 max-w-xl flex-1">
              <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <Icon icon="heroicons-outline:search" width={20} />
              </div>
              <input
                type="search"
                value={searchInput}
                disabled={!departmentId || !activeStageId}
                onChange={(event) => setSearchInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    handleSearch();
                  }
                }}
                placeholder="Cari pelamar"
                className="h-12 w-full rounded-full border border-slate-200 bg-white pl-12 pr-28 text-sm font-semibold text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:disabled:bg-slate-800"
              />
              <button
                type="button"
                onClick={handleSearch}
                disabled={!departmentId || !activeStageId}
                className="absolute right-1.5 top-1/2 inline-flex h-9 -translate-y-1/2 items-center gap-2 rounded-full bg-primary-500 px-5 text-xs font-bold uppercase text-white shadow-sm transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Icon icon="heroicons-outline:search" width={16} />
                Cari
              </button>
            </div>

            <div className="rounded-md bg-slate-50 px-4 py-3 text-sm font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
              {applicantsByStage.count} pelamar di tahap ini
            </div>
          </div>

          {!stagesQuery.isError && !applicationsQuery.isError && (
            jobsOptionsQuery.isError || branchesQuery.isError
          ) && (
            <CareerErrorState
              compact
              className="mb-5"
              title="Sebagian filter belum tersedia"
              error={jobsOptionsQuery.error || branchesQuery.error}
              fallback="Pilihan loker atau cabang belum dapat dimuat."
              onRetry={() => Promise.allSettled([
                jobsOptionsQuery.refetch(),
                branchesQuery.refetch(),
              ])}
              isRetrying={jobsOptionsQuery.isFetching || branchesQuery.isFetching}
            />
          )}

          {departmentsQuery.isError ? (
            <CareerErrorState
              error={departmentsQuery.error}
              fallback="Pilihan departemen belum dapat dimuat. Silakan coba lagi."
              onRetry={() => departmentsQuery.refetch()}
              isRetrying={departmentsQuery.isFetching}
            />
          ) : !departmentId ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              Pilih department untuk melihat tahapan dan pelamar.
            </div>
          ) : stagesQuery.isLoading || applicationsQuery.isLoading ? (
            <SkeletionTable />
          ) : stagesQuery.isError ? (
            <CareerErrorState
              error={stagesQuery.error}
              fallback="Data tahapan belum dapat dimuat. Silakan coba lagi."
              onRetry={() => Promise.allSettled([
                stagesQuery.refetch(),
                applicationsQuery.refetch(),
              ])}
              isRetrying={stagesQuery.isFetching || applicationsQuery.isFetching}
            />
          ) : applicationsQuery.isError ? (
            <CareerErrorState
              error={applicationsQuery.error}
              fallback="Data pelamar belum dapat dimuat. Silakan coba lagi."
              onRetry={() => applicationsQuery.refetch()}
              isRetrying={applicationsQuery.isFetching}
            />
          ) : !activeStage ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              Belum ada tahapan untuk department ini.
            </div>
          ) : (
            <>
              <div className="space-y-3 md:hidden">
                {pagedApplicants.results.map((application) => {
                  const customFields = activeStage?.customFields || [];
                  const filledFieldCount = customFields.filter((field) =>
                    String(application.customFieldValues?.[field.key] || "").trim()
                  ).length;
                  const hasCustomData = filledFieldCount > 0;
                  const certificateLinks = application.uploadSertificates.filter(isValidUrl);
                  const hasCv = isValidUrl(application.uploadCv);

                  return (
                    <article
                      key={application.id}
                      className="career-stages-applicant rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900"
                    >
                      <div className="flex min-w-0 items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h4 className="break-words text-sm font-bold text-slate-800 dark:text-slate-100">
                            {application.name}
                          </h4>
                          {application.phoneNumber !== "-" ? (
                            <a
                              href={application.whatsappLink || getWhatsappHref(application.phoneNumber)}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-1 inline-flex min-h-8 items-center text-xs font-semibold text-success-600"
                            >
                              {application.phoneNumber}
                            </a>
                          ) : null}
                        </div>
                        <Badge
                          tone={getStageTone(application.stageStatus)}
                          icon={getStageIcon(application.stageStatus)}
                        >
                          {application.stageStatusDisplay}
                        </Badge>
                      </div>

                      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-3 border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
                        <div className="min-w-0">
                          <dt className="font-semibold text-slate-400">Loker</dt>
                          <dd className="mt-1 break-words font-bold text-slate-600 dark:text-slate-300">{application.jobTitle}</dd>
                        </div>
                        <div className="min-w-0">
                          <dt className="font-semibold text-slate-400">Cabang</dt>
                          <dd className="mt-1 break-words font-bold text-slate-600 dark:text-slate-300">{application.branchName}</dd>
                        </div>
                        <div className="min-w-0">
                          <dt className="font-semibold text-slate-400">Gender</dt>
                          <dd className="mt-1 font-bold text-slate-600 dark:text-slate-300">{application.genderDisplay}</dd>
                        </div>
                        <div className="min-w-0">
                          <dt className="font-semibold text-slate-400">Status pekerjaan</dt>
                          <dd className="mt-1 break-words font-bold text-slate-600 dark:text-slate-300">{application.contractSystemDisplay}</dd>
                        </div>
                      </dl>

                      {(showDocumentColumn || customFields.length > 0) && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {customFields.length > 0 && (
                            <button
                              type="button"
                              onClick={() => openCustomDataModal(application)}
                              className={`inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-md border px-3 text-xs font-bold ${hasCustomData ? "border-success-200 bg-success-50 text-success-700" : "border-primary-200 bg-primary-50 text-primary-700"}`}
                            >
                              <Icon icon={hasCustomData ? "heroicons-outline:pencil-alt" : "heroicons-outline:plus"} width={15} />
                              {hasCustomData ? `Data ${filledFieldCount}/${customFields.length}` : "Isi data"}
                            </button>
                          )}
                          {showDocumentColumn && hasCv && (
                            <a href={application.uploadCv} target="_blank" rel="noreferrer" className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-md border border-primary-100 bg-primary-50 px-3 text-xs font-bold text-primary-600">
                              <Icon icon="heroicons-outline:document-text" width={15} /> CV
                            </a>
                          )}
                          {showDocumentColumn && certificateLinks.map((link, index) => (
                            <a key={`${link}-${index}`} href={link} target="_blank" rel="noreferrer" className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-md border border-emerald-100 bg-emerald-50 px-3 text-xs font-bold text-emerald-600">
                              <Icon icon="heroicons-outline:paper-clip" width={15} />
                              {certificateLinks.length > 1 ? `Sertifikat ${index + 1}` : "Sertifikat"}
                            </a>
                          ))}
                        </div>
                      )}

                      <div className="mt-4 grid grid-cols-3 gap-2">
                        <button type="button" onClick={() => openProcessModal(application, "next")} className="inline-flex min-h-11 items-center justify-center gap-1 rounded-md border border-success-100 bg-success-50 px-2 text-xs font-bold text-success-600">
                          <Icon icon="heroicons-outline:check-circle" width={16} /> Lanjut
                        </button>
                        <button type="button" onClick={() => openProcessModal(application, "reject")} className="inline-flex min-h-11 items-center justify-center gap-1 rounded-md border border-danger-100 bg-danger-50 px-2 text-xs font-bold text-danger-600">
                          <Icon icon="heroicons-outline:x-circle" width={16} /> Tolak
                        </button>
                        <button type="button" onClick={() => navigate(`/karir/rekruitmen/${application.id}`)} className="inline-flex min-h-11 items-center justify-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 text-xs font-bold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          <Icon icon="heroicons-outline:eye" width={16} /> Detail
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>

              <div className="hidden min-w-0 md:block">
                <p className="career-stages-table-hint mb-3 text-xs font-semibold text-slate-400">
                  Geser tabel ke samping untuk melihat seluruh data pelamar.
                </p>
                <Table
                  tableId="karir-tahapan-pelamar-table"
                  listData={pagedApplicants}
                  listColumn={columns}
                  isAction
                  actionColumnClass="w-36 min-w-[9rem]"
                  bodyCellAlign="center"
                  tableMinWidth={tahapanTableMinWidth}
                />
              </div>

              {pagedApplicants.results.length === 0 && (
                <div className="rounded-b-lg border-x border-b border-slate-200 bg-white px-4 py-10 text-center text-sm font-medium text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                  Belum ada pelamar aktif di tahapan ini.
                </div>
              )}

              <PaginationComponent
                pageSize={pageSize}
                pageIndex={safePageIndex}
                pageCount={pageCount}
                canPreviousPage={safePageIndex > 0}
                canNextPage={safePageIndex < pageCount - 1}
                gotoPage={(page) => setPageIndex(page)}
                previousPage={() => setPageIndex((page) => Math.max(0, page - 1))}
                nextPage={() =>
                  setPageIndex((page) => Math.min(pageCount - 1, page + 1))
                }
                setPageSize={(size) => {
                  setPageSize(size);
                  resetToFirstPage();
                }}
              />
            </>
          )}
        </Card>
      </div>

      <Modal
        activeModal={isStageModalOpen}
        onClose={closeStageModal}
        title={editingStage ? "Edit Tahapan" : "Tambah Tahapan"}
        className="career-stages-modal max-w-2xl"
        centered
        footerContent={
          <>
            <Button
              text="Batal"
              className="btn-outline-secondary"
              onClick={closeStageModal}
              disabled={isStageMutating}
            />
            <Button
              text={editingStage ? "Simpan Perubahan" : "Tambah Tahapan"}
              className="btn-primary"
              onClick={() => stageFormRef.current?.requestSubmit()}
              isLoading={isStageMutating}
            />
          </>
        }
      >
        <form
          ref={stageFormRef}
          onSubmit={handleSubmitStage}
          className="grid grid-cols-1 gap-4"
        >
          <div className="rounded-md bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
            Department: {selectedDepartment?.label || "-"}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_160px]">
            <label className="block">
              <span className="form-label">Nama Tahapan</span>
              <input
                required
                value={stageForm.name}
                onChange={(event) => updateStageForm("name", event.target.value)}
                className="form-control h-11"
                placeholder="Contoh: Interview HR"
              />
            </label>

            <label className="block">
              <span className="form-label">Urutan</span>
              <input
                required
                min="1"
                type="number"
                value={stageForm.stage_order}
                onChange={(event) =>
                  updateStageForm("stage_order", event.target.value)
                }
                className="form-control h-11"
              />
            </label>
          </div>

          <label className="block">
            <span className="form-label">Deskripsi</span>
            <textarea
              required
              value={stageForm.description}
              onChange={(event) =>
                updateStageForm("description", event.target.value)
              }
              className="form-control min-h-[120px] py-3"
              placeholder="Tuliskan deskripsi tahapan."
            />
          </label>

          <div className="space-y-3 rounded-md border border-slate-200 p-4 dark:border-slate-700">
            <div className="career-stages-custom-header flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  Form tambahan stage
                </p>
                <p className="mt-1 text-xs font-medium text-slate-400">
                  Field ini akan muncul saat data pelamar diproses pada stage ini.
                </p>
              </div>
              <button
                type="button"
                onClick={addStageCustomField}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-primary-500 px-3 text-xs font-bold text-white hover:bg-primary-600"
              >
                <Icon icon="heroicons-outline:plus" width={16} />
                Tambah field
              </button>
            </div>

            {stageForm.custom_fields.length === 0 ? (
              <p className="rounded-md bg-slate-50 px-3 py-3 text-xs font-semibold text-slate-400 dark:bg-slate-800">
                Belum ada form tambahan.
              </p>
            ) : (
              stageForm.custom_fields.map((field, index) => (
                <div
                  key={field._localId}
                  className="grid grid-cols-1 gap-3 rounded-md bg-slate-50 p-3 md:grid-cols-[1fr_1fr_160px_auto] dark:bg-slate-800"
                >
                  <label>
                    <span className="form-label">Key</span>
                    <input
                      required
                      value={field.key}
                      onChange={(event) =>
                        updateStageCustomField(index, {
                          key: event.target.value,
                        })
                      }
                      className="form-control h-10"
                      placeholder="interview_date"
                    />
                  </label>
                  <label>
                    <span className="form-label">Label</span>
                    <input
                      required
                      value={field.label}
                      onChange={(event) =>
                        updateStageCustomField(index, {
                          label: event.target.value,
                        })
                      }
                      className="form-control h-10"
                      placeholder={
                        field.type === "date"
                          ? "Contoh: Tanggal Interview"
                          : field.type === "time"
                          ? "Contoh: Jam Interview"
                          : "Contoh: Link Zoom"
                      }
                    />
                  </label>
                  <label>
                    <span className="form-label">Tipe</span>
                    <select
                      value={field.type}
                      onChange={(event) =>
                        updateStageCustomField(index, {
                          type: event.target.value,
                        })
                      }
                      className="form-control h-10"
                    >
                      {customFieldTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="flex items-end gap-3 pb-1">
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(event) =>
                          updateStageCustomField(index, {
                            required: event.target.checked,
                          })
                        }
                      />
                      Wajib
                    </label>
                    <button
                      type="button"
                      onClick={() => removeStageCustomField(index)}
                      className="text-danger-500 hover:text-danger-600"
                      aria-label="Hapus field"
                    >
                      <Icon icon="heroicons-outline:trash" width={18} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </form>
      </Modal>

      <Modal
        activeModal={isCustomDataModalOpen}
        onClose={closeCustomDataModal}
        title="Data Tahapan"
        className="career-stages-modal max-w-3xl"
        centered
        footerContent={
          <Button
            text="Selesai"
            className="btn-primary"
            onClick={handleSubmitCustomData}
            isLoading={customDataMutation.isPending}
          />
        }
      >
        <div className="space-y-4">
          <div className="rounded-lg border border-primary-100 bg-primary-50 px-4 py-3 dark:border-primary-500/20 dark:bg-primary-500/10">
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
              {customDataApplication?.name || "-"}
            </p>
            <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-300">
              {activeStage?.name || "-"} - Lengkapi data tahap berikut.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-[repeat(auto-fit,minmax(240px,1fr))]">
            {activeStage?.customFields?.map((field) => {
              const isDateField = field.type === "date";
              const isTimeField = field.type === "time";
              const usesNativePicker = isDateField || isTimeField;
              const value = customDataApplication?.customFieldValues?.[field.key];
              const draftKey = customDataApplication
                ? getCustomDataDraftKey(customDataApplication.id, field.key)
                : "";
              const fieldValue = Object.prototype.hasOwnProperty.call(
                customDataDrafts,
                draftKey
              )
                ? customDataDrafts[draftKey]
                : value || "";

              return (
                <div
                  key={field.key}
                  className="block min-w-0 rounded-md border border-slate-100 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900"
                >
                  <span className="mb-2 flex min-w-0 flex-wrap items-start justify-between gap-x-3 gap-y-1 text-xs font-bold text-slate-600 dark:text-slate-300">
                    <span
                      className="min-w-0 max-w-full break-words leading-5"
                      title={field.label}
                    >
                      {field.label}
                      {field.required ? " *" : ""}
                    </span>
                    <span className="flex-none rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-400 dark:bg-slate-800">
                      {isDateField ? "Tanggal" : isTimeField ? "Jam" : "Teks"}
                    </span>
                  </span>
                  <div className="relative">
                    <input
                      type={isDateField ? "date" : isTimeField ? "time" : "text"}
                      value={fieldValue}
                      onChange={(event) =>
                        customDataApplication &&
                        handleCustomDataChange(
                          customDataApplication,
                          field,
                          event.target.value
                        )
                      }
                      onFocus={(event) => {
                        if (usesNativePicker) {
                          openNativePicker(event.currentTarget);
                        }
                      }}
                      onClick={(event) => {
                        if (usesNativePicker) {
                          openNativePicker(event.currentTarget);
                        }
                      }}
                      placeholder={`Masukkan ${field.label.toLowerCase()}`}
                      className={`form-control career-stage-custom-input h-11 w-full min-w-0 rounded-md text-sm [color-scheme:light] dark:[color-scheme:dark] ${
                        usesNativePicker ? "cursor-pointer pr-11" : ""
                      }`}
                      required={field.required}
                    />
                    {usesNativePicker ? (
                      <button
                        type="button"
                        onClick={(event) => {
                          const input = event.currentTarget
                            .previousElementSibling;
                          input?.focus();
                          openNativePicker(input);
                        }}
                        className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-primary-500 dark:hover:bg-slate-800"
                        aria-label={isTimeField ? "Pilih jam" : "Pilih tanggal"}
                      >
                        <Icon
                          icon={
                            isTimeField
                              ? "heroicons-outline:clock"
                              : "heroicons-outline:calendar"
                          }
                          width={17}
                        />
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Modal>

      <Modal
        activeModal={isProcessModalOpen}
        onClose={closeProcessModal}
        title={
          processForm.action === "reject"
            ? "Tolak Pelamar"
            : processForm.action === "skip"
            ? "Lewati Tahapan"
            : "Lanjut Tahap Selanjutnya"
        }
        className="career-stages-modal max-w-xl"
        centered
        footerContent={
          <>
            <Button
              text="Batal"
              className="btn-outline-secondary"
              onClick={closeProcessModal}
              disabled={processApplicationMutation.isPending}
            />
            <Button
              text={
                processForm.action === "reject"
                  ? "Tolak"
                  : processForm.action === "skip"
                  ? "Lewati"
                  : "Lanjutkan"
              }
              className={
                processForm.action === "reject"
                  ? "btn-danger"
                  : processForm.action === "skip"
                  ? "btn-warning"
                  : "btn-success"
              }
              onClick={() => processFormRef.current?.requestSubmit()}
              isLoading={processApplicationMutation.isPending}
            />
          </>
        }
      >
        <form
          ref={processFormRef}
          onSubmit={handleSubmitProcess}
          className="space-y-4"
        >
          <div className="rounded-md bg-slate-50 px-4 py-3 dark:bg-slate-800">
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
              {processingApplication?.name || "-"}
            </p>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              {activeStage?.name || "-"} - {processingApplication?.jobTitle || "-"}
            </p>
          </div>

          <label className="block">
            <span className="form-label">Catatan Tahapan</span>
            <textarea
              value={processForm.notes}
              onChange={(event) =>
                setProcessForm((current) => ({
                  ...current,
                  notes: event.target.value,
                }))
              }
              className="form-control min-h-[140px] py-3"
              placeholder="Tambahkan catatan untuk tahapan ini."
            />
          </label>
        </form>
      </Modal>
    </div>
  );
};

export default Tahapan;
