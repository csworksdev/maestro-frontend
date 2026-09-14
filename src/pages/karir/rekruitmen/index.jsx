import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import Table from "@/components/globals/table/table";
import TableAction from "@/components/globals/table/tableAction";
import PaginationComponent from "@/components/globals/table/pagination";
import SkeletionTable from "@/components/skeleton/Table";
import CareerErrorState from "@/pages/karir/components/CareerErrorState";
import getErrorMessage from "@/utils/careerErrorMessage";
import {
  getBranches,
  createCareerApplicationTrainersBulk,
  getCareerApplications,
  getCareerJobs,
  getDepartments,
  processCareerApplicationStage,
  startCareerApplications,
} from "@/axios/career/jobs";
import "./rekruitmen.css";

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

const getSafeFailureMessage = (message, fallback = "Tidak dapat diproses.") =>
  getErrorMessage({ response: { data: { message } } }, fallback);

const toBoolean = (value) =>
  value === true ||
  value === 1 ||
  ["true", "1", "yes"].includes(normalizeValue(value));

const isAcceptedApplication = (application) =>
  [application?.status, application?.statusDisplay].some((value) =>
    ["accepted", "diterima"].includes(normalizeValue(value))
  );

const isTrainerApplication = (application) =>
  isAcceptedApplication(application) && application?.isTrainer === true;

const isRejectedApplication = (application) =>
  [application?.status, application?.statusDisplay].some((value) =>
    ["rejected", "ditolak", "failed", "not_passed", "declined"].includes(
      normalizeValue(value)
    )
  );

const isRejectableApplication = (application) =>
  !isAcceptedApplication(application) && !isRejectedApplication(application);

const getWhatsappHref = (phoneNumber) => {
  const digits = String(phoneNumber || "").replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  if (digits.startsWith("0")) {
    return `https://wa.me/62${digits.slice(1)}`;
  }

  if (digits.startsWith("62")) {
    return `https://wa.me/${digits}`;
  }

  return `https://wa.me/${digits}`;
};

const optionFromDepartment = (department) => ({
  value: department.department_id,
  label: department.name,
});

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

const matchesAnyOption = (selectedValue, options) => {
  if (!selectedValue) {
    return true;
  }

  return options.some(({ value, label, selectedLabel }) =>
    matchesOption(selectedValue, value, label, selectedLabel)
  );
};

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
    application.departmentName,
    application.branchName,
  ].some((value) => normalizeValue(value).includes(searchText));
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

const badgeToneClass = {
  green: "border-emerald-100 bg-emerald-50 text-emerald-600 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300",
  blue: "border-sky-100 bg-sky-50 text-sky-600 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300",
  pink: "border-pink-100 bg-pink-50 text-pink-600 dark:border-pink-500/20 dark:bg-pink-500/10 dark:text-pink-300",
  purple: "border-violet-100 bg-violet-50 text-violet-600 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300",
  orange: "border-orange-100 bg-orange-50 text-orange-600 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-300",
  teal: "border-teal-100 bg-teal-50 text-teal-600 dark:border-teal-500/20 dark:bg-teal-500/10 dark:text-teal-300",
  red: "border-danger-200 bg-danger-500/10 text-danger-600",
  yellow: "border-warning-200 bg-warning-500/10 text-warning-600",
  slate: "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-700 dark:text-slate-200",
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

const statusTone = (status) => {
  const value = normalizeValue(status);

  if (["accepted", "passed", "approved", "hired"].includes(value)) {
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

const statusIcon = (status) => {
  const value = normalizeValue(status);

  if (["accepted", "passed", "approved", "hired"].includes(value)) {
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

const getCurrentApplicationStage = (stages = []) =>
  stages.find((stage) =>
    ["pending", "in_progress", "progress"].includes(normalizeValue(stage.status))
  ) || stages.at(-1);

const getStageId = (stage) => stage?.stage || stage?.stage_id;

const buildStageProcessPayload = (stageId, status) => {
  const payload = { status };

  if (stageId) {
    payload.stage_id = stageId;
  }

  return payload;
};

const Badge = ({ children, tone = "slate", icon }) => (
  <span
    className={`inline-flex w-fit max-w-full flex-none items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-none ${badgeToneClass[tone]}`}
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

const Rekruitmen = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
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
  const [selectedApplicationIds, setSelectedApplicationIds] = useState([]);
  const [selectedApplications, setSelectedApplications] = useState([]);
  const [selectionResetKey, setSelectionResetKey] = useState(0);
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false);

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
      return normalizeOptions(res.data, optionFromDepartment);
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

  const departmentOptions = departmentsQuery.data ?? [];
  const jobOptions = jobsOptionsQuery.data ?? [];
  const branchOptions = branchesQuery.data ?? [];

  const filteredJobOptions = useMemo(() => {
    if (!departmentFilter) {
      return jobOptions;
    }

    const selectedDepartment = departmentOptions.find(
      (option) => option.value === departmentFilter
    );

    return jobOptions.filter(
      (job) =>
        matchesOption(
          departmentFilter,
          job.department,
          job.departmentName,
          selectedDepartment?.label
        )
    );
  }, [departmentFilter, departmentOptions, jobOptions]);

  const departmentLookup = useMemo(
    () =>
      departmentOptions.reduce((acc, item) => {
        acc[item.value] = item.label;
        return acc;
      }, {}),
    [departmentOptions]
  );

  const jobLookup = useMemo(
    () =>
      jobOptions.reduce((acc, item) => {
        acc[item.value] = item.label;
        return acc;
      }, {}),
    [jobOptions]
  );

  const branchLookup = useMemo(
    () =>
      branchOptions.reduce((acc, item) => {
        acc[item.value] = item.label;
        return acc;
      }, {}),
    [branchOptions]
  );

  const activeFilterCount = [
    departmentFilter,
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

  const applicationsQuery = useQuery({
    queryKey: [
      "careerApplications",
      {
        pageIndex,
        pageSize,
        searchQuery,
        departmentFilter,
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
      const params = {
        page: pageIndex + 1,
        page_size: pageSize,
      };

      if (searchQuery) params.search = searchQuery;
      if (departmentFilter) params.filter_department_id = departmentFilter;
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
      return getPaginatedResults(res.data);
    },
    keepPreviousData: true,
  });

  const mappedApplications = useMemo(() => {
    const payload = applicationsQuery.data ?? { count: 0, results: [] };

    return payload.results.map((application) => {
      const latestStage = getCurrentApplicationStage(application.stages || []);

      return {
        id: application.application_id,
        jobId: application.job,
        jobTitle: application.job_title || jobLookup[application.job] || "-",
        departmentId: application.department,
        departmentName:
          application.department_name ||
          departmentLookup[application.department] ||
          "-",
        branchId: application.branch,
        branchName:
          application.branch_name || branchLookup[application.branch] || "-",
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
        status: application.status,
        statusDisplay: application.status_display || application.status || "-",
        stageName: latestStage?.stage_name || "-",
        stageId: getStageId(latestStage),
        stageStatus: latestStage?.status || application.status,
        stageStatusDisplay:
          latestStage?.status_display || application.status_display || "-",
        educationUniversity: application.education_university,
        educationMajor: application.education_major,
        educationGraduationYear: application.education_graduation_year,
        birthPlace: application.birth_place,
        birthDate: application.birth_date,
        address: application.address,
        domicile: application.domicile,
        bodyHeight: application.body_height,
        bodyWeight: application.body_weight,
        instagram: application.instagram,
        instagramLink: application.instagram_link,
        uploadCv: application.upload_cv,
        uploadSertificates: application.upload_sertificates || [],
        swimmingStylesDisplay: application.swimming_styles_display || [],
        sourceName: application.source_name,
        isWorking: toBoolean(application.is_working),
        isTrainer: toBoolean(application.is_trainer),
        raw: application,
      };
    });
  }, [applicationsQuery.data, branchLookup, departmentLookup, jobLookup]);

  const dynamicOptions = useMemo(
    () => ({
      contractSystems: optionFromDisplayFields(
        mappedApplications,
        "contractSystem",
        "contractSystemDisplay"
      ),
      statuses: optionFromDisplayFields(
        mappedApplications,
        "status",
        "statusDisplay"
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

  const listData = useMemo(() => {
    const selectedDepartment = departmentOptions.find(
      (option) => option.value === departmentFilter
    );
    const selectedJob = jobOptions.find((option) => option.value === jobFilter);
    const selectedBranch = branchOptions.find(
      (option) => option.value === branchFilter
    );

    const filteredResults = mappedApplications.filter(
      (application) =>
        matchesSearch(searchQuery, application) &&
        matchesOption(
          departmentFilter,
          application.departmentId,
          application.departmentName,
          selectedDepartment?.label
        ) &&
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
          application.status,
          application.statusDisplay,
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

    const hasClientFilter = activeFilterCount > 0 || Boolean(searchQuery);

    return {
      count: hasClientFilter
        ? filteredResults.length
        : applicationsQuery.data?.count ?? mappedApplications.length,
      results: hasClientFilter ? filteredResults : mappedApplications,
    };
  }, [
    activeFilterCount,
    applicationsQuery.data?.count,
    statusFilter,
    branchFilter,
    branchOptions,
    coachExperienceFilter,
    contractSystemFilter,
    departmentFilter,
    departmentOptions,
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
    workingFilter,
  ]);

  const pageCount = Math.max(1, Math.ceil((listData.count || 0) / pageSize));
  const safePageIndex = Math.min(pageIndex, pageCount - 1);

  const handleSearch = () => {
    setSearchQuery(searchInput);
    resetToFirstPage();
  };

  const handleFilterChange = (setter) => (value) => {
    setter(value);
    resetToFirstPage();
  };

  const handleDepartmentChange = (value) => {
    setDepartmentFilter(value);
    setJobFilter("");
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
    setSearchInput("");
    setSearchQuery("");
    setDepartmentFilter("");
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

  const handleSelectionChange = (selection) => {
    const rows = selection
      .map((item) =>
        typeof item === "string"
          ? listData.results.find((application) => application.id === item)
          : item?.original
      )
      .filter(Boolean);
    const ids = [...new Set(rows.map((application) => application.id).filter(Boolean))];

    setSelectedApplicationIds(ids);
    setSelectedApplications(
      ids
        .map((id) => rows.find((application) => application.id === id))
        .filter(Boolean)
    );
  };

  const handleMobileSelection = (application) => {
    const isSelected = selectedApplicationIds.includes(application.id);
    setSelectedApplicationIds((current) =>
      isSelected
        ? current.filter((id) => id !== application.id)
        : [...current, application.id]
    );
    setSelectedApplications((current) =>
      isSelected
        ? current.filter((item) => item.id !== application.id)
        : [...current, application]
    );
  };

  const clearSelection = () => {
    setSelectedApplicationIds([]);
    setSelectedApplications([]);
    setSelectionResetKey((key) => key + 1);
  };

  const startSelectedApplicationsMutation = useMutation({
    mutationFn: async (applications) => {
      const ids = applications.map((application) => application.id).filter(Boolean);
      return {
        applications,
        response: await startCareerApplications({ application_ids: ids }),
      };
    },
    onSuccess: ({ applications, response }) => {
      const failed = Array.isArray(response?.data?.failed)
        ? response.data.failed
        : [];

      clearSelection();
      queryClient.invalidateQueries({ queryKey: ["careerApplications"] });

      if (failed.length) {
        const applicationNames = new Map(
          applications.map((application) => [application.id, application.name])
        );
        const failureDetails = failed
          .map((item) => {
            const name = applicationNames.get(item.application_id) || item.application_id;
            return `${name}: ${getSafeFailureMessage(item.message)}`;
          })
          .join("\n");

        Swal.fire(
          failed.length === applications.length ? "Tidak dapat diproses" : "Sebagian gagal",
          failureDetails,
          "warning"
        );
        return;
      }

      Swal.fire(
        "Berhasil",
        "Pelamar terpilih berhasil dimasukkan ke tahap rekrutmen.",
        "success"
      );
    },
    onError: (error) => {
      const failed = error?.response?.data?.failed;
      if (Array.isArray(failed) && failed.length) {
        Swal.fire(
          "Tidak dapat diproses",
          failed
            .map((item) => `${item.application_id}: ${getSafeFailureMessage(item.message)}`)
            .join("\n"),
          "warning"
        );
        return;
      }

      Swal.fire(
        "Gagal",
        getErrorMessage(error, "Pelamar terpilih gagal diproses."),
        "error"
      );
    },
  });

  const rejectSelectedApplicationsMutation = useMutation({
    mutationFn: async (applications) => {
      const pendingIds = applications
        .filter((application) => normalizeValue(application.status) === "pending")
        .map((application) => application.id)
        .filter(Boolean);

      if (pendingIds.length) {
        await startCareerApplications({ application_ids: pendingIds });
      }

      return Promise.all(
        applications.map((application) =>
          processCareerApplicationStage(
            application.id,
            buildStageProcessPayload(application.stageId, "failed")
          )
        )
      );
    },
    onSuccess: () => {
      clearSelection();
      queryClient.invalidateQueries({ queryKey: ["careerApplications"] });
      Swal.fire(
        "Berhasil",
        "Pelamar terpilih berhasil ditolak.",
        "success"
      );
    },
    onError: (error) => {
      Swal.fire(
        "Gagal",
        getErrorMessage(error, "Pelamar terpilih gagal ditolak."),
        "error"
      );
    },
  });

  const createTrainersBulkMutation = useMutation({
    mutationFn: (applications) =>
      createCareerApplicationTrainersBulk({
        application_ids: applications.map((application) => application.id),
      }),
    onSuccess: (response) => {
      const result = response?.data || {};
      const failed = Array.isArray(result.failed) ? result.failed : [];

      clearSelection();
      queryClient.invalidateQueries({ queryKey: ["careerApplications"] });

      if (result.status === "error" || failed.length) {
        const failureMessage = failed.length
          ? failed
              .map((item) => `${item.application_id}: ${getSafeFailureMessage(item.message, "Gagal dibuat.")}`)
              .join("\n")
          : getSafeFailureMessage(
              result.message,
              "Sebagian pelamar gagal ditambahkan sebagai pelatih."
            );
        Swal.fire("Tidak dapat diproses", failureMessage, "warning");
        return;
      }

      Swal.fire(
        "Berhasil",
        "Pelamar diterima berhasil ditambahkan sebagai pelatih.",
        "success"
      );
    },
    onError: (error) => {
      Swal.fire(
        "Gagal",
        getErrorMessage(error, "Pelamar gagal ditambahkan sebagai pelatih."),
        "error"
      );
    },
  });

  const handleCreateTrainersBulk = () => {
    if (!selectedApplications.length) {
      Swal.fire("Pilih pelamar", "Checklist pelamar diterima yang ingin ditambahkan.", "info");
      return;
    }

    const acceptedApplications = selectedApplications.filter(isAcceptedApplication);

    if (!acceptedApplications.length) {
      Swal.fire(
        "Tidak dapat diproses",
        "Pilih pelamar dengan status Diterima terlebih dahulu.",
        "info"
      );
      return;
    }

    const trainerCandidates = acceptedApplications.filter(
      (application) => !isTrainerApplication(application)
    );

    if (!trainerCandidates.length) {
      Swal.fire(
        "Sudah terdaftar sebagai pelatih",
        `Pelamar berikut sudah terdaftar sebagai pelatih:\n\n${acceptedApplications
          .map((application) => application.name)
          .join("\n")}`,
        "info"
      );
      return;
    }

    Swal.fire({
      title: "Jadikan pelatih?",
      text: `${trainerCandidates.length} pelamar Diterima akan ditambahkan sebagai pelatih.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#22c55e",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Ya, jadikan pelatih",
      cancelButtonText: "Batal",
    }).then((result) => {
      if (result.isConfirmed) {
        createTrainersBulkMutation.mutate(trainerCandidates);
      }
    });
  };

  const handleStartSelectedApplications = () => {
    if (!selectedApplications.length) {
      Swal.fire("Pilih pelamar", "Checklist pelamar yang ingin diproses.", "info");
      return;
    }

    const pendingApplications = selectedApplications.filter(
      (application) => normalizeValue(application.status) === "pending"
    );

    if (!pendingApplications.length) {
      Swal.fire(
        "Tidak dapat diproses",
        "Hanya lamaran dengan status Pending yang dapat diproses.",
        "warning"
      );
      return;
    }

    Swal.fire({
      title: "Mulai tahap rekrutmen?",
      text: `${pendingApplications.length} pelamar Pending akan dimasukkan ke tahap rekrutmen.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#22c55e",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Ya, mulai",
      cancelButtonText: "Batal",
    }).then((result) => {
      if (result.isConfirmed) {
        startSelectedApplicationsMutation.mutate(pendingApplications);
      }
    });
  };

  const handleRejectSelectedApplications = () => {
    if (!selectedApplications.length) {
      Swal.fire("Pilih pelamar", "Checklist pelamar yang ingin ditolak.", "info");
      return;
    }

    const rejectableApplications = selectedApplications.filter(
      isRejectableApplication
    );

    if (!rejectableApplications.length) {
      return;
    }

    Swal.fire({
      title: "Tolak pelamar terpilih?",
      text: `${rejectableApplications.length} pelamar akan diproses sebagai tidak lulus.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Ya, tolak",
      cancelButtonText: "Batal",
    }).then((result) => {
      if (result.isConfirmed) {
        rejectSelectedApplicationsMutation.mutate(rejectableApplications);
      }
    });
  };

  const isBatchProcessing =
    startSelectedApplicationsMutation.isPending ||
    rejectSelectedApplicationsMutation.isPending ||
    createTrainersBulkMutation.isPending;

  const selectedAcceptedApplications = selectedApplications.filter(isAcceptedApplication);
  const selectedTrainerCandidates = selectedAcceptedApplications.filter(
    (application) => !isTrainerApplication(application)
  );
  const selectedRegisteredTrainers = selectedAcceptedApplications.filter(
    isTrainerApplication
  );
  const selectedRejectedApplications = selectedApplications.filter(
    isRejectedApplication
  );
  const selectedRejectableApplications = selectedApplications.filter(
    isRejectableApplication
  );
  const selectedPendingCandidates = selectedApplications.filter(
    (application) => normalizeValue(application.status) === "pending"
  );

  const columns = useMemo(
    () => [
      {
        Header: "Nama",
        accessor: "name",
        width: "20%",
        Cell: ({ row }) => (
          <div className="flex max-w-full min-w-0 items-center justify-between gap-3 text-left">
            <div className="min-w-0 flex-1">
              <p
                className="truncate whitespace-nowrap font-semibold text-slate-700 dark:text-slate-200"
                title={row.original.name}
              >
                {row.original.name}
              </p>
              {row.original.phoneNumber !== "-" ? (
                <a
                  href={row.original.whatsappLink || getWhatsappHref(row.original.phoneNumber)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 block truncate whitespace-nowrap text-xs font-medium text-success-600 hover:underline"
                  onClick={(event) => event.stopPropagation()}
                  title={row.original.phoneNumber}
                >
                  {row.original.phoneNumber}
                </a>
              ) : (
                <p className="mt-1 text-xs text-slate-400">-</p>
              )}
            </div>
            {isTrainerApplication(row.original) && (
              <div className="flex flex-none items-center justify-end">
                <Badge tone="green" icon="heroicons-outline:check-circle">
                  Pelatih
                </Badge>
              </div>
            )}
          </div>
        ),
      },
      {
        Header: "Loker",
        accessor: "jobTitle",
        width: "13%",
        Cell: ({ cell }) => <span>{cell.value}</span>,
      },
      {
        Header: "Cabang",
        accessor: "branchName",
        width: "11%",
        Cell: ({ cell }) => <Badge tone="blue">{cell.value}</Badge>,
      },
      {
        Header: "Gender",
        accessor: "genderDisplay",
        width: "11%",
        Cell: ({ cell, row }) => (
          <Badge tone={genderTone(row.original.gender)}>{cell.value}</Badge>
        ),
      },
      {
        Header: "Status Pekerjaan",
        accessor: "contractSystemDisplay",
        width: "14%",
        Cell: ({ cell, row }) => (
          <Badge tone={contractSystemTone(row.original.contractSystem)}>
            {cell.value}
          </Badge>
        ),
      },
      {
        Header: "Status",
        accessor: "statusDisplay",
        width: "12%",
        Cell: ({ row }) => (
          <Badge
            tone={statusTone(row.original.status)}
            icon={statusIcon(row.original.status)}
          >
            {row.original.statusDisplay}
          </Badge>
        ),
      },
      {
        Header: "Detail",
        accessor: "detail",
        id: "action",
        sticky: "right",
        Cell: ({ row }) => (
          <div className="flex items-center justify-center gap-2">
            <TableAction
              action={{
                name: "Detail",
                icon: "heroicons-outline:eye",
                onClick: () => navigate(`/karir/rekruitmen/${row.original.id}`),
              }}
              row={{ row }}
            />
          </div>
        ),
      },
    ],
    [navigate]
  );

  const selectOptions = {
    departments: [{ value: "", label: "Semua department" }, ...departmentOptions],
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

  return (
    <div className="career-recruitment-page min-w-0 space-y-5">
      <Card bodyClass="p-4 sm:p-5" className="min-w-0 overflow-hidden">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Filter Pelamar
              </h3>
              <p className="mt-1 text-sm font-semibold text-slate-400">
                {activeFilterCount
                  ? `${activeFilterCount} filter aktif`
                  : "Gunakan filter untuk menyaring data pelamar."}
              </p>
            </div>
            <div className="career-recruitment-filter-actions grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:flex sm:flex-wrap">
              <button
                type="button"
                onClick={() => setIsAdvancedFiltersOpen((current) => !current)}
                className="inline-flex min-h-[44px] min-w-0 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-xs font-bold leading-4 text-slate-600 transition hover:border-primary-200 hover:text-primary-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                aria-expanded={isAdvancedFiltersOpen}
              >
                <Icon icon="heroicons-outline:adjustments" width={16} />
                {isAdvancedFiltersOpen ? "Sembunyikan Filter" : "Filter Lanjutan"}
              </button>
              <button
                type="button"
                onClick={handleResetFilter}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-md bg-slate-100 px-3 text-xs font-bold text-slate-600 transition hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200"
              >
                <Icon icon="heroicons-outline:arrow-path" width={16} />
                Reset
              </button>
            </div>
          </div>

          <div className="career-recruitment-filter-grid grid min-w-0 grid-cols-1 gap-3">
            <FilterSelect
              label="Department"
              value={departmentFilter}
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
            <div className="career-recruitment-advanced-grid grid grid-cols-1 gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
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

      <Card
          title="Rekruitmen"
          bodyClass="p-4 sm:p-6"
          className="career-recruitment-card min-w-0 overflow-hidden"
          headerslot={
            <div className="career-recruitment-bulk-actions flex min-w-0 flex-wrap items-center gap-2">
              {selectedApplications.length > 0 && (
                <div className="mr-1 inline-flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  <span>{selectedPendingCandidates.length} Pending</span>
                  <span className="text-slate-300 dark:text-slate-600">|</span>
                  <span>{selectedAcceptedApplications.length} Diterima</span>
                </div>
              )}
              {selectedTrainerCandidates.length > 0 && (
                <button
                  type="button"
                  onClick={handleCreateTrainersBulk}
                  disabled={isBatchProcessing}
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-md bg-success-500 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-success-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Icon icon="heroicons-outline:user-add" width={18} />
                  {createTrainersBulkMutation.isPending
                    ? "Memproses..."
                    : `Jadikan Pelatih (${selectedTrainerCandidates.length})`}
                </button>
              )}
              {selectedRegisteredTrainers.length > 0 && (
                <button
                  type="button"
                  disabled
                  className="inline-flex min-h-[44px] cursor-not-allowed items-center justify-center gap-2 rounded-md border border-success-200 bg-success-50 px-4 text-sm font-bold text-success-600 opacity-70 dark:border-success-500/30 dark:bg-success-500/10 dark:text-success-300"
                  title="Pelamar sudah terdaftar sebagai pelatih"
                >
                  <Icon icon="heroicons-outline:badge-check" width={18} />
                  {selectedRegisteredTrainers.length > 1
                    ? `Pelatih (${selectedRegisteredTrainers.length})`
                    : "Pelatih"}
                </button>
              )}
              {selectedPendingCandidates.length > 0 && (
                <button
                  type="button"
                  onClick={handleStartSelectedApplications}
                  disabled={isBatchProcessing}
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-md bg-success-500 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-success-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Icon icon="heroicons-outline:check-circle" width={18} />
                  {startSelectedApplicationsMutation.isPending
                    ? "Memproses..."
                    : `Mulai Tahap (${selectedPendingCandidates.length})`}
                </button>
              )}
              {selectedRejectableApplications.length > 0 && (
                <button
                  type="button"
                  onClick={handleRejectSelectedApplications}
                  disabled={isBatchProcessing}
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-md bg-danger-500 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-danger-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Icon icon="heroicons-outline:x-circle" width={18} />
                  {rejectSelectedApplicationsMutation.isPending
                    ? "Memproses..."
                    : `Tolak (${selectedRejectableApplications.length})`}
                </button>
              )}
              {selectedRejectedApplications.length > 0 &&
                selectedRejectableApplications.length === 0 && (
                  <button
                    type="button"
                    disabled
                    className="inline-flex min-h-[44px] cursor-not-allowed items-center justify-center gap-2 rounded-md border border-danger-200 bg-danger-50 px-4 text-sm font-bold text-danger-600 opacity-70 dark:border-danger-500/30 dark:bg-danger-500/10 dark:text-danger-300"
                  >
                    <Icon icon="heroicons-outline:x-circle" width={18} />
                    {selectedRejectedApplications.length > 1
                      ? `Ditolak (${selectedRejectedApplications.length})`
                      : "Ditolak"}
                  </button>
                )}
            </div>
          }
        >
          <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="w-full max-w-xl">
            <div className="relative">
              <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <Icon icon="heroicons-outline:search" width={20} />
              </div>
              <input
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    handleSearch();
                  }
                }}
                placeholder="Cari pelamar"
                className="h-12 w-full rounded-full border border-slate-200 bg-white pl-12 pr-28 text-sm font-semibold text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              />
              <button
                type="button"
                onClick={handleSearch}
                className="absolute right-1.5 top-1/2 inline-flex h-9 -translate-y-1/2 items-center gap-2 rounded-full bg-primary-500 px-5 text-xs font-bold uppercase text-white shadow-sm transition hover:bg-primary-600"
              >
                <Icon icon="heroicons-outline:search" width={16} />
                Cari
              </button>
            </div>
            </div>

            {selectedApplicationIds.length ? (
              <div className="text-sm font-semibold text-slate-500">
                {selectedApplicationIds.length} pelamar dipilih
              </div>
            ) : null}
          </div>

          {!applicationsQuery.isError && (
            departmentsQuery.isError || jobsOptionsQuery.isError || branchesQuery.isError
          ) && (
            <CareerErrorState
              compact
              className="mb-5"
              title="Sebagian filter belum tersedia"
              error={departmentsQuery.error || jobsOptionsQuery.error || branchesQuery.error}
              fallback="Pilihan filter pelamar belum dapat dimuat."
              onRetry={() => Promise.allSettled([
                departmentsQuery.refetch(),
                jobsOptionsQuery.refetch(),
                branchesQuery.refetch(),
              ])}
              isRetrying={departmentsQuery.isFetching || jobsOptionsQuery.isFetching || branchesQuery.isFetching}
            />
          )}

          {applicationsQuery.isLoading ? (
            <SkeletionTable />
          ) : applicationsQuery.isError ? (
            <CareerErrorState
              error={applicationsQuery.error}
              fallback="Data pelamar belum dapat dimuat. Silakan coba lagi."
              onRetry={() => Promise.allSettled([
                applicationsQuery.refetch(),
                departmentsQuery.refetch(),
                jobsOptionsQuery.refetch(),
                branchesQuery.refetch(),
              ])}
              isRetrying={applicationsQuery.isFetching}
            />
          ) : (
            <>
              <div className="space-y-3 md:hidden" aria-label="Daftar pelamar">
                {listData.results.map((application) => {
                  const isSelected = selectedApplicationIds.includes(application.id);
                  return (
                    <article
                      key={application.id}
                      className={`rounded-xl border p-4 shadow-sm transition ${isSelected ? "border-primary-300 bg-primary-50 dark:border-primary-500/50 dark:bg-primary-500/10" : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"}`}
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <label className="flex min-h-[44px] shrink-0 cursor-pointer items-start pt-1" aria-label={`Pilih ${application.name}`}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleMobileSelection(application)}
                            className="h-5 w-5 rounded border-slate-300 text-primary-500 focus:ring-primary-500"
                          />
                        </label>
                        <div className="min-w-0 flex-1">
                          <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <h2 className="break-words text-sm font-bold leading-5 text-slate-800 dark:text-slate-100">{application.name}</h2>
                              {application.phoneNumber !== "-" && (
                                <a href={application.whatsappLink || getWhatsappHref(application.phoneNumber)} target="_blank" rel="noreferrer" className="mt-1 inline-block break-all text-xs font-semibold text-success-600 hover:underline">
                                  {application.phoneNumber}
                                </a>
                              )}
                            </div>
                            <Badge tone={statusTone(application.status)} icon={statusIcon(application.status)}>
                              {application.statusDisplay}
                            </Badge>
                          </div>

                          {isTrainerApplication(application) && (
                            <div className="mt-2"><Badge tone="green" icon="heroicons-outline:check-circle">Pelatih</Badge></div>
                          )}
                        </div>
                      </div>

                      <dl className="mt-4 grid grid-cols-1 gap-3 text-xs min-[380px]:grid-cols-2">
                        <div className="min-w-0 rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
                          <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Loker</dt>
                          <dd className="mt-1 break-words font-medium text-slate-700 dark:text-slate-200">{application.jobTitle}</dd>
                        </div>
                        <div className="min-w-0 rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
                          <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Cabang</dt>
                          <dd className="mt-1 break-words font-medium text-slate-700 dark:text-slate-200">{application.branchName}</dd>
                        </div>
                        <div className="min-w-0 rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
                          <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Gender</dt>
                          <dd className="mt-1 break-words font-medium text-slate-700 dark:text-slate-200">{application.genderDisplay}</dd>
                        </div>
                        <div className="min-w-0 rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
                          <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Status pekerjaan</dt>
                          <dd className="mt-1 break-words font-medium text-slate-700 dark:text-slate-200">{application.contractSystemDisplay}</dd>
                        </div>
                      </dl>

                      <button
                        type="button"
                        onClick={() => navigate(`/karir/rekruitmen/${application.id}`)}
                        className="mt-4 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg border border-primary-200 bg-primary-50 px-4 text-sm font-bold text-primary-600 transition hover:bg-primary-100 dark:border-primary-500/30 dark:bg-primary-500/10 dark:text-primary-300"
                      >
                        <Icon icon="heroicons-outline:eye" width={18} />
                        Lihat detail
                      </button>
                    </article>
                  );
                })}
              </div>

              <div className="hidden min-w-0 md:block">
                <p className="career-recruitment-table-hint mb-3 items-center gap-2 text-xs text-slate-500 dark:text-slate-300">
                  <Icon icon="heroicons-outline:arrows-right-left" width={17} />
                  Geser tabel ke samping untuk melihat semua informasi.
                </p>
                <Table
                  key={selectionResetKey}
                  tableId="karir-rekruitmen-table"
                  listData={listData}
                  listColumn={columns}
                  isAction
                  isCheckbox
                  onSelectionChange={handleSelectionChange}
                  actionColumnClass="w-36 min-w-[9rem]"
                  bodyCellAlign="center"
                  tableMinWidth="860px"
                />
              </div>

              {listData.results.length === 0 && (
                <div className="rounded-b-lg border-x border-b border-slate-200 bg-white px-4 py-10 text-center text-sm font-medium text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                  Tidak ada pelamar yang sesuai dengan filter.
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
  );
};

export default Rekruitmen;
