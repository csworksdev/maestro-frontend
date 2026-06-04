import React, { useMemo, useState } from "react";
import Card from "@/components/ui/Card";
import Table from "@/components/globals/table/table";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import SkeletionTable from "@/components/skeleton/Table";
import { Icon } from "@iconify/react";
import Tooltip from "@/components/ui/Tooltip";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPeriodisasiAll } from "@/axios/referensi/periodisasi";
import { getOrderReportList, payTrainerAll } from "@/axios/rekap/orderReport";
import { getRekapByTrainer } from "@/axios/rekap/bulanan";
import { DateTime } from "luxon";
import Swal from "sweetalert2";
import { toProperCase } from "@/utils";

// ─── Detail Modal Content ────────────────────────────────────────────────────

const CellDetail = ({ tanggal, status, selectedPeriode }) => {
  if (!tanggal || !selectedPeriode) {
    return (
      <div className="flex flex-col items-center">
        <span>{tanggal || "-"}</span>
      </div>
    );
  }

  const tanggalValue = DateTime.fromFormat(tanggal, "dd/MM/yyyy");
  const periodeStart = DateTime.fromFormat(
    selectedPeriode.start_date,
    "yyyy-MM-dd",
  );
  const periodeEnd = DateTime.fromFormat(
    selectedPeriode.end_date,
    "yyyy-MM-dd",
  );

  let periode = "next";
  if (tanggalValue < periodeStart) periode = "prev";
  else if (tanggalValue >= periodeStart && tanggalValue <= periodeEnd)
    periode = "curr";

  let bgColor = "";
  if (tanggal && status === false) {
    bgColor = tanggalValue <= periodeEnd ? "bg-red-500" : "bg-yellow-400";
  }

  const icon =
    status === true ? (
      periode === "curr" ? (
        <Icon
          icon="heroicons-outline:check-badge"
          color="blue"
          className="h-5 w-5"
        />
      ) : periode === "prev" ? (
        <Icon icon="heroicons-outline:x-mark" color="red" className="h-4 w-4" />
      ) : null
    ) : periode === "curr" ? (
      <Icon
        icon="heroicons-outline:banknotes"
        color="green"
        className="h-5 w-5"
      />
    ) : periode === "next" ? (
      <Icon
        icon="heroicons-outline:exclamation-circle"
        color="black"
        className="h-5 w-5"
      />
    ) : (
      <Icon
        icon="heroicons-outline:banknotes"
        color="orange"
        className="h-5 w-5"
      />
    );

  return (
    <div className="flex flex-col items-center gap-1">
      {icon}
      <span className={`px-1 py-0.5 rounded text-xs ${bgColor} text-black`}>
        {DateTime.fromFormat(tanggal, "dd/MM/yyyy").toFormat("dd/M")}
      </span>
    </div>
  );
};

const DetailModalContent = ({ trainer, selectedPeriode }) => {
  const { data, isLoading } = useQuery({
    queryKey: ["rekap-detail", selectedPeriode?.name, trainer?.trainer_id],
    queryFn: async () => {
      const res = await getRekapByTrainer(
        selectedPeriode.name,
        trainer.trainer_id,
      );
      return res.data;
    },
    enabled: !!selectedPeriode && !!trainer,
  });

  const COLUMNS = [
    {
      Header: "Siswa",
      accessor: "student_fullname",
      Cell: ({ cell }) => <span>{toProperCase(cell?.value)}</span>,
    },
    {
      Header: "Produk",
      accessor: "product",
      Cell: ({ cell }) => <span>{cell?.value}</span>,
    },
    {
      Header: "Honor/Sesi",
      accessor: "honor_perpertemuan",
      Cell: ({ cell }) => <span>Rp {cell?.value?.toLocaleString()}</span>,
    },
    ...[1, 2, 3, 4, 5, 6, 7, 8].map((i) => ({
      Header: `P${i}`,
      accessor: `p${i}`,
      Cell: ({ row }) => (
        <CellDetail
          tanggal={row.original[`p${i}`]}
          status={row.original[`p${i}_paid`]}
          selectedPeriode={selectedPeriode}
        />
      ),
    })),
  ];

  if (isLoading) return <SkeletionTable />;

  if (!data?.results?.length) {
    return <p className="text-center py-8 text-gray-500">Tidak ada data.</p>;
  }

  return (
    <Table tableId={"rekap-pelatih"} listData={data} listColumn={COLUMNS} />
  );
};

// ─── Main Page ───────────────────────────────────────────────────────────────

const RekapPelatih = () => {
  const [selectedPeriode, setSelectedPeriode] = useState(null);
  const [submittedPeriode, setSubmittedPeriode] = useState(null);
  const [detailTrainer, setDetailTrainer] = useState(null);

  const validationSchema = yup.object({
    periode: yup.string().required("Periode wajib dipilih"),
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({ resolver: yupResolver(validationSchema), mode: "all" });

  // ── Periode options ────────────────────────────────────────────────────────
  const periodeQuery = useQuery({
    queryKey: ["rekap-pelatih", "periodisasi"],
    queryFn: async () => {
      const res = await getPeriodisasiAll({ before_current: 3, page_size: 6 });
      return res.data.results;
    },
    staleTime: 5 * 60 * 1000,
  });

  const listPeriode = useMemo(
    () =>
      (periodeQuery.data ?? []).sort(
        (a, b) => new Date(b.start_date) - new Date(a.start_date),
      ),
    [periodeQuery.data],
  );

  // ── Report data (only fetched after submit) ────────────────────────────────
  const reportQuery = useQuery({
    queryKey: ["rekap-pelatih", "report", submittedPeriode?.name],
    queryFn: async () => {
      const res = await getOrderReportList(submittedPeriode.name);
      return Array.isArray(res.data) ? res.data : (res.data?.results ?? []);
    },
    enabled: !!submittedPeriode,
    staleTime: 0,
  });

  const queryClient = useQueryClient();

  const payMutation = useMutation({
    mutationFn: ({ periode, trainer_id }) => payTrainerAll(periode, trainer_id),
    onSuccess: (_, variables) => {
      Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: "Pembayaran berhasil dilakukan.",
        timer: 1500,
        showConfirmButton: false,
      });
      queryClient.invalidateQueries({
        queryKey: ["rekap-pelatih", "report", variables.periode],
      });
    },
    onError: () => {
      Swal.fire({ icon: "error", title: "Gagal", text: "Pembayaran gagal." });
    },
  });

  const handleBayar = (row) => {
    Swal.fire({
      title: `Bayar semua honor ${row.trainer_nickname}?`,
      text: `Total honor: Rp ${row.total_honor?.toLocaleString()}`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya, Bayar",
      cancelButtonText: "Batal",
    }).then((result) => {
      if (result.isConfirmed) {
        payMutation.mutate({
          periode: submittedPeriode.name,
          trainer_id: row.trainer_id,
        });
      }
    });
  };

  const onSubmit = () => {
    setSubmittedPeriode(selectedPeriode);
  };

  const reportData = reportQuery.data ?? [];
  const isLoading = periodeQuery.isLoading || reportQuery.isFetching;

  const COLUMNS = [
    {
      Header: "No",
      id: "no",
      Cell: ({ row }) => <span>{row.index + 1}</span>,
    },
    {
      Header: "Nama Coach",
      accessor: "trainer_nickname",
      Cell: ({ cell }) => <span className="font-medium">{cell?.value}</span>,
    },
    {
      Header: "Pertemuan Aktif",
      accessor: "pertemuan_aktif",
      Cell: ({ cell, row }) => (
        <div className="flex flex-col gap-1">
          <span>{cell?.value} sesi</span>
          {row.original.pertemuan_pasif > 0 && (
            <span className="text-xs text-gray-400">
              Pasif: {row.original.pertemuan_pasif}
            </span>
          )}
        </div>
      ),
    },
    {
      Header: "Total Honor",
      accessor: "total_honor",
      Cell: ({ cell }) => (
        <span className="font-semibold text-green-700">
          Rp {cell?.value?.toLocaleString()}
        </span>
      ),
    },
    {
      Header: "Action",
      accessor: "action",
      id: "action",
      Cell: ({ row }) => (
        <div className="flex gap-2 justify-center">
          <Tooltip placement="top" arrow content="Lihat Detail">
            <button
              className="btn p-2 bg-sky-100 text-sky-600 hover:bg-sky-500 hover:text-white rounded transition-colors"
              onClick={() => setDetailTrainer(row.original)}
            >
              <Icon icon="heroicons-outline:eye" className="h-5 w-5" />
            </button>
          </Tooltip>
          <Tooltip placement="top" arrow content="Bayar Semua Honor">
            <button
              className="btn p-2 bg-amber-100 text-amber-600 hover:bg-amber-500 hover:text-white rounded transition-colors disabled:opacity-40"
              onClick={() => handleBayar(row.original)}
              disabled={payMutation.isPending}
            >
              <Icon icon="heroicons-outline:banknotes" className="h-5 w-5" />
            </button>
          </Tooltip>
        </div>
      ),
    },
  ];

  const totalHonor = reportData.reduce(
    (sum, r) => sum + (r.total_honor ?? 0),
    0,
  );
  const totalSesi = reportData.reduce(
    (sum, r) => sum + (r.pertemuan_aktif ?? 0),
    0,
  );

  return (
    <>
      <div className="grid grid-cols-1">
        <Card title="Rekap Pelatih">
          {/* ── Filter Form ── */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-wrap gap-4 items-end mb-6"
          >
            <div className="w-60">
              <Select
                name="periode"
                label="Periode"
                placeholder="Pilih Periode"
                register={register}
                error={errors.periode?.message}
                options={listPeriode.map((item) => ({
                  value: item.name,
                  label: item.name,
                }))}
                onChange={(e) => {
                  setValue("periode", e.target.value);
                  setSelectedPeriode(
                    listPeriode.find((p) => p.name === e.target.value) ?? null,
                  );
                }}
              />
            </div>
            <button
              type="submit"
              className="btn btn-dark h-9 px-5 py-1"
              disabled={periodeQuery.isLoading}
            >
              Filter
            </button>
          </form>

          {/* ── Summary chips ── */}
          {reportData.length > 0 && (
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex items-center gap-3 border border-gray-200 rounded-lg px-4 py-3 bg-white shadow-sm">
                <Icon
                  icon="heroicons-outline:user-group"
                  className="h-6 w-6 text-sky-500"
                />
                <div>
                  <p className="text-xs text-gray-500">Total Pelatih</p>
                  <p className="font-bold text-gray-800">{reportData.length}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 border border-gray-200 rounded-lg px-4 py-3 bg-white shadow-sm">
                <Icon
                  icon="heroicons-outline:calendar-days"
                  className="h-6 w-6 text-violet-500"
                />
                <div>
                  <p className="text-xs text-gray-500">Total Sesi Aktif</p>
                  <p className="font-bold text-gray-800">{totalSesi}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 border border-gray-200 rounded-lg px-4 py-3 bg-green-50 shadow-sm">
                <Icon
                  icon="heroicons-outline:banknotes"
                  className="h-6 w-6 text-green-600"
                />
                <div>
                  <p className="text-xs text-gray-500">Total Honor</p>
                  <p className="font-bold text-green-700">
                    Rp {totalHonor.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── Table ── */}
          {isLoading ? (
            <SkeletionTable />
          ) : !submittedPeriode ? (
            <p className="text-center py-10 text-gray-400">
              Pilih periode lalu klik Filter untuk melihat data.
            </p>
          ) : reportData.length === 0 ? (
            <p className="text-center py-10 text-gray-400">
              Tidak ada data untuk periode ini.
            </p>
          ) : (
            <Table
              tableId={"rekap-pelatih"}
              listData={{ results: reportData, count: reportData.length }}
              listColumn={COLUMNS}
            />
          )}
        </Card>
      </div>

      {/* ── Detail Modal ── */}
      {detailTrainer && (
        <Modal
          title={`Detail Rekap — ${detailTrainer.trainer_nickname}`}
          activeModal={!!detailTrainer}
          onClose={() => setDetailTrainer(null)}
          className="max-w-6xl"
        >
          <DetailModalContent
            trainer={detailTrainer}
            selectedPeriode={submittedPeriode}
          />
        </Modal>
      )}
    </>
  );
};

export default RekapPelatih;
