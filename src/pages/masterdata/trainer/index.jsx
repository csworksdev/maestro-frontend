import React, { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { DeleteTrainer, getTrainerAll } from "@/axios/masterdata/trainer";
import { DateTime } from "luxon";
import Search from "@/components/globals/table/search";
import PaginationComponent from "@/components/globals/table/pagination";
import SkeletionTable from "@/components/skeleton/Table";
import { toProperCase } from "@/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { setLoading, useLoadingStore } from "@/redux/slicers/loadingSlice";
import Icon from "@/components/ui/Icon";
import DefaultAvatar from "@/assets/images/all-img/user.png";

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

  const duration = today.diff(startDate, ["years", "months", "days"]).toObject();
  const years = Math.floor(duration.years || 0);
  const months = Math.floor(duration.months || 0);
  const days = Math.floor(duration.days || 0);

  return `${years} tahun, ${months} bulan, ${days} hari`;
};

const InfoItem = ({ icon, label, value, className = "", valueClassName = "" }) => (
  <div
    className={`rounded border border-slate-100 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-900 ${className}`}
  >
    <div className="mb-1 flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
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
  const queryClient = useQueryClient();

  const trainerQuery = useQuery({
    queryKey: ["trainer", { pageIndex, pageSize, searchQuery }],
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
      queryClient.invalidateQueries({ queryKey: ["trainer"] });
    },
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
                            value={trainer?.is_fulltime ? "Fulltime" : "Freelance"}
                            className="col-span-2"
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

                        <div className="mt-auto flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-700">
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
