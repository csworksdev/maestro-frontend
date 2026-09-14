import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import CareerErrorState from "@/pages/karir/components/CareerErrorState";
import {
  createCareerApplicationTrainer,
  getCareerApplication,
  processCareerApplicationStage,
  startCareerApplication,
} from "@/axios/career/jobs";
import getErrorMessage from "@/utils/careerErrorMessage";

const normalizeHref = (value) => {
  if (!value) {
    return "";
  }

  const text = String(value);
  const markdownUrl = text.match(/\((https?:\/\/[^)]+)\)/);
  return markdownUrl?.[1] || text;
};

const normalizeValue = (value) => String(value || "").trim().toLowerCase();

const isAcceptedApplication = (application) =>
  [application?.status, application?.status_display].some((value) =>
    ["accepted", "diterima"].includes(normalizeValue(value))
  );

const isRejectedApplication = (application) =>
  [application?.status, application?.status_display].some((value) =>
    ["rejected", "ditolak", "failed", "not_passed", "declined"].includes(
      normalizeValue(value)
    )
  );

const toBoolean = (value) =>
  value === true ||
  value === 1 ||
  ["true", "1", "yes"].includes(normalizeValue(value));

const getApplicationPayload = (payload) => payload?.data || payload || {};

const formatDate = (value) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
};

const calculateAge = (birthDate) => {
  if (!birthDate) {
    return "-";
  }

  const date = new Date(birthDate);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
    age -= 1;
  }

  return `${age} tahun`;
};

const valueOrDash = (value) => {
  if (value === true) {
    return "Ya";
  }

  if (value === false) {
    return "Tidak";
  }

  return value || "-";
};

const getStageCustomData = (stage) =>
  stage?.custom_data || stage?.custom_field_values || stage?.custom_fields_values || {};

const formatCustomDataLabel = (value) =>
  String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const isUrl = (value) => /^https?:\/\//i.test(String(value || ""));

const stageToneClass = {
  green: "border-success-200 bg-success-500/10 text-success-600",
  yellow: "border-warning-200 bg-warning-500/10 text-warning-600",
  orange: "border-orange-200 bg-orange-500/10 text-orange-600 dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-orange-300",
  red: "border-danger-200 bg-danger-500/10 text-danger-600",
  slate: "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-700 dark:text-slate-200",
};

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

  if (["in_progress", "progress", "pending"].includes(value)) {
    return "heroicons-outline:clock";
  }

  return "heroicons-outline:minus-circle";
};

const getStageLabel = (stage) => {
  const status = normalizeValue(stage?.status);

  if (status === "in_progress" || status === "progress") {
    return `Sedang ${stage?.stage_name || "Proses"}`;
  }

  return stage?.status_display || "-";
};

const getCurrentApplicationStage = (stages) =>
  stages.find((stage) =>
    ["pending", "in_progress", "progress"].includes(normalizeValue(stage.status))
  ) || stages.at(-1);

const getStageId = (stage) => stage?.stage || stage?.stage_id;

const Field = ({ label, value, href }) => (
  <div>
    <p className="mb-1 text-xs font-bold uppercase text-slate-400 dark:text-slate-500">
      {label}
    </p>
    {href ? (
      <a
        href={normalizeHref(href)}
        target="_blank"
        rel="noreferrer"
        className="break-words text-sm font-bold text-primary-500 hover:underline"
      >
        {value || href}
      </a>
    ) : (
      <p className="break-words text-sm font-bold text-slate-600 dark:text-slate-200">
        {valueOrDash(value)}
      </p>
    )}
  </div>
);

const Section = ({ title, children }) => (
  <Card title={title} bodyClass="p-5 sm:p-6">
    {children}
  </Card>
);

const ActionButton = ({ tone, icon, children, onClick, disabled }) => {
  const toneClass =
    tone === "danger"
      ? "bg-danger-500 text-white hover:bg-danger-600"
      : "bg-success-500 text-white hover:bg-success-600";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-12 items-center justify-center gap-2 rounded-md px-5 text-sm font-bold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${toneClass}`}
    >
      <Icon icon={icon} width={18} />
      {children}
    </button>
  );
};

const RekruitmenDetail = () => {
  const navigate = useNavigate();
  const { applicationId } = useParams();
  const queryClient = useQueryClient();

  const applicationQuery = useQuery({
    queryKey: ["careerApplication", applicationId],
    queryFn: async () => {
      const res = await getCareerApplication(applicationId);
      return getApplicationPayload(res.data);
    },
    enabled: Boolean(applicationId),
  });

  const application = applicationQuery.data || {};
  const certificateLinks = application?.upload_sertificates || [];
  const stages = [...(application?.stages || [])].sort(
    (a, b) => (a.stage_order || 0) - (b.stage_order || 0)
  );
  const currentApplicationStage = getCurrentApplicationStage(stages);
  const swimmingStyles = application?.swimming_styles_display?.join(", ");
  const sourceText = application?.source_name
    ? `${application.source_display || application.source} - ${application.source_name}`
    : application?.source_display || application?.source;

  const processApplicationMutation = useMutation({
    mutationFn: async () => {
      if (normalizeValue(application.status) === "pending") {
        return startCareerApplication(applicationId);
      }

      return processCareerApplicationStage(applicationId, {
        stage_id: getStageId(currentApplicationStage),
        status: "passed",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["careerApplication", applicationId] });
      queryClient.invalidateQueries({ queryKey: ["careerApplications"] });
      Swal.fire(
        "Berhasil",
        normalizeValue(application.status) === "pending"
          ? "Pelamar berhasil dimasukkan ke tahap pertama."
          : "Tahap rekrutmen berhasil diproses.",
        "success"
      );
    },
    onError: (error) => {
      Swal.fire(
        "Gagal",
        getErrorMessage(error, "Tahap rekrutmen gagal diproses."),
        "error"
      );
    },
  });

  const rejectApplicationMutation = useMutation({
    mutationFn: async () => {
      let stageId = getStageId(currentApplicationStage);

      if (normalizeValue(application.status) === "pending") {
        const res = await startCareerApplication(applicationId);
        const startedApplication = getApplicationPayload(res.data);
        stageId =
          getStageId(getCurrentApplicationStage(startedApplication.stages || [])) ||
          stageId;
      }

      return processCareerApplicationStage(applicationId, {
        stage_id: stageId,
        status: "failed",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["careerApplication", applicationId] });
      queryClient.invalidateQueries({ queryKey: ["careerApplications"] });
      Swal.fire("Berhasil", "Pelamar berhasil ditolak.", "success");
    },
    onError: (error) => {
      Swal.fire(
        "Gagal",
        getErrorMessage(error, "Pelamar gagal ditolak."),
        "error"
      );
    },
  });

  const createTrainerMutation = useMutation({
    mutationFn: () => createCareerApplicationTrainer(applicationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["careerApplication", applicationId] });
      queryClient.invalidateQueries({ queryKey: ["careerApplications"] });
      Swal.fire("Berhasil", "Pelamar berhasil ditambahkan sebagai pelatih.", "success");
    },
    onError: (error) => {
      Swal.fire(
        "Gagal",
        getErrorMessage(error, "Pelamar gagal ditambahkan sebagai pelatih."),
        "error"
      );
    },
  });

  const handleProcessApplication = () => {
    Swal.fire({
      title: "Mulai tahap rekrutmen?",
      text: "Pelamar akan dimasukkan ke tahap pertama proses rekrutmen.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#22c55e",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Ya, proses",
      cancelButtonText: "Batal",
    }).then((result) => {
      if (result.isConfirmed) {
        processApplicationMutation.mutate();
      }
    });
  };

  const handleCreateTrainer = () => {
    if (toBoolean(application.is_trainer)) {
      Swal.fire(
        "Sudah terdaftar sebagai pelatih",
        "Pelamar ini sudah terdaftar sebagai pelatih.",
        "info"
      );
      return;
    }

    Swal.fire({
      title: "Jadikan pelatih?",
      text: "Pelamar Diterima akan ditambahkan sebagai pelatih.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#22c55e",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Ya, jadikan pelatih",
      cancelButtonText: "Batal",
    }).then((result) => {
      if (result.isConfirmed) {
        createTrainerMutation.mutate();
      }
    });
  };

  const handleRejectApplication = () => {
    Swal.fire({
      title: "Tolak pelamar?",
      text: "Pelamar akan diproses sebagai tidak lulus pada tahapan rekrutmen.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Ya, tolak",
      cancelButtonText: "Batal",
    }).then((result) => {
      if (result.isConfirmed) {
        rejectApplicationMutation.mutate();
      }
    });
  };

  const isActionProcessing =
    processApplicationMutation.isPending ||
    rejectApplicationMutation.isPending ||
    createTrainerMutation.isPending;
  const isPendingApplication = normalizeValue(application.status) === "pending";
  const isAccepted = isAcceptedApplication(application);
  const isRejected = isRejectedApplication(application);
  const isTrainer = isAccepted && toBoolean(application.is_trainer);
  const canReject = !isAccepted && !isRejected;

  if (applicationQuery.isLoading) {
    return (
      <div className="space-y-5">
        <div className="h-12 w-36 animate-pulse rounded-md bg-slate-200 dark:bg-slate-700" />
        <Card bodyClass="p-6">
          <div className="space-y-4">
            <div className="h-6 w-48 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-4 w-64 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
          </div>
        </Card>
      </div>
    );
  }

  if (applicationQuery.isError) {
    return (
      <div className="space-y-5">
        <button
          type="button"
          onClick={() => navigate("/karir/rekruitmen")}
          className="inline-flex h-12 items-center gap-2 rounded-md bg-primary-500 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-primary-600"
        >
          <Icon icon="heroicons-outline:arrow-uturn-left" width={18} />
          Kembali
        </button>
        <CareerErrorState
          error={applicationQuery.error}
          fallback="Detail pelamar belum dapat dimuat. Silakan coba lagi."
          onRetry={() => applicationQuery.refetch()}
          isRetrying={applicationQuery.isFetching}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => navigate("/karir/rekruitmen")}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-primary-500 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-primary-600 sm:w-auto"
        >
          <Icon icon="heroicons-outline:arrow-uturn-left" width={18} />
          Kembali
        </button>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {isPendingApplication && (
            <ActionButton
              icon="heroicons-outline:check-circle"
              onClick={handleProcessApplication}
              disabled={isActionProcessing}
            >
              {processApplicationMutation.isPending ? "Memproses..." : "Mulai Tahap"}
            </ActionButton>
          )}
          {isAccepted && !isTrainer && (
            <ActionButton
              icon="heroicons-outline:user-add"
              onClick={handleCreateTrainer}
              disabled={isActionProcessing}
            >
              {createTrainerMutation.isPending ? "Memproses..." : "Jadikan Pelatih"}
            </ActionButton>
          )}
          {isTrainer && (
            <span className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-success-200 bg-success-50 px-5 text-sm font-bold text-success-600 dark:border-success-500/30 dark:bg-success-500/10 dark:text-success-300">
              <Icon icon="heroicons-outline:badge-check" width={18} />
              Pelatih
            </span>
          )}
          {canReject && (
            <ActionButton
              tone="danger"
              icon="heroicons-outline:x-circle"
              onClick={handleRejectApplication}
              disabled={isActionProcessing}
            >
              {rejectApplicationMutation.isPending ? "Memproses..." : "Tolak"}
            </ActionButton>
          )}
          {isRejected && (
            <ActionButton
              tone="danger"
              icon="heroicons-outline:x-circle"
              disabled
            >
              Ditolak
            </ActionButton>
          )}
        </div>
      </div>

      <Card bodyClass="p-0">
        <div className="border-b border-slate-200 px-5 py-5 dark:border-slate-700 sm:px-6">
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {application.name || "-"}
          </h1>
          <p className="mt-1 text-sm font-bold text-slate-500">
            {application.job_title || "-"} - {application.branch_name || "-"}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-x-10 gap-y-6 p-5 sm:grid-cols-2 sm:p-6 xl:grid-cols-4">
          <Field label="Nama Lengkap" value={application.name} />
          <Field label="Nama Panggilan" value={application.nickname} />
          <Field
            label="Email"
            value={application.email}
            href={
              application.email && application.email !== "-"
                ? `mailto:${application.email}`
                : undefined
            }
          />
          <Field label="No. Telepon" value={application.phone_number} />
          <Field
            label="WhatsApp"
            value={application.phone_number}
            href={application.whatsapp_link}
          />
          <Field
            label="Instagram"
            value={application.instagram}
            href={application.instagram_link}
          />
          <Field label="Gender" value={application.gender_display} />
          <Field label="Usia" value={calculateAge(application.birth_date)} />
          <Field label="Tempat Lahir" value={application.birth_place} />
          <Field label="Tanggal Lahir" value={formatDate(application.birth_date)} />
          <Field
            label="Status Pernikahan"
            value={application.marital_status_display}
          />
          <Field label="Agama" value={application.religion_display} />
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Section title="Alamat">
          <div className="space-y-5">
            <Field label="Alamat KTP" value={application.address} />
            <Field label="Domisili" value={application.domicile} />
            <Field
              label="Tinggi / Berat"
              value={`${application.body_height || "-"} cm / ${
                application.body_weight || "-"
              } kg`}
            />
          </div>
        </Section>

        <Section title="Pendidikan">
          <div className="grid grid-cols-1 gap-x-10 gap-y-5 sm:grid-cols-2">
            <Field label="Jenjang" value={application.education_level_display} />
            <Field label="Status" value={application.education_status_display} />
            <Field label="Universitas" value={application.education_university} />
            <Field label="Jurusan" value={application.education_major} />
            <Field
              label="Tahun Lulus"
              value={application.education_graduation_year}
            />
          </div>
        </Section>

        <Section title="Pengalaman & Preferensi">
          <div className="grid grid-cols-1 gap-x-10 gap-y-5 sm:grid-cols-2">
            <Field label="Sistem Kerja" value={application.contract_system_display} />
            <Field
              label="Pengalaman Coach"
              value={application.coach_experience_display}
            />
            <Field label="Gaya Renang" value={swimmingStyles} />
            <Field label="Sumber Info" value={sourceText} />
            <Field label="Nama Sumber" value={application.source_name} />
            <Field label="Sedang Bekerja" value={application.is_working} />
          </div>
        </Section>

        <Section title="Dokumen">
          <div className="space-y-5">
            <Field label="CV" value="Lihat CV" href={application.upload_cv} />
            <div>
              <p className="mb-2 text-xs font-bold uppercase text-slate-400 dark:text-slate-500">
                Sertifikat
              </p>
              {certificateLinks.length ? (
                <div className="flex flex-wrap gap-2">
                  {certificateLinks.map((certificate, index) => (
                    <a
                      key={`${certificate}-${index}`}
                      href={normalizeHref(certificate)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-md border border-primary-100 bg-primary-50 px-3 py-2 text-sm font-bold text-primary-500 hover:underline dark:border-primary-500/20 dark:bg-primary-500/10"
                    >
                      <Icon icon="heroicons-outline:document-text" width={16} />
                      Sertifikat {index + 1}
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-sm font-bold text-slate-600 dark:text-slate-200">
                  -
                </p>
              )}
            </div>
          </div>
        </Section>
      </div>

      <Section title="Tahapan Rekruitmen">
        <div className="space-y-3">
          {stages.length ? (
            stages.map((stage) => {
              const tone = getStageTone(stage.status);
              const customDataEntries = Object.entries(getStageCustomData(stage)).filter(
                ([, value]) =>
                  value !== null &&
                  value !== undefined &&
                  String(value).trim() !== ""
              );

              return (
                <div
                  key={stage.job_application_stage_id || stage.stage}
                  className="flex flex-col gap-3 rounded-md border border-slate-200 px-4 py-4 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      {stage.stage_name || "-"}
                    </h4>
                    <p className="mt-2 text-sm font-semibold text-slate-500">
                      {stage.notes || "-"}
                    </p>
                    {customDataEntries.length ? (
                      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {customDataEntries.map(([key, value]) => {
                          const textValue = String(value);

                          return (
                            <div
                              key={key}
                              className="min-w-0 rounded-md bg-slate-50 px-3 py-2 dark:bg-slate-800"
                            >
                              <p className="text-[10px] font-bold uppercase text-slate-400">
                                {formatCustomDataLabel(key)}
                              </p>
                              {isUrl(textValue) ? (
                                <a
                                  href={textValue}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="mt-1 block truncate text-xs font-bold text-primary-500 hover:underline"
                                  title={textValue}
                                >
                                  {textValue}
                                </a>
                              ) : (
                                <p
                                  className="mt-1 break-words text-xs font-bold text-slate-600 dark:text-slate-200"
                                  title={textValue}
                                >
                                  {textValue}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                  <span
                    className={`inline-flex w-fit items-center gap-1.5 rounded px-3 py-1 text-xs font-bold ${stageToneClass[tone]}`}
                  >
                    <Icon icon={getStageIcon(stage.status)} width={14} />
                    {getStageLabel(stage)}
                  </span>
                </div>
              );
            })
          ) : (
            <div className="rounded-md border border-slate-200 px-4 py-4 text-sm font-semibold text-slate-500 dark:border-slate-700">
              Belum ada tahapan rekrutmen.
            </div>
          )}
        </div>
      </Section>
    </div>
  );
};

export default RekruitmenDetail;
