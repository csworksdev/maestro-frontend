import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import Loading from "@/components/Loading";
import { getApplicationById } from "@/axios/career/application";
import {
  getStageName,
  getStageNotes,
  getStageStatusDisplay,
  isRejectedStage,
  sortStages,
} from "./stageConfig";
import { processApplicationStage } from "./stageProcess";

const getAge = (birthDate) => {
  if (!birthDate) return "-";

  const date = new Date(birthDate);
  if (Number.isNaN(date.getTime())) return "-";

  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
    age -= 1;
  }

  return `${age} tahun`;
};

const formatDate = (value) => {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
  }).format(date);
};

const displayValue = (value) => {
  if (Array.isArray(value)) return value.length ? value.join(", ") : "-";
  if (value === true) return "Ya";
  if (value === false) return "Tidak";
  if (value == null || value === "") return "-";
  return String(value);
};

const InfoItem = ({ label, value, children }) => (
  <div>
    <div className="text-xs font-semibold uppercase text-slate-400">
      {label}
    </div>
    <div className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-200">
      {children || displayValue(value)}
    </div>
  </div>
);

const ExternalLink = ({ href, children }) => {
  if (!href) return <span>-</span>;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-primary-600 hover:underline"
    >
      {children}
    </a>
  );
};

const DetailSection = ({ title, description, icon, children, className = "" }) => (
  <Card bodyClass="flex h-full flex-col p-0" className={className}>
    <div className="flex items-start gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-700 sm:px-6">
      <span className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-primary-50 text-primary-500 dark:bg-primary-500/10 dark:text-primary-300">
        <Icon icon={icon} width={20} />
      </span>
      <div>
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
          {title}
        </h2>
        <p className="mt-0.5 text-xs font-semibold leading-5 text-slate-500 dark:text-slate-400">
          {description}
        </p>
      </div>
    </div>
    <div className="flex flex-1 flex-col p-5 sm:p-6">{children}</div>
  </Card>
);

const getErrorMessage = (error) =>
  error?.response?.data?.detail ||
  error?.response?.data?.message ||
  error?.message ||
  "Gagal memproses pelamar.";

const RekruitmenDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { applicationId } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [application, setApplication] = useState(location.state?.data || null);
  const [isProcessing, setIsProcessing] = useState(false);

  const certificates = useMemo(
    () =>
      Array.isArray(application?.upload_sertificates)
        ? application.upload_sertificates
        : [],
    [application],
  );

  const stages = useMemo(
    () =>
      sortStages(Array.isArray(application?.stages) ? application.stages : []),
    [application],
  );

  const fetchDetail = async () => {
    try {
      setIsLoading(true);
      const res = await getApplicationById(applicationId);
      setApplication(res?.data || null);
    } catch (error) {
      console.error("Error fetching application detail", error);
      Swal.fire("Error!", "Gagal mengambil detail pelamar.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [applicationId]);

  const handleDecision = async (decision) => {
    const actionLabel = decision === "approved" ? "approve" : "tolak";

    const result = await Swal.fire({
      title: `${actionLabel === "approve" ? "Approve" : "Tolak"} pelamar?`,
      text:
        decision === "approved"
          ? "Pelamar akan diproses ke tahap selanjutnya."
          : "Pelamar akan ditolak dari proses rekruitmen.",
      input: "textarea",
      inputLabel: "Catatan tahapan (opsional)",
      inputPlaceholder: "Tambahkan catatan bila diperlukan",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: decision === "approved" ? "#22c55e" : "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Ya, proses",
      cancelButtonText: "Batal",
    });

    if (!result.isConfirmed) return;

    try {
      setIsProcessing(true);
      await processApplicationStage({
        application,
        applicationId,
        status: decision,
        notes: result.value?.trim() || "",
      });
      Swal.fire("Berhasil!", `Pelamar berhasil di${actionLabel}.`, "success");
      fetchDetail();
    } catch (error) {
      Swal.fire("Error!", getErrorMessage(error), "error");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading && !application) {
    return <Loading />;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          text="Kembali"
          type="button"
          className="bg-primary-500 text-white"
          icon="heroicons-outline:arrow-uturn-left"
          onClick={() => navigate(-1)}
        />
        <div className="flex flex-wrap gap-2">
          <Button
            text="Approve Tahap Selanjutnya"
            type="button"
            className="bg-success-500 text-white"
            icon="heroicons-outline:check-circle"
            disabled={isProcessing}
            onClick={() => handleDecision("approved")}
          />
          <Button
            text="Tolak"
            type="button"
            className="bg-danger-500 text-white"
            icon="heroicons-outline:x-circle"
            disabled={isProcessing}
            onClick={() => handleDecision("rejected")}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <DetailSection
          title={application?.name || "Detail Pelamar"}
          description={`${application?.job_title || "-"} - ${
            application?.branch_name || "-"
          }`}
          icon="heroicons-outline:user-circle"
          className="h-full xl:col-span-2"
        >
          <div className="grid flex-1 grid-cols-1 content-evenly gap-x-5 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
            <InfoItem label="Nama Lengkap" value={application?.name} />
            <InfoItem label="Nama Panggilan" value={application?.nickname} />
            <InfoItem
              label="Jenis Kelamin"
              value={application?.gender_display}
            />
            <InfoItem label="Usia" value={getAge(application?.birth_date)} />
            <InfoItem
              label="Tanggal Lahir"
              value={formatDate(application?.birth_date)}
            />
            <InfoItem label="Tempat Lahir" value={application?.birth_place} />
            <InfoItem label="Agama" value={application?.religion_display} />
            <InfoItem
              label="Status Pernikahan"
              value={application?.marital_status_display}
            />
            <InfoItem
              label="Tinggi / Berat Badan"
              value={`${application?.body_height || "-"} cm / ${
                application?.body_weight || "-"
              } kg`}
            />
          </div>
        </DetailSection>

        <DetailSection
          title="Kontak"
          description="Kanal komunikasi yang dapat dihubungi"
          icon="heroicons-outline:phone"
          className="h-full"
        >
          <div className="grid grid-cols-1 gap-5">
            <InfoItem label="WhatsApp">
              <ExternalLink href={application?.whatsapp_link}>
                {application?.phone_number || "Buka WhatsApp"}
              </ExternalLink>
            </InfoItem>
            <InfoItem label="No. Telepon" value={application?.phone_number} />
            <InfoItem label="Email">
              <ExternalLink href={application?.email ? `mailto:${application.email}` : ""}>
                {application?.email}
              </ExternalLink>
            </InfoItem>
            <InfoItem label="Instagram">
              <ExternalLink href={application?.instagram_link}>
                {application?.instagram || "Buka Instagram"}
              </ExternalLink>
            </InfoItem>
          </div>
        </DetailSection>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <DetailSection
          title="Karier & Lamaran"
          description="Pengalaman, kemampuan, serta preferensi lamaran pelamar"
          icon="heroicons-outline:briefcase"
          className="h-full xl:col-span-2"
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <InfoItem
              label="Sistem Kerja"
              value={application?.contract_system_display}
            />
            <InfoItem
              label="Pengalaman Coach"
              value={application?.coach_experience_display}
            />
            <InfoItem
              label="Gaya Renang"
              value={application?.swimming_styles_display}
            />
            <InfoItem label="Sedang Bekerja" value={application?.is_working} />
            <InfoItem
              label="Kanal Informasi"
              value={application?.source_display}
            />
            <InfoItem label="Detail Sumber" value={application?.source_name} />
          </div>
        </DetailSection>

        <DetailSection
          title="Dokumen"
          description="Berkas pendukung yang dilampirkan pelamar"
          icon="heroicons-outline:folder-open"
          className="h-full"
        >
          <div className="space-y-4">
            <InfoItem label="CV">
              <ExternalLink href={application?.upload_cv}>
                Lihat CV
              </ExternalLink>
            </InfoItem>
            <div>
              <div className="text-xs font-semibold uppercase text-slate-400">
                Sertifikat
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {certificates.length ? (
                  certificates.map((url, index) => (
                    <ExternalLink key={url} href={url}>
                      Sertifikat {index + 1}
                    </ExternalLink>
                  ))
                ) : (
                  <span className="text-sm text-slate-500">-</span>
                )}
              </div>
            </div>
          </div>
        </DetailSection>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <DetailSection
          title="Alamat"
          description="Alamat identitas dan tempat tinggal saat ini"
          icon="heroicons-outline:map-pin"
        >
          <div className="grid flex-1 content-evenly gap-y-4">
            <InfoItem label="Domisili" value={application?.domicile} />
            <InfoItem label="Alamat KTP" value={application?.address} />
          </div>
        </DetailSection>

        <DetailSection
          title="Pendidikan"
          description="Riwayat pendidikan terakhir pelamar"
          icon="heroicons-outline:academic-cap"
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <InfoItem
              label="Jenjang"
              value={application?.education_level_display}
            />
            <InfoItem
              label="Status"
              value={application?.education_status_display}
            />
            <InfoItem
              label="Universitas"
              value={application?.education_university}
            />
            <InfoItem label="Jurusan" value={application?.education_major} />
            <InfoItem
              label="Tahun Lulus"
              value={application?.education_graduation_year}
            />
          </div>
        </DetailSection>
      </div>

      <Card title="Tahapan Rekrutmen">
        {stages.length ? (
          <div className="space-y-3">
            {stages.map((stage, index) => (
              <div
                key={stage.stage_id || stage.id || index}
                className="rounded border border-slate-200 p-4 dark:border-slate-700"
              >
                {(() => {
                  const statusDisplay = getStageStatusDisplay(stage);
                  const normalizedStatus = statusDisplay.toLowerCase();
                  const statusClass = isRejectedStage(stage)
                    ? "bg-danger-100 text-danger-700"
                    : normalizedStatus.includes("lulus")
                      ? "bg-success-100 text-success-700"
                      : "bg-warning-100 text-warning-700";

                  return (
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {getStageName(stage) || `Tahap ${index + 1}`}
                      </div>
                      <span
                        className={`inline-flex rounded px-2 py-1 text-xs font-semibold capitalize ${statusClass}`}
                      >
                        {statusDisplay}
                      </span>
                    </div>
                  );
                })()}
                <div className="mt-2 text-sm text-slate-500">
                  {getStageNotes(stage) || stage.description || "-"}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-slate-500">
            Belum ada tahapan untuk pelamar ini.
          </div>
        )}
      </Card>
    </div>
  );
};

export default RekruitmenDetail;
