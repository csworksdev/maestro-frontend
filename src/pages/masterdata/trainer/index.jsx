import React, { useEffect, useRef, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
  DeleteTrainer,
  getTrainerAll,
  resignTrainer as resignTrainerRequest,
} from "@/axios/masterdata/trainer";
import { DateTime } from "luxon";
import Search from "@/components/globals/table/search";
import PaginationComponent from "@/components/globals/table/pagination";
import SkeletionTable from "@/components/skeleton/Table";
import { toProperCase } from "@/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { setLoading, useLoadingStore } from "@/redux/slicers/loadingSlice";
import Icon from "@/components/ui/Icon";
import Modal from "@/components/ui/Modal";
import DefaultAvatar from "@/assets/images/all-img/user.png";
import { buildWsUrl } from "@/utils/wsUrl";

const TRAINER_QUERY_ROOT = ["trainer"];

const getTrainerAvatar = (trainer) => {
  const avatar =
    trainer?.avatar ||
    trainer?.avatar_url ||
    trainer?.photo ||
    trainer?.photo_url ||
    trainer?.image ||
    trainer?.image_url ||
    trainer?.profile_picture ||
    trainer?.profile_picture_url ||
    trainer?.picture ||
    trainer?.trainer_avatar;

  const rawUrl =
    typeof avatar === "string" ? avatar : avatar?.url || avatar?.file || "";

  if (!rawUrl) return DefaultAvatar;
  if (/^(https?:|data:|blob:)/.test(rawUrl)) return rawUrl;

  const baseUrl = import.meta.env.VITE_API_MEDIA_URL?.replace(/\/$/, "");
  return baseUrl
    ? `${baseUrl}${rawUrl.startsWith("/") ? "" : "/"}${rawUrl}`
    : rawUrl;
};

const getTrainerAge = (dob) => {
  if (!dob) return "-";

  const birthDate = DateTime.fromISO(dob);
  if (!birthDate.isValid) return "-";

  return `${Math.floor(DateTime.now().diff(birthDate, ["years"]).years)} Tahun`;
};

const formatRegDate = (regDate) => {
  if (!regDate) return "-";

  const date = DateTime.fromISO(regDate);
  if (!date.isValid) return "-";

  return date.setLocale("id").toFormat("dd LLL yyyy");
};

const getMembershipDuration = (regDate) => {
  if (!regDate) return "-";

  const startDate = DateTime.fromISO(regDate).startOf("day");
  const today = DateTime.now().startOf("day");

  if (!startDate.isValid || startDate > today) return "-";

  const duration = today
    .diff(startDate, ["years", "months", "days"])
    .toObject();
  const years = Math.floor(duration.years || 0);
  const months = Math.floor(duration.months || 0);
  const days = Math.floor(duration.days || 0);

  return `${years} tahun, ${months} bulan, ${days} hari`;
};

const formatTrainerCapacity = (capacity) => {
  if (capacity === null || capacity === undefined || capacity === "") return "-";
  return `${capacity} Jam / Minggu`;
};

const normalizeLookupKey = (value) => {
  if (value === null || value === undefined) return "";
  return String(value).trim().toLowerCase();
};

const getTrainerLookupKeys = (trainer) =>
  [
    trainer?.trainer_id,
    trainer?.trainerId,
    trainer?.id,
    trainer?.fullname,
    trainer?.full_name,
    trainer?.name,
    trainer?.nickname,
  ]
    .map(normalizeLookupKey)
    .filter(Boolean);

const formatContractTypeDisplay = (value) => {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]/g, "");

  if (normalized === "fulltime") return "Fulltime";
  if (normalized === "hybrid") return "Hybrid";
  if (normalized === "freelance") return "Freelance";
  if (normalized === "true") return "Fulltime";
  if (normalized === "false") return "Freelance";

  return value || "-";
};

const normalizeContractTypeKey = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]/g, "");

const getTrainerWorkTypeValue = (trainer) => {
  const contractType =
    trainer?.contract_type_display ||
    trainer?.contract_type ||
    (typeof trainer?.is_fulltime === "string"
      ? trainer.is_fulltime
      : trainer?.is_fulltime === true
        ? "fulltime"
        : trainer?.is_fulltime === false
          ? "freelance"
          : null);

  if (!contractType) return "-";

  const normalized = normalizeContractTypeKey(contractType);
  if (
    normalized === "fulltime" ||
    normalized === "hybrid" ||
    normalized === "freelance"
  ) {
    return normalized;
  }
  if (normalized === "true") return "fulltime";
  if (normalized === "false") return "freelance";

  return "-";
};

const collectScheduleWorkTypes = (value, result = {}) => {
  if (Array.isArray(value)) {
    value.forEach((item) => collectScheduleWorkTypes(item, result));
    return result;
  }

  if (!value || typeof value !== "object") {
    return result;
  }

  const trainer =
    value.trainer && typeof value.trainer === "object" ? value.trainer : null;
  const workType =
    getTrainerWorkTypeValue(value) || getTrainerWorkTypeValue(trainer);

  if (workType) {
    getTrainerLookupKeys(value).forEach((key) => {
      result[key] = workType;
    });
    getTrainerLookupKeys(trainer).forEach((key) => {
      result[key] = workType;
    });
  }

  Object.values(value).forEach((item) =>
    collectScheduleWorkTypes(item, result),
  );
  return result;
};

const getTrainerWorkType = (trainer, scheduleWorkTypes) => {
  const scheduleWorkType = getTrainerLookupKeys(trainer)
    .map((key) => scheduleWorkTypes[key])
    .find(Boolean);

  return scheduleWorkType || getTrainerWorkTypeValue(trainer) || "-";
};

const InfoItem = ({
  icon,
  label,
  value,
  className = "",
  valueClassName = "",
}) => (
  <div
    className={`rounded border border-slate-100 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-900 ${className}`}
  >
    <div className="mb-1 flex items-start gap-1.5 text-[11px] font-medium leading-snug text-slate-400">
      <Icon icon={icon} className="text-sm" />
      <span>{label}</span>
    </div>
    <p
      className={`text-sm font-semibold text-slate-700 dark:text-slate-200 ${
        valueClassName || "truncate"
      }`}
    >
      {value || "-"}
    </p>
  </div>
);

const Trainer = () => {
  const navigate = useNavigate();
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [previewAvatar, setPreviewAvatar] = useState(null);
  const [resignTrainer, setResignTrainer] = useState(null);
  const [resignDate, setResignDate] = useState("");
  const [scheduleWorkTypes, setScheduleWorkTypes] = useState({});
  const scheduleSocketRef = useRef(null);
  const queryClient = useQueryClient();

  const trainerQuery = useQuery({
    queryKey: [...TRAINER_QUERY_ROOT, { pageIndex, pageSize, searchQuery }],
    queryFn: async () => {
      const params = {
        page: pageIndex + 1,
        page_size: pageSize,
        search: searchQuery,
      };
      const res = await getTrainerAll(params);
      return res.data;
    },
    keepPreviousData: true,
  });

  const listData = trainerQuery.data ?? { count: 0, results: [] };
  const isLoading = useLoadingStore((state) => state.isLoading);

  useEffect(() => {
    setLoading(trainerQuery.isFetching);
  }, [trainerQuery.isFetching]);

  useEffect(() => {
    const wsUrl = buildWsUrl("/ws/schedule/");
    if (!wsUrl) {
      return undefined;
    }

    const ws = new WebSocket(wsUrl);
    scheduleSocketRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        const payload = message?.payload ?? message?.data ?? message;
        const nextWorkTypes = collectScheduleWorkTypes(payload);

        if (Object.keys(nextWorkTypes).length) {
          setScheduleWorkTypes((current) => ({
            ...current,
            ...nextWorkTypes,
          }));
        }
      } catch (error) {
        console.error(
          "Failed to parse trainer work type websocket payload:",
          error,
        );
      }
    };

    ws.onclose = () => {
      if (scheduleSocketRef.current === ws) {
        scheduleSocketRef.current = null;
      }
    };

    return () => {
      ws.onmessage = null;
      ws.onclose = null;
      if (
        ws.readyState === WebSocket.OPEN ||
        ws.readyState === WebSocket.CONNECTING
      ) {
        ws.close(1000);
      }
      if (scheduleSocketRef.current === ws) {
        scheduleSocketRef.current = null;
      }
    };
  }, []);

  const handlePageChange = (page) => {
    setPageIndex(page);
  };

  const handlePageSizeChange = (size) => {
    setPageSize(size);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    setPageIndex(0); // Reset to first page on search
  };

  const deleteMutation = useMutation({
    mutationFn: (id) => DeleteTrainer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRAINER_QUERY_ROOT });
    },
  });

  const resignMutation = useMutation({
    mutationFn: ({ trainerId, resignationDate }) =>
      resignTrainerRequest(trainerId, resignationDate),
  });

  const handleDelete = (e) => {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#22c55e",
      cancelButtonColor: "#ef4444",
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        deleteMutation.mutate(e.trainer_id, {
          onSuccess: (res) => {
            if (res?.status) {
              Swal.fire("Deleted!", "Your file has been deleted.", "success");
            }
          },
          onError: (error) => {
            console.error("Failed to delete trainer:", error);
          },
        });
      }
    });
  };

  const handleEdit = (e) => {
    navigate("Edit", {
      state: {
        isupdate: "true",
        data: e,
      },
    });
  };

  const closeResignModal = () => {
    setResignTrainer(null);
    setResignDate("");
  };

  const handleResignSubmit = async (event) => {
    event.preventDefault();
    if (!resignDate) {
      Swal.fire({
        title: "Tanggal belum diisi",
        text: "Silakan pilih tanggal resign terlebih dahulu.",
        icon: "warning",
        confirmButtonColor: "#22c55e",
      });
      return;
    }

    const formattedResignDate = DateTime.fromISO(resignDate)
      .setLocale("id")
      .toFormat("dd LLLL yyyy");
    const trainerName =
      toProperCase(resignTrainer?.fullname || "") || "Pelatih ini";
    const confirmation = await Swal.fire({
      title: "Konfirmasi resign",
      text: `Yakin ${trainerName} resign pada ${formattedResignDate}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#22c55e",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Ya, simpan",
      cancelButtonText: "Batal",
      didOpen: () => {
        Swal.getContainer()?.style.setProperty("z-index", "100000");
      },
    });

    if (!confirmation.isConfirmed) return;

    try {
      await resignMutation.mutateAsync({
        trainerId: resignTrainer?.trainer_id,
        resignationDate: resignDate,
      });
      await queryClient.invalidateQueries({ queryKey: TRAINER_QUERY_ROOT });
      closeResignModal();
      Swal.fire({
        title: "Resign berhasil",
        text: `${trainerName} tercatat resign pada ${formattedResignDate}.`,
        icon: "success",
        confirmButtonColor: "#22c55e",
      });
    } catch (error) {
      const responseData = error?.response?.data;
      const errorMessage =
        responseData?.message ||
        responseData?.detail ||
        (typeof responseData === "string" ? responseData : null) ||
        error?.message ||
        "Data resign gagal disimpan. Silakan coba lagi.";

      Swal.fire({
        title: "Resign gagal",
        text: errorMessage,
        icon: "error",
        confirmButtonColor: "#22c55e",
        didOpen: () => {
          Swal.getContainer()?.style.setProperty("z-index", "100000");
        },
      });
    }
  };

  return (
    <div className="grid grid-cols-1 justify-end">
      <Card
        title="Trainer"
        headerslot={
          <Button className="btn-primary ">
            <Link to="add" isupdate="false">
              Tambah
            </Link>
          </Button>
        }
      >
        <Search searchValue={searchQuery} handleSearch={handleSearch} />
        {trainerQuery.isLoading ? (
          <SkeletionTable />
        ) : (
          <>
            {isLoading && (
              <div className="mb-4 text-sm text-slate-500 dark:text-slate-400">
                Memuat data trainer...
              </div>
            )}
            {listData.results?.length ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {listData.results.map((trainer) => {
                  const avatarUrl = getTrainerAvatar(trainer);
                  const trainerName =
                    toProperCase(trainer?.fullname || "") || "Tanpa Nama";
                  const gender =
                    trainer?.gender === "L"
                      ? "Laki-laki"
                      : trainer?.gender === "P"
                        ? "Perempuan"
                        : "-";

                  return (
                    <div
                      key={trainer.trainer_id}
                      className="flex min-h-[360px] flex-col overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
                    >
                      <div className="relative bg-slate-50 px-4 pb-5 pt-4 dark:bg-slate-900">
                        <div className="absolute right-4 top-4">
                          <span
                            className={`inline-flex rounded px-2 py-1 text-xs font-semibold ${
                              trainer?.is_active
                                ? "bg-success-500 text-success-500 bg-opacity-20"
                                : "bg-danger-500 text-danger-500 bg-opacity-20"
                            }`}
                          >
                            {trainer?.is_active ? "Aktif" : "Tidak Aktif"}
                          </span>
                        </div>
                        <div className="flex flex-col items-center pt-2 text-center">
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewAvatar({
                                src: avatarUrl,
                                name: trainerName,
                              })
                            }
                            className="h-24 w-24 overflow-hidden rounded-full border-4 border-white bg-slate-100 shadow-sm ring-1 ring-slate-200 dark:border-slate-800 dark:bg-slate-700 dark:ring-slate-700"
                            aria-label={`Lihat avatar ${trainerName}`}
                          >
                            <img
                              src={avatarUrl}
                              alt={trainerName}
                              className="h-full w-full object-cover"
                              onError={(event) => {
                                event.currentTarget.src = DefaultAvatar;
                              }}
                            />
                          </button>
                          <h3 className="mt-3 max-w-full truncate text-base font-semibold text-slate-900 dark:text-white">
                            {trainerName}
                          </h3>
                          <p className="max-w-full truncate text-sm text-slate-500 dark:text-slate-400">
                            {trainer?.nickname || "-"}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-1 flex-col p-4">
                        <div className="grid grid-cols-2 gap-2">
                          <InfoItem
                            icon="heroicons-outline:user"
                            label="Gender"
                            value={gender}
                          />
                          <InfoItem
                            icon="heroicons-outline:cake"
                            label="Usia"
                            value={getTrainerAge(trainer?.dob)}
                          />
                          <InfoItem
                            icon="heroicons-outline:map-pin"
                            label="Cabang"
                            value={trainer?.branch_name}
                            className="col-span-2"
                          />
                          <InfoItem
                            icon="heroicons-outline:briefcase"
                            label="Tipe Kerja"
                            value={formatContractTypeDisplay(
                              getTrainerWorkTypeValue(trainer),
                            )}
                          />
                          <InfoItem
                            icon="heroicons-outline:calendar"
                            label="Slot Melatih"
                            value={formatTrainerCapacity(
                              trainer?.capacity_per_week,
                            )}
                          />
                          <InfoItem
                            icon="heroicons-outline:calendar-days"
                            label="Reg Date"
                            value={formatRegDate(trainer?.reg_date)}
                            className="col-span-2"
                          />
                          <InfoItem
                            icon="heroicons-outline:clock"
                            label="Bergabung"
                            value={getMembershipDuration(trainer?.reg_date)}
                            className="col-span-2"
                            valueClassName="whitespace-normal"
                          />
                        </div>

                        <div className="mt-auto flex items-center justify-between gap-2 border-t border-slate-100 pt-4 dark:border-slate-700">
                          <button
                            type="button"
                            onClick={() => setResignTrainer(trainer)}
                            className="inline-flex h-9 items-center justify-center gap-1.5 rounded border border-blue-500/20 bg-blue-500/10 px-3 text-sm font-medium text-blue-600 transition-colors hover:border-blue-500/30 hover:bg-blue-500/20 dark:border-blue-400/30 dark:bg-blue-500/15 dark:text-blue-400 dark:hover:bg-blue-500/25"
                            aria-label={`Resign ${trainerName}`}
                          >
                            <Icon icon="heroicons-outline:arrow-left-on-rectangle" />
                            Resign
                          </button>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleEdit(trainer)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200"
                              aria-label={`Edit ${trainerName}`}
                            >
                              <Icon icon="heroicons:pencil-square" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(trainer)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded bg-danger-500 bg-opacity-20 text-danger-500 hover:bg-opacity-100 hover:text-white"
                              aria-label={`Hapus ${trainerName}`}
                            >
                              <Icon icon="heroicons-outline:trash" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-md border border-slate-200 py-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                Data trainer tidak ditemukan.
              </div>
            )}
            <PaginationComponent
              pageSize={pageSize}
              pageIndex={pageIndex}
              pageCount={Math.ceil(listData.count / pageSize)}
              canPreviousPage={pageIndex > 0}
              canNextPage={pageIndex < Math.ceil(listData.count / pageSize) - 1}
              gotoPage={handlePageChange}
              previousPage={() => handlePageChange(pageIndex - 1)}
              nextPage={() => handlePageChange(pageIndex + 1)}
              setPageSize={handlePageSizeChange}
            />
          </>
        )}
      </Card>
      <Modal
        activeModal={Boolean(resignTrainer)}
        onClose={closeResignModal}
        title="Resign Pelatih"
        className="max-w-md"
        centered
      >
        <form onSubmit={handleResignSubmit}>
          <p className="mb-5 text-sm text-slate-600 dark:text-slate-300">
            Tentukan tanggal resign untuk{" "}
            <span className="font-semibold text-slate-900 dark:text-white">
              {toProperCase(resignTrainer?.fullname || "") || "pelatih ini"}
            </span>
            .
          </p>
          <label htmlFor="trainer-resign-date" className="form-label">
            Tanggal Resign <span className="text-danger-500">*</span>
          </label>
          <input
            id="trainer-resign-date"
            type="date"
            value={resignDate}
            onChange={(event) => setResignDate(event.target.value)}
            className="form-control"
            required
            autoFocus
          />
          <div className="mt-6 flex justify-end gap-3">
            <Button
              type="button"
              text="Batal"
              className="btn-outline-secondary"
              onClick={closeResignModal}
            />
            <Button
              type="submit"
              text="Simpan"
              className="btn-success"
              disabled={!resignDate || resignMutation.isPending}
              isLoading={resignMutation.isPending}
            />
          </div>
        </form>
      </Modal>
      {previewAvatar && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setPreviewAvatar(null)}
        >
          <button
            type="button"
            className="absolute right-6 top-6 text-3xl leading-none text-white"
            aria-label="Tutup preview avatar"
            onClick={(event) => {
              event.stopPropagation();
              setPreviewAvatar(null);
            }}
          >
            <Icon icon="heroicons-outline:x" />
          </button>
          <div
            className="max-h-full max-w-full rounded-md bg-white p-2 dark:bg-slate-800"
            onClick={(event) => event.stopPropagation()}
          >
            <img
              src={previewAvatar.src}
              alt={previewAvatar.name}
              className="max-h-[80vh] max-w-[90vw] object-contain"
              onError={(event) => {
                event.currentTarget.src = DefaultAvatar;
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Trainer;
