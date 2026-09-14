import React, { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Swal from "sweetalert2";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import Modal from "@/components/ui/Modal";
import Table from "@/components/globals/table/table";
import TableAction from "@/components/globals/table/tableAction";
import PaginationComponent from "@/components/globals/table/pagination";
import SkeletionTable from "@/components/skeleton/Table";
import CareerErrorState from "@/pages/karir/components/CareerErrorState";
import getErrorMessage from "@/utils/careerErrorMessage";
import {
  addCareerJob,
  deleteCareerJob,
  editCareerJob,
  getBranches,
  getCareerJobs,
  getDepartments,
  updateCareerJobStatus,
} from "@/axios/career/jobs";
import "./loker.css";

const emptyForm = {
  department: "",
  branch: "",
  title: "",
  slug: "",
  description: "",
  requirements: "",
  benefits: "",
  status: "draft",
};

const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const stripHtml = (value) =>
  String(value || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const getPaginatedResults = (payload) => {
  if (Array.isArray(payload)) {
    return { count: payload.length, results: payload.filter(Boolean) };
  }

  if (Array.isArray(payload?.results)) {
    return {
      count: payload.count ?? payload.results.length,
      results: payload.results.filter(Boolean),
    };
  }

  if (Array.isArray(payload?.data)) {
    return {
      count: payload.count ?? payload.data.length,
      results: payload.data.filter(Boolean),
    };
  }

  if (payload?.data && typeof payload.data === "object") {
    return getPaginatedResults(payload.data);
  }

  const namedResults =
    payload?.jobs || payload?.items || payload?.departments || payload?.branches;
  if (Array.isArray(namedResults)) {
    return {
      count: payload.count ?? namedResults.length,
      results: namedResults.filter(Boolean),
    };
  }

  return { count: 0, results: [] };
};

const getId = (item, type) => {
  if (!item || typeof item !== "object") {
    return item || "";
  }

  const typeIdKey = type ? `${type}_id` : null;
  return item[typeIdKey] || item.id || item.uuid || "";
};

const getLabel = (item, type) => {
  if (!item || typeof item !== "object") {
    return item || "";
  }

  const typeNameKey = type ? `${type}_name` : null;
  return item.name || item.title || item[typeNameKey] || item.label || getId(item, type);
};

const normalizeDepartments = (payload) => {
  const { results } = getPaginatedResults(payload);

  return results
    .map((department) => ({
      value: getId(department, "department"),
      label: getLabel(department, "department"),
    }))
    .filter((department) => department.value && department.label);
};

const normalizeBranches = (payload) => {
  const { results } = getPaginatedResults(payload);

  return results
    .map((branch) => ({
      value: branch.branch_id || branch.id,
      label: branch.name,
    }))
    .filter((branch) => branch.value && branch.label);
};

const formatStatus = (status) =>
  status === "published" ? "Published" : "Draft";

const normalizeFilterValue = (value) => String(value || "").trim().toLowerCase();

const matchesSelectedOption = ({
  selectedValue,
  selectedLabel,
  currentValue,
  currentLabel,
}) => {
  if (!selectedValue) {
    return true;
  }

  const selectedValueText = normalizeFilterValue(selectedValue);
  const selectedLabelText = normalizeFilterValue(selectedLabel);
  const currentValueText = normalizeFilterValue(currentValue);
  const currentLabelText = normalizeFilterValue(currentLabel);

  return (
    currentValueText === selectedValueText ||
    (!!selectedLabelText && currentLabelText === selectedLabelText)
  );
};

const Loker = () => {
  const formRef = useRef(null);
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [form, setForm] = useState(emptyForm);

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

  const branchesQuery = useQuery({
    queryKey: ["careerBranches"],
    queryFn: async () => {
      const res = await getBranches({
        page: 1,
        page_size: 100,
        ordering: "name",
      });
      return normalizeBranches(res.data);
    },
  });

  const departmentOptions = departmentsQuery.data ?? [];
  const branchOptions = branchesQuery.data ?? [];

  const departmentLookup = useMemo(
    () =>
      departmentOptions.reduce((acc, item) => {
        acc[item.value] = item.label;
        return acc;
      }, {}),
    [departmentOptions]
  );

  const branchLookup = useMemo(
    () =>
      branchOptions.reduce((acc, item) => {
        acc[item.value] = item.label;
        return acc;
      }, {}),
    [branchOptions]
  );

  const jobsQuery = useQuery({
    queryKey: [
      "careerJobs",
      { pageIndex, pageSize, searchQuery, departmentFilter, branchFilter },
    ],
    queryFn: async () => {
      const params = {
        page: pageIndex + 1,
        page_size: pageSize,
      };

      if (searchQuery) {
        params.search = searchQuery;
      }

      if (departmentFilter) {
        params.filter_departement_id = departmentFilter;
      }

      if (branchFilter) {
        params.filter_branch_id = branchFilter;
      }

      const res = await getCareerJobs(params);
      return getPaginatedResults(res.data);
    },
    keepPreviousData: true,
  });

  const listData = useMemo(() => {
    const payload = jobsQuery.data ?? { count: 0, results: [] };
    const mappedResults = payload.results.filter(
      (job) => job && typeof job === "object"
    ).map((job) => {
      const id = job.job_id || getId(job, "job");
      const departmentId =
        job.department_id || getId(job.department, "department");
      const branchId = job.branch_id || getId(job.branch, "branch");
      const status = String(job.status || "draft").toLowerCase();
      const departmentLabel =
        typeof job.department === "object"
          ? getLabel(job.department, "department")
          : "";
      const branchLabel =
        typeof job.branch === "object" ? getLabel(job.branch, "branch") : "";

      return {
        id,
        departmentId,
        branchId,
        departmentName:
          job.department_name ||
          departmentLabel ||
          departmentLookup[departmentId] ||
          "-",
        branchName:
          job.branch_name ||
          branchLabel ||
          branchLookup[branchId] ||
          "-",
        title: job.title || "-",
        slug: job.slug || "",
        description: job.description || "",
        requirements: job.requirements || "",
        benefits: job.benefits || "",
        status,
        statusDisplay: job.status_display || formatStatus(status),
        raw: job,
      };
    });

    const filteredResults = mappedResults.filter(
      (job) =>
        matchesSelectedOption({
          selectedValue: departmentFilter,
          selectedLabel: departmentLookup[departmentFilter],
          currentValue: job.departmentId,
          currentLabel: job.departmentName,
        }) &&
        matchesSelectedOption({
          selectedValue: branchFilter,
          selectedLabel: branchLookup[branchFilter],
          currentValue: job.branchId,
          currentLabel: job.branchName,
        })
    );
    const hasClientFilter = Boolean(departmentFilter || branchFilter);

    return {
      count: hasClientFilter ? filteredResults.length : payload.count,
      results: hasClientFilter ? filteredResults : mappedResults,
    };
  }, [
    jobsQuery.data,
    departmentFilter,
    branchFilter,
    departmentLookup,
    branchLookup,
  ]);

  const pageCount = Math.max(1, Math.ceil((listData.count || 0) / pageSize));
  const safePageIndex = Math.min(pageIndex, pageCount - 1);

  const resetToFirstPage = () => {
    setPageIndex(0);
  };

  const invalidateJobs = () => {
    queryClient.invalidateQueries({ queryKey: ["careerJobs"] });
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingJob(null);
    setForm(emptyForm);
  };

  const addCareerJobMutation = useMutation({
    mutationFn: addCareerJob,
    onSuccess: () => {
      closeModal();
      resetToFirstPage();
      invalidateJobs();
      Swal.fire("Berhasil", "Loker berhasil ditambahkan.", "success");
    },
    onError: (error) => {
      Swal.fire(
        "Gagal",
        getErrorMessage(error, "Loker gagal ditambahkan."),
        "error"
      );
    },
  });

  const editCareerJobMutation = useMutation({
    mutationFn: ({ id, data }) => editCareerJob(id, data),
    onSuccess: () => {
      closeModal();
      invalidateJobs();
      Swal.fire("Berhasil", "Loker berhasil diperbarui.", "success");
    },
    onError: (error) => {
      Swal.fire(
        "Gagal",
        getErrorMessage(error, "Loker gagal diperbarui."),
        "error"
      );
    },
  });

  const deleteCareerJobMutation = useMutation({
    mutationFn: deleteCareerJob,
    onSuccess: () => {
      invalidateJobs();
      Swal.fire("Berhasil", "Loker berhasil dihapus.", "success");
    },
    onError: (error) => {
      Swal.fire("Gagal", getErrorMessage(error, "Loker gagal dihapus."), "error");
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => updateCareerJobStatus(id, { status }),
    onSuccess: () => {
      invalidateJobs();
      Swal.fire("Berhasil", "Status loker berhasil diperbarui.", "success");
    },
    onError: (error) => {
      Swal.fire(
        "Gagal",
        getErrorMessage(error, "Status loker gagal diperbarui."),
        "error"
      );
    },
  });

  const isMutating =
    addCareerJobMutation.isPending ||
    editCareerJobMutation.isPending ||
    deleteCareerJobMutation.isPending ||
    updateStatusMutation.isPending;

  const handleSearch = () => {
    setSearchQuery(searchInput);
    resetToFirstPage();
  };

  const handleResetFilter = () => {
    setSearchInput("");
    setSearchQuery("");
    setDepartmentFilter("");
    setBranchFilter("");
    resetToFirstPage();
  };

  const openCreateModal = () => {
    setEditingJob(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  };

  const openEditModal = (job) => {
    setEditingJob(job);
    setForm({
      department: job.departmentId,
      branch: job.branchId,
      title: job.title === "-" ? "" : job.title,
      slug: job.slug,
      description: job.description,
      requirements: job.requirements,
      benefits: job.benefits,
      status: job.status,
    });
    setIsModalOpen(true);
  };

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const buildPayload = () => ({
    department: form.department,
    branch: form.branch,
    title: form.title.trim(),
    slug: form.slug.trim() || slugify(form.title),
    description: form.description,
    requirements: form.requirements,
    benefits: form.benefits,
    status: form.status,
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    const payload = buildPayload();

    if (editingJob) {
      editCareerJobMutation.mutate({ id: editingJob.id, data: payload });
      return;
    }

    addCareerJobMutation.mutate(payload);
  };

  const handleToggleStatus = (job) => {
    const isPublished = job.status === "published";
    const nextStatus = isPublished ? "draft" : "published";
    const actionLabel = isPublished ? "Jadikan Draft" : "Publish";

    Swal.fire({
      title: `${actionLabel} loker?`,
      text: isPublished
        ? `Loker “${job.title}” tidak akan tampil sebagai lowongan aktif.`
        : `Loker “${job.title}” akan tampil sebagai lowongan aktif.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: isPublished ? "#f59e0b" : "#22c55e",
      cancelButtonColor: "#64748b",
      confirmButtonText: `Ya, ${actionLabel.toLowerCase()}`,
      cancelButtonText: "Batal",
    }).then((result) => {
      if (result.isConfirmed) {
        updateStatusMutation.mutate({ id: job.id, status: nextStatus });
      }
    });
  };

  const handleDelete = (job) => {
    Swal.fire({
      title: "Yakin hapus loker?",
      text: `Loker “${job.title}” akan dihapus dan aksi ini tidak bisa dibatalkan.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Ya, hapus",
      cancelButtonText: "Batal",
    }).then((result) => {
      if (result.isConfirmed) {
        deleteCareerJobMutation.mutate(job.id);
      }
    });
  };

  const columns = useMemo(
    () => [
      {
        Header: "Judul",
        accessor: "title",
        width: "18%",
        Cell: ({ cell }) => (
          <span className="font-medium text-slate-600 dark:text-slate-200">
            {cell.value}
          </span>
        ),
      },
      {
        Header: "Department",
        accessor: "departmentName",
        width: "14%",
        Cell: ({ cell }) => <span>{cell.value}</span>,
      },
      {
        Header: "Cabang",
        accessor: "branchName",
        width: "13%",
        Cell: ({ cell }) => <span>{cell.value}</span>,
      },
      {
        Header: "Deskripsi",
        accessor: "description",
        width: "42%",
        Cell: ({ cell }) => (
          <p className="w-full max-w-[min(42rem,100%)] text-left leading-5 text-slate-600 dark:text-slate-300">
            {stripHtml(cell.value) || "-"}
          </p>
        ),
      },
      {
        Header: "Status",
        accessor: "statusDisplay",
        width: "13%",
        Cell: ({ cell, row }) => {
          const isPublished = row.original.status === "published";
          return (
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                isPublished
                  ? "bg-success-500/10 text-success-600"
                  : "border border-warning-200 bg-warning-50 text-warning-700 dark:border-warning-500/30 dark:bg-warning-500/10 dark:text-warning-300"
              }`}
            >
              {cell.value || formatStatus(row.original.status)}
            </span>
          );
        },
      },
      {
        Header: "Action",
        accessor: "action",
        id: "action",
        sticky: "right",
        Cell: ({ row }) => {
          const job = row.original;
          const actions = [
            {
              name: "Edit",
              icon: "heroicons:pencil-square",
              onClick: () => openEditModal(job),
              className:
                "!border-sky-100 !bg-sky-50 !text-sky-600 hover:!border-sky-200 hover:!bg-sky-100 hover:!text-sky-700 dark:!border-sky-500/20 dark:!bg-sky-500/10 dark:!text-sky-300 dark:hover:!bg-sky-500/20",
            },
            {
              name: "Delete",
              icon: "heroicons-outline:trash",
              onClick: () => handleDelete(job),
              className:
                "!border-danger-100 !bg-danger-50 !text-danger-600 hover:!border-danger-200 hover:!bg-danger-100 hover:!text-danger-700 dark:!border-danger-500/20 dark:!bg-danger-500/10 dark:!text-danger-300 dark:hover:!bg-danger-500/20",
            },
            {
              name: job.status === "published" ? "Jadikan Draft" : "Publish",
              icon:
                job.status === "published"
                  ? "heroicons-outline:archive-box"
                  : "heroicons-outline:arrow-up-tray",
              onClick: () => handleToggleStatus(job),
              className:
                job.status === "published"
                  ? "!border-amber-100 !bg-amber-50 !text-amber-600 hover:!border-amber-200 hover:!bg-amber-100 hover:!text-amber-700 dark:!border-amber-500/20 dark:!bg-amber-500/10 dark:!text-amber-300 dark:hover:!bg-amber-500/20"
                  : "!border-success-100 !bg-success-50 !text-success-600 hover:!border-success-200 hover:!bg-success-100 hover:!text-success-700 dark:!border-success-500/20 dark:!bg-success-500/10 dark:!text-success-300 dark:hover:!bg-success-500/20",
            },
          ];

          return (
            <div className="flex items-center justify-center gap-2">
              {actions.map((action) => (
                <TableAction key={action.name} action={action} row={{ row }} />
              ))}
            </div>
          );
        },
      },
    ],
    [deleteCareerJobMutation.isPending, updateStatusMutation.isPending]
  );

  const filterSelectClass =
    "h-12 rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200";

  return (
    <div className="career-loker-page grid min-w-0 grid-cols-1">
      <Card
        title="Loker"
        bodyClass="p-4 sm:p-6"
        className="career-loker-card min-w-0 overflow-hidden"
        headerslot={
          <Button
            text="Tambah"
            icon="heroicons-outline:plus"
            className="btn-primary min-w-[112px] max-sm:w-full"
            onClick={openCreateModal}
          />
        }
      >
        <div className="mb-6 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(280px,1fr)_minmax(220px,1fr)_minmax(220px,1fr)_minmax(170px,0.75fr)]">
          <div className="relative min-w-0 sm:col-span-2 xl:col-span-1">
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
              placeholder="Cari loker"
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

          <select
            value={departmentFilter}
            onChange={(event) => {
              setDepartmentFilter(event.target.value);
              resetToFirstPage();
            }}
            className={`${filterSelectClass} w-full min-w-0`}
            aria-label="Filter department"
          >
            <option value="">Semua department</option>
            {departmentOptions.map((department) => (
              <option key={department.value} value={department.value}>
                {department.label}
              </option>
            ))}
          </select>

          <select
            value={branchFilter}
            onChange={(event) => {
              setBranchFilter(event.target.value);
              resetToFirstPage();
            }}
            className={`${filterSelectClass} w-full min-w-0`}
            aria-label="Filter cabang"
          >
            <option value="">Semua cabang</option>
            {branchOptions.map((branch) => (
              <option key={branch.value} value={branch.value}>
                {branch.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleResetFilter}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-slate-100 px-5 text-sm font-semibold text-slate-600 transition hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 sm:col-span-2 xl:col-span-1"
          >
            <Icon icon="heroicons-outline:arrow-path" width={18} />
            Reset Filter
          </button>
        </div>

        {!jobsQuery.isError && (departmentsQuery.isError || branchesQuery.isError) && (
          <CareerErrorState
            compact
            className="mb-5"
            title="Sebagian filter belum tersedia"
            error={departmentsQuery.error || branchesQuery.error}
            fallback="Pilihan departemen atau cabang belum dapat dimuat."
            onRetry={() => Promise.allSettled([
              departmentsQuery.refetch(),
              branchesQuery.refetch(),
            ])}
            isRetrying={departmentsQuery.isFetching || branchesQuery.isFetching}
          />
        )}

        {jobsQuery.isLoading ? (
          <SkeletionTable />
        ) : jobsQuery.isError ? (
          <CareerErrorState
            error={jobsQuery.error}
            fallback="Data loker belum dapat dimuat. Silakan coba lagi."
            onRetry={() => Promise.allSettled([
              jobsQuery.refetch(),
              departmentsQuery.refetch(),
              branchesQuery.refetch(),
            ])}
            isRetrying={jobsQuery.isFetching}
          />
        ) : (
          <>
            <div className="space-y-3 md:hidden" aria-label="Daftar loker">
              {listData.results.map((job) => {
                const isPublished = job.status === "published";
                return (
                  <article
                    key={job.id}
                    className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900"
                  >
                    <div className="flex min-w-0 items-start justify-between gap-3">
                      <h2 className="min-w-0 flex-1 break-words text-sm font-bold leading-5 text-slate-800 dark:text-slate-100">
                        {job.title}
                      </h2>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${isPublished ? "bg-success-500/10 text-success-600" : "border border-warning-200 bg-warning-50 text-warning-700 dark:border-warning-500/30 dark:bg-warning-500/10 dark:text-warning-300"}`}>
                        {job.statusDisplay}
                      </span>
                    </div>

                    <dl className="mt-4 grid grid-cols-1 gap-3 text-xs min-[380px]:grid-cols-2">
                      <div className="min-w-0 rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
                        <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Departemen</dt>
                        <dd className="mt-1 break-words font-medium text-slate-700 dark:text-slate-200">{job.departmentName}</dd>
                      </div>
                      <div className="min-w-0 rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
                        <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Cabang</dt>
                        <dd className="mt-1 break-words font-medium text-slate-700 dark:text-slate-200">{job.branchName}</dd>
                      </div>
                    </dl>

                    <p className="mt-3 line-clamp-3 break-words text-xs leading-5 text-slate-500 dark:text-slate-300">
                      {stripHtml(job.description) || "Belum ada deskripsi."}
                    </p>

                    <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                      <button type="button" onClick={() => openEditModal(job)} disabled={isMutating} className="career-loker-mobile-action border-sky-100 bg-sky-50 text-sky-600 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300">
                        <Icon icon="heroicons:pencil-square" width={17} />
                        <span>Edit</span>
                      </button>
                      <button type="button" onClick={() => handleDelete(job)} disabled={isMutating} className="career-loker-mobile-action border-danger-100 bg-danger-50 text-danger-600 dark:border-danger-500/20 dark:bg-danger-500/10 dark:text-danger-300">
                        <Icon icon="heroicons-outline:trash" width={17} />
                        <span>Hapus</span>
                      </button>
                      <button type="button" onClick={() => handleToggleStatus(job)} disabled={isMutating} className={`career-loker-mobile-action ${isPublished ? "border-amber-100 bg-amber-50 text-amber-600 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300" : "border-success-100 bg-success-50 text-success-600 dark:border-success-500/20 dark:bg-success-500/10 dark:text-success-300"}`}>
                        <Icon icon={isPublished ? "heroicons-outline:archive-box" : "heroicons-outline:arrow-up-tray"} width={17} />
                        <span>{isPublished ? "Jadi Draft" : "Publish"}</span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="hidden min-w-0 md:block">
              <p className="career-loker-table-hint mb-3 items-center gap-2 text-xs text-slate-500 dark:text-slate-300">
                <Icon icon="heroicons-outline:arrows-right-left" width={17} />
                Geser tabel ke samping untuk melihat semua informasi.
              </p>
              <Table
                tableId="karir-loker-table"
                listData={listData}
                listColumn={columns}
                isAction
                actionColumnClass="w-44 min-w-[11rem]"
                tableMinWidth="780px"
              />
            </div>

            {listData.results.length === 0 && (
              <div className="rounded-b-lg border-x border-b border-slate-200 bg-white px-4 py-10 text-center text-sm font-medium text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                Tidak ada loker yang sesuai dengan filter.
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

      <Modal
        activeModal={isModalOpen}
        onClose={closeModal}
        title={editingJob ? "Edit Loker" : "Tambah Loker"}
        className="career-loker-modal max-w-4xl"
        centered
        scrollContent
        footerContent={
          <>
            <Button
              text="Batal"
              className="btn-outline-secondary max-sm:w-full"
              onClick={closeModal}
              disabled={isMutating}
            />
            <Button
              text={editingJob ? "Simpan Perubahan" : "Tambah Loker"}
              className="btn-primary max-sm:w-full"
              onClick={() => formRef.current?.requestSubmit()}
              isLoading={isMutating}
            />
          </>
        }
      >
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="grid grid-cols-1 gap-4"
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="block">
              <span className="form-label">Department</span>
              <select
                required
                value={form.department}
                onChange={(event) => updateForm("department", event.target.value)}
                className="form-control h-11"
              >
                <option value="">Pilih department</option>
                {departmentOptions.map((department) => (
                  <option key={department.value} value={department.value}>
                    {department.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="form-label">Cabang</span>
              <select
                required
                value={form.branch}
                onChange={(event) => updateForm("branch", event.target.value)}
                className="form-control h-11"
              >
                <option value="">Pilih cabang</option>
                {branchOptions.map((branch) => (
                  <option key={branch.value} value={branch.value}>
                    {branch.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="block">
              <span className="form-label">Judul</span>
              <input
                required
                value={form.title}
                onChange={(event) => updateForm("title", event.target.value)}
                className="form-control h-11"
                placeholder="Contoh: Swimming Coach"
              />
            </label>
            <label className="block">
              <span className="form-label">Status</span>
              <select
                value={form.status}
                onChange={(event) => updateForm("status", event.target.value)}
                className="form-control h-11"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </label>
          </div>

          <label className="block">
            <span className="form-label">Deskripsi</span>
            <textarea
              required
              value={form.description}
              onChange={(event) => updateForm("description", event.target.value)}
              className="form-control min-h-[100px] py-3 sm:min-h-[120px]"
              placeholder="Tuliskan deskripsi pekerjaan. HTML diperbolehkan jika diperlukan."
            />
          </label>

          <label className="block">
            <span className="form-label">Requirements</span>
            <textarea
              required
              value={form.requirements}
              onChange={(event) => updateForm("requirements", event.target.value)}
              className="form-control min-h-[100px] py-3 sm:min-h-[120px]"
              placeholder="Tuliskan requirement pekerjaan. HTML diperbolehkan jika diperlukan."
            />
          </label>

          <label className="block">
            <span className="form-label">Benefits</span>
            <textarea
              required
              value={form.benefits}
              onChange={(event) => updateForm("benefits", event.target.value)}
              className="form-control min-h-[100px] py-3 sm:min-h-[120px]"
              placeholder="Tuliskan benefit pekerjaan. HTML diperbolehkan jika diperlukan."
            />
          </label>
        </form>
      </Modal>
    </div>
  );
};

export default Loker;
