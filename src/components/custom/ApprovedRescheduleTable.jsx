import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { DateTime } from "luxon";
import Card from "@/components/ui/Card";
import Table from "@/components/globals/table/table";
import Icon from "@/components/ui/Icon";
import PaginationComponent from "@/components/globals/table/pagination";
import { buildWsUrl } from "@/utils/wsUrl";

const formatDate = (value) => {
  if (!value) return "-";
  let date = DateTime.fromISO(value);
  if (!date.isValid) {
    date = DateTime.fromSQL(value);
  }
  return date.isValid ? date.setLocale("id").toFormat("dd LLL yyyy") : value;
};

const formatTime = (value) => {
  if (!value) return "-";
  return String(value).replace(".", ":");
};

const WS_CLOSE_CODE_NORMAL = 1000;
const WS_RECONNECT_DELAY = 3000;

const extractReschedulePayload = (message) => {
  const queue = [message, message?.payload, message?.data];
  const visited = new Set();

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || visited.has(current)) {
      continue;
    }
    visited.add(current);

    if (Array.isArray(current)) {
      return { rows: current, meta: {} };
    }

    if (typeof current !== "object") {
      continue;
    }

    if (Array.isArray(current?.data)) {
      return { rows: current.data, meta: current?.meta ?? {} };
    }

    if (Array.isArray(current?.results)) {
      return { rows: current.results, meta: current?.meta ?? {} };
    }

    if (current?.data && typeof current.data === "object") {
      queue.push(current.data);
    }

    if (current?.payload && typeof current.payload === "object") {
      queue.push(current.payload);
    }
  }

  return null;
};

const ApprovedRescheduleTable = ({
  title = "Reschedule",
  subtitle = "Daftar reschedule yang sudah disetujui.",
  showSummary = true,
}) => {
  const [listData, setListData] = useState({ results: [], count: 0 });
  const [meta, setMeta] = useState({
    currentPage: 1,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [studentFilterInput, setStudentFilterInput] = useState("");
  const [trainerFilterInput, setTrainerFilterInput] = useState("");
  const [studentFilter, setStudentFilter] = useState("");
  const [trainerFilter, setTrainerFilter] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const wsEndpoint = useMemo(() => {
    const params = new URLSearchParams({
      page: String(pageIndex + 1),
      page_size: String(pageSize),
      filter_status: "approved",
    });

    const studentValue = studentFilter.trim();
    const trainerValue = trainerFilter.trim();
    if (studentValue) {
      params.set("filter_student", studentValue);
    }
    if (trainerValue) {
      params.set("filter_trainer", trainerValue);
    }

    return `/ws/reschedule/?${params.toString()}`;
  }, [pageIndex, pageSize, studentFilter, trainerFilter]);

  const applyReschedulePayload = useCallback(
    (message) => {
      const payload = message?.payload ?? message?.data ?? message ?? {};
      const extractedPayload = extractReschedulePayload(payload);
      if (!extractedPayload) {
        console.warn(
          "Ignored unknown approved reschedule websocket payload:",
          message,
        );
        return;
      }

      const { rows, meta: payloadMeta } = extractedPayload;
      const count =
        payloadMeta?.count ??
        payload?.count ??
        message?.count ??
        (Array.isArray(rows) ? rows.length : 0);
      const totalPages =
        payloadMeta?.total_pages ??
        payloadMeta?.page_count ??
        (count && pageSize ? Math.ceil(count / pageSize) : 0);

      setListData({
        results: Array.isArray(rows) ? rows : [],
        count,
      });
      setMeta({
        currentPage: payloadMeta?.current_page ?? pageIndex + 1,
        totalPages: totalPages ?? 0,
        hasNext:
          payloadMeta?.has_next ??
          (totalPages ? pageIndex + 1 < totalPages : false),
        hasPrev: payloadMeta?.has_prev ?? pageIndex > 0,
      });
      setLastUpdated(
        DateTime.now().setLocale("id").toFormat("dd LLL yyyy, HH:mm"),
      );
      setErrorMessage("");
    },
    [pageIndex, pageSize],
  );

  const closeSocket = useCallback(() => {
    if (!socketRef.current) {
      return;
    }

    const ws = socketRef.current;
    socketRef.current = null;
    ws.onopen = null;
    ws.onmessage = null;
    ws.onerror = null;
    ws.onclose = null;

    if (
      ws.readyState === WebSocket.OPEN ||
      ws.readyState === WebSocket.CONNECTING
    ) {
      ws.close(WS_CLOSE_CODE_NORMAL);
    }
  }, []);

  const connectSocket = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    setIsLoading(true);
    setErrorMessage("");
    closeSocket();

    const wsUrl = buildWsUrl(wsEndpoint);
    if (!wsUrl) {
      setIsLoading(false);
      setErrorMessage("Gagal membentuk URL websocket reschedule.");
      return;
    }

    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        applyReschedulePayload(message);
      } catch (error) {
        console.error(
          "Failed to parse approved reschedule websocket payload:",
          error,
        );
        setErrorMessage("Gagal membaca data websocket reschedule.");
      } finally {
        setIsLoading(false);
      }
    };

    ws.onerror = (error) => {
      console.error("Approved reschedule websocket error:", error);
      setIsLoading(false);
      setErrorMessage("Koneksi websocket reschedule bermasalah.");
    };

    ws.onclose = (event) => {
      if (socketRef.current === ws) {
        socketRef.current = null;
      }

      if (event.code !== WS_CLOSE_CODE_NORMAL) {
        reconnectTimeoutRef.current = setTimeout(
          () => connectSocket(),
          WS_RECONNECT_DELAY,
        );
      }
    };
  }, [applyReschedulePayload, closeSocket, wsEndpoint]);

  const fetchReschedule = useCallback(() => {
    setIsLoading(true);
    setErrorMessage("");
    connectSocket();
  }, [connectSocket]);

  useEffect(() => {
    connectSocket();
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      closeSocket();
    };
  }, [closeSocket, connectSocket]);

  const handleApplyFilter = () => {
    setStudentFilter(studentFilterInput);
    setTrainerFilter(trainerFilterInput);
    setPageIndex(0);
  };

  const handleResetFilter = () => {
    setStudentFilterInput("");
    setTrainerFilterInput("");
    setStudentFilter("");
    setTrainerFilter("");
    setPageIndex(0);
  };

  const columns = useMemo(
    () => [
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
        Cell: ({ row }) => {
          const meetingNumber =
            row.original?.origin_meet ??
            row.original?.meeting ??
            row.original?.meet ??
            "-";

          const isAllRemaining = meetingNumber === 99 || meetingNumber === "99";
          if (isAllRemaining) {
            return (
              <span
                title="Seluruh pertemuan sisa akan diubah jadwalnya"
                className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-700/30 dark:text-amber-300"
              >
                <span>Pindah Jadwal</span>
              </span>
            );
          }

          return (
            <span className="inline-flex min-w-[2.25rem] justify-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700 dark:bg-slate-700/50 dark:text-slate-200">
              {meetingNumber}
            </span>
          );
        },
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
    ],
    [],
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
      {showSummary && (
        <Card
          title={title}
          subtitle={subtitle}
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
                {listData.count}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200/80 bg-white p-3 dark:border-slate-700 dark:bg-slate-900/60">
              <p className="text-xs text-slate-500 dark:text-slate-300">
                Filter Siswa
              </p>
              <p className="mt-1 truncate text-sm font-medium text-slate-900 dark:text-white">
                {studentFilter || "Semua"}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200/80 bg-white p-3 dark:border-slate-700 dark:bg-slate-900/60">
              <p className="text-xs text-slate-500 dark:text-slate-300">
                Filter Pelatih
              </p>
              <p className="mt-1 truncate text-sm font-medium text-slate-900 dark:text-white">
                {trainerFilter || "Semua"}
              </p>
            </div>
            <div className="rounded-lg border border-emerald-200/80 bg-emerald-50/70 p-3 dark:border-emerald-500/30 dark:bg-emerald-500/10">
              <p className="text-xs text-emerald-700 dark:text-emerald-300">
                Status API
              </p>
              <p className="mt-1 text-sm font-semibold text-emerald-700 dark:text-emerald-200">
                Approved
              </p>
            </div>
          </div>
        </Card>
      )}

      <Card
        title={showSummary ? "Daftar Reschedule" : title}
        subtitle={showSummary ? undefined : subtitle}
        headerslot={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <div className="relative">
              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                <Icon icon="heroicons-outline:user" className="h-4 w-4" />
              </span>
              <input
                value={studentFilterInput}
                onChange={(event) => setStudentFilterInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    handleApplyFilter();
                  }
                }}
                placeholder="Filter siswa"
                className="h-9 w-44 rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-primary-300 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="relative">
              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                <Icon
                  icon="heroicons-outline:academic-cap"
                  className="h-4 w-4"
                />
              </span>
              <input
                value={trainerFilterInput}
                onChange={(event) => setTrainerFilterInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    handleApplyFilter();
                  }
                }}
                placeholder="Filter pelatih"
                className="h-9 w-44 rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-primary-300 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>

            <button
              type="button"
              onClick={handleApplyFilter}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary-500 px-3 text-sm font-medium text-white transition hover:bg-primary-600"
            >
              <Icon icon="heroicons-outline:funnel" className="h-4 w-4" />
              Terapkan
            </button>

            <button
              type="button"
              onClick={handleResetFilter}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:border-primary-200 hover:text-primary-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              <Icon icon="heroicons-outline:x-mark" className="h-4 w-4" />
              Reset
            </button>

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
        ) : listData.results.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300">
            Tidak ada data reschedule approved.
          </div>
        ) : (
          <>
            <Table
              tableId={"approved-reschedule"}
              listData={listData}
              listColumn={columns}
              isAction={false}
              isCheckbox={false}
              isPagination={false}
            />

            <PaginationComponent
              pageSize={pageSize}
              pageIndex={pageIndex}
              pageCount={pageCount}
              canPreviousPage={meta.hasPrev || pageIndex > 0}
              canNextPage={
                meta.hasNext ||
                (pageCount > 0 ? pageIndex < pageCount - 1 : false)
              }
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

export default ApprovedRescheduleTable;
