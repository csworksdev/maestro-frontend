import React, { useCallback, useEffect, useMemo, useState } from "react";
import { DateTime } from "luxon";
import Swal from "sweetalert2";
import Card from "@/components/ui/Card";
import Table from "@/components/globals/table/table";
import Icon from "@/components/ui/Icon";
import PaginationComponent from "@/components/globals/table/pagination";
import { approveRescheduleOpx, getRescheduleAllOpx } from "@/axios/reschedule";

const statusOptions = [
  { value: "all", label: "Semua" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approve" },
  { value: "rejected", label: "Reject" },
];

const parseBoolean = (value) => {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();
  return ["true", "1", "yes"].includes(normalized);
};

const formatDate = (value) => {
  if (!value) return "-";
  let date = DateTime.fromISO(value);
  if (!date.isValid) {
    date = DateTime.fromSQL(value);
  }
  return date.isValid ? date.setLocale("id").toFormat("dd LLL yyyy") : value;
};

const formatDateTime = (value) => {
  if (!value) return "-";
  let date = DateTime.fromSQL(value);
  if (!date.isValid) {
    date = DateTime.fromISO(value);
  }
  return date.isValid
    ? date.setLocale("id").toFormat("dd LLL yyyy, HH:mm")
    : value;
};

const formatTime = (value) => {
  if (!value) return "-";
  return String(value).replace(".", ":");
};

const shortId = (value) => {
  if (!value) return "-";
  const id = String(value);
  if (id.length <= 10) return id;
  return `${id.slice(0, 8)}...`;
};

const normalizeStatus = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const isPendingStatus = (status) => {
  const normalized = normalizeStatus(status);
  return (
    normalized.includes("menunggu") ||
    normalized.includes("pending") ||
    normalized.includes("wait")
  );
};

const isApprovedStatus = (status) => {
  const normalized = normalizeStatus(status);
  return normalized.includes("setujui") || normalized.includes("approved");
};

const isRejectedStatus = (status) => {
  const normalized = normalizeStatus(status);
  return normalized.includes("tolak") || normalized.includes("reject");
};

const matchStatusFilter = (status, selectedStatus) => {
  if (selectedStatus === "all") return true;
  if (selectedStatus === "pending") return isPendingStatus(status);
  if (selectedStatus === "approved") return isApprovedStatus(status);
  if (selectedStatus === "rejected") return isRejectedStatus(status);
  return true;
};

const getStatusClassName = (status) => {
  const normalized = normalizeStatus(status);
  if (normalized.includes("setujui") || normalized.includes("approved")) {
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300";
  }
  if (
    normalized.includes("menunggu") ||
    normalized.includes("pending") ||
    normalized.includes("wait")
  ) {
    return "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300";
  }
  if (normalized.includes("tolak") || normalized.includes("reject")) {
    return "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300";
  }
  return "bg-slate-100 text-slate-700 dark:bg-slate-700/60 dark:text-slate-200";
};

const Reschedule = () => {
  const [listData, setListData] = useState({ results: [], count: 0 });
  const [meta, setMeta] = useState({
    currentPage: 1,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");
  const [processingIds, setProcessingIds] = useState({});

  const fetchReschedule = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const response = await getRescheduleAllOpx({
        page: pageIndex + 1,
        page_size: pageSize,
      });
      const payload = response?.data ?? {};
      const rows = Array.isArray(payload?.data) ? payload.data : [];
      const payloadMeta = payload?.meta ?? {};
      const count =
        payloadMeta?.count ??
        payload?.count ??
        (Array.isArray(rows) ? rows.length : 0);
      const totalPages =
        payloadMeta?.total_pages ??
        payloadMeta?.page_count ??
        (count && pageSize ? Math.ceil(count / pageSize) : 0);

      setListData({
        results: rows,
        count,
      });
      setMeta({
        currentPage: payloadMeta?.current_page ?? pageIndex + 1,
        totalPages: totalPages ?? 0,
        hasNext: payloadMeta?.has_next ?? false,
        hasPrev: payloadMeta?.has_prev ?? false,
      });
      setLastUpdated(
        DateTime.now().setLocale("id").toFormat("dd LLL yyyy, HH:mm"),
      );
    } catch (error) {
      console.error("Error fetching reschedules:", error);
      setListData({ results: [], count: 0 });
      setMeta({
        currentPage: 1,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      });
      setErrorMessage("Gagal memuat data reschedule.");
    } finally {
      setIsLoading(false);
    }
  }, [pageIndex, pageSize]);

  useEffect(() => {
    fetchReschedule();
  }, [fetchReschedule]);

  const filteredResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return (listData?.results ?? []).filter((item) => {
      const matchesStatus = matchStatusFilter(item?.status, selectedStatus);
      if (!matchesStatus) return false;
      if (!query) return true;

      const searchableFields = [
        item?.student_name,
        item?.trainer_name,
        item?.created_by_name,
        item?.submission_reason,
        item?.status,
        item?.reschedule_day,
        item?.origin_day,
      ]
        .filter(Boolean)
        .map((value) => String(value).toLowerCase());

      return searchableFields.some((value) => value.includes(query));
    });
  }, [listData?.results, searchQuery, selectedStatus]);

  const summary = useMemo(() => {
    const base = {
      total: filteredResults.length,
      pending: 0,
      approved: 0,
      rejected: 0,
    };

    filteredResults.forEach((item) => {
      const status = normalizeStatus(item?.status);
      if (
        status.includes("menunggu") ||
        status.includes("pending") ||
        status.includes("wait")
      ) {
        base.pending += 1;
      } else if (status.includes("setujui") || status.includes("approved")) {
        base.approved += 1;
      } else if (status.includes("tolak") || status.includes("reject")) {
        base.rejected += 1;
      }
    });
    return base;
  }, [filteredResults]);

  const handleApproval = useCallback(
    async (item, isApproved = false) => {
      const rescheduleId = item?.reschedule_id;
      if (!rescheduleId) return;

      const actionLabel = isApproved ? "setujui" : "tolak";
      const confirm = await Swal.fire({
        title: `Yakin ingin ${actionLabel} pengajuan ini?`,
        text: `${item?.student_name || "-"} - ${item?.trainer_name || "-"}`,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Ya, lanjutkan",
        cancelButtonText: "Batal",
      });
      if (!confirm.isConfirmed) return;

      setProcessingIds((prev) => ({ ...prev, [rescheduleId]: true }));
      try {
        await approveRescheduleOpx(rescheduleId, {
          status: isApproved ? "approved" : "rejected",
        });

        await Swal.fire(
          "Berhasil",
          `Pengajuan berhasil di${isApproved ? "setujui" : "tolak"}.`,
          "success",
        );

        fetchReschedule();
      } catch (error) {
        console.error("Error approving reschedule:", error);
        const message =
          error?.response?.data?.message ||
          "Aksi gagal diproses. Silakan coba lagi.";
        Swal.fire("Gagal", message, "error");
      } finally {
        setProcessingIds((prev) => {
          const next = { ...prev };
          delete next[rescheduleId];
          return next;
        });
      }
    },
    [fetchReschedule],
  );

  const columns = useMemo(
    () => [
      //   {
      //     Header: "ID",
      //     accessor: "reschedule_id",
      //     Cell: ({ value }) => (
      //       <span className="font-mono text-xs text-slate-500 dark:text-slate-300">
      //         {shortId(value)}
      //       </span>
      //     ),
      //   },
      {
        Header: "Siswa",
        accessor: "student_name",
        Cell: ({ value }) => value || "-",
      },
      {
        Header: "Pelatih",
        accessor: "trainer_name",
        Cell: ({ value }) => value || "-",
      },
      {
        Header: "Pertemuan",
        accessor: "origin_meet",
        Cell: ({ value }) => (
          <span className="inline-flex min-w-[2.25rem] justify-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700 dark:bg-slate-700/50 dark:text-slate-200">
            {value ?? "-"}
          </span>
        ),
      },
      {
        Header: "Jadwal Asal",
        accessor: "origin_schedule_date",
        Cell: ({ row }) => {
          const date = formatDate(row.original?.origin_schedule_date);
          const day = row.original?.origin_day || "-";
          const time = formatTime(row.original?.origin_time);
          return (
            <div className="min-w-[9rem]">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-100">
                {day}, {time}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-300">
                {date}
              </p>
            </div>
          );
        },
      },
      {
        Header: "Jadwal Reschedule",
        accessor: "reschedule_date",
        Cell: ({ row }) => {
          const date = formatDate(row.original?.reschedule_date);
          const day = row.original?.reschedule_day || "-";
          const time = formatTime(row.original?.reschedule_time);
          return (
            <div className="min-w-[9rem]">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-100">
                {day}, {time}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-300">
                {date}
              </p>
            </div>
          );
        },
      },
      {
        Header: "Status",
        accessor: "status",
        Cell: ({ value }) => (
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClassName(
              value,
            )}`}
          >
            {value || "-"}
          </span>
        ),
      },

      //   {
      //     Header: "Pengaju",
      //     accessor: "created_by_name",
      //     Cell: ({ row }) => {
      //       const submitter = row.original?.created_by_name || "-";
      //       const fromCoach = parseBoolean(row.original?.from_coach);
      //       return (
      //         <div className="min-w-[8rem]">
      //           <p className="text-sm font-medium text-slate-700 dark:text-slate-100">
      //             {submitter}
      //           </p>
      //           <span className="text-xs text-slate-500 dark:text-slate-300">
      //             {fromCoach ? "Dari coach" : "Dari admin"}
      //           </span>
      //         </div>
      //       );
      //     },
      //   },
      {
        Header: "Dibuat",
        accessor: "created_at",
        Cell: ({ value }) => formatDateTime(value),
      },
      {
        Header: "Approval",
        accessor: "approved_at",
        Cell: ({ row }) => (
          <div className="min-w-[9rem]">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-100">
              {row.original?.approved_by_name || "-"}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-300">
              {formatDateTime(row.original?.approved_at)}
            </p>
          </div>
        ),
      },
      {
        Header: "Alasan",
        accessor: "submission_reason",
        Cell: ({ value }) => (
          <p className="max-w-[16rem] whitespace-normal text-sm text-slate-700 dark:text-slate-200">
            {value || "-"}
          </p>
        ),
      },
      {
        Header: "Aksi",
        accessor: "action",
        canSort: false,
        Cell: ({ row }) => {
          const status = row.original?.status;
          const rescheduleId = row.original?.reschedule_id;
          if (!isPendingStatus(status) || !rescheduleId) {
            return null;
          }

          const isProcessing = Boolean(processingIds[rescheduleId]);

          return (
            <div className="flex min-w-[8.25rem] flex-col gap-2">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => handleApproval(row.original, true)}
                className="inline-flex items-center justify-center rounded-md bg-emerald-500 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isProcessing ? "Proses..." : "Setujui"}
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => handleApproval(row.original, false)}
                className="inline-flex items-center justify-center rounded-md bg-rose-500 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isProcessing ? "Proses..." : "Tolak"}
              </button>
            </div>
          );
        },
      },
    ],
    [handleApproval, processingIds],
  );

  const tableData = useMemo(
    () => ({
      results: filteredResults,
      count: filteredResults.length,
    }),
    [filteredResults],
  );

  const pageCount = useMemo(() => {
    if (typeof meta?.totalPages === "number" && meta.totalPages > 0) {
      return meta.totalPages;
    }
    if (!listData?.count || !pageSize) return 0;
    return Math.ceil(listData.count / pageSize);
  }, [listData?.count, meta?.totalPages, pageSize]);

  return (
    <div className="space-y-5">
      <Card
        title="Reschedule"
        subtitle="Daftar pengajuan perubahan jadwal latihan."
        headerslot={
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-300">
            <Icon icon="heroicons-outline:clock" className="h-4 w-4" />
            <span>
              {lastUpdated
                ? `Terakhir diperbarui ${lastUpdated}`
                : "Belum diperbarui"}
            </span>
          </div>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-lg border border-slate-200/80 bg-white p-3 dark:border-slate-700 dark:bg-slate-900/60">
            <p className="text-xs text-slate-500 dark:text-slate-300">
              Total Data
            </p>
            <p className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">
              {summary.total}
            </p>
          </div>
          <div className="rounded-lg border border-amber-200/80 bg-amber-50/70 p-3 dark:border-amber-500/30 dark:bg-amber-500/10">
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Menunggu
            </p>
            <p className="mt-1 text-xl font-semibold text-amber-700 dark:text-amber-200">
              {summary.pending}
            </p>
          </div>
          <div className="rounded-lg border border-emerald-200/80 bg-emerald-50/70 p-3 dark:border-emerald-500/30 dark:bg-emerald-500/10">
            <p className="text-xs text-emerald-700 dark:text-emerald-300">
              Disetujui
            </p>
            <p className="mt-1 text-xl font-semibold text-emerald-700 dark:text-emerald-200">
              {summary.approved}
            </p>
          </div>
          <div className="rounded-lg border border-rose-200/80 bg-rose-50/70 p-3 dark:border-rose-500/30 dark:bg-rose-500/10">
            <p className="text-xs text-rose-700 dark:text-rose-300">Ditolak</p>
            <p className="mt-1 text-xl font-semibold text-rose-700 dark:text-rose-200">
              {summary.rejected}
            </p>
          </div>
        </div>
      </Card>

      <Card
        title="Daftar Pengajuan"
        headerslot={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-900">
              {statusOptions.map((status) => (
                <button
                  key={status.value}
                  type="button"
                  onClick={() => setSelectedStatus(status.value)}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                    selectedStatus === status.value
                      ? "bg-primary-500 text-white"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                  }`}
                >
                  {status.label}
                </button>
              ))}
            </div>
            <div className="relative">
              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                <Icon
                  icon="heroicons-outline:magnifying-glass"
                  className="h-4 w-4"
                />
              </span>
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Cari siswa/pelatih"
                className="h-9 w-56 rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-primary-300 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>
            <button
              type="button"
              onClick={fetchReschedule}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:border-primary-200 hover:text-primary-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              <Icon icon="heroicons-outline:arrow-path" className="h-4 w-4" />
              Refresh
            </button>
          </div>
        }
      >
        {isLoading && listData.results.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300">
            Memuat data reschedule...
          </div>
        ) : errorMessage ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-8 text-center text-sm text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200">
            {errorMessage}
          </div>
        ) : filteredResults.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300">
            Tidak ada data yang cocok dengan filter.
          </div>
        ) : (
          <>
            <Table
              listData={tableData}
              listColumn={columns}
              isAction={false}
              isCheckbox={false}
              isPagination={false}
            />
            <PaginationComponent
              pageSize={pageSize}
              pageIndex={pageIndex}
              pageCount={pageCount}
              canPreviousPage={meta.hasPrev}
              canNextPage={meta.hasNext}
              gotoPage={(newPage) => setPageIndex(newPage)}
              previousPage={() => setPageIndex((prev) => Math.max(0, prev - 1))}
              nextPage={() =>
                setPageIndex((prev) =>
                  pageCount ? Math.min(pageCount - 1, prev + 1) : prev + 1,
                )
              }
              setPageSize={(size) => {
                setPageSize(size);
                setPageIndex(0);
              }}
            />
          </>
        )}
      </Card>
    </div>
  );
};

export default Reschedule;
