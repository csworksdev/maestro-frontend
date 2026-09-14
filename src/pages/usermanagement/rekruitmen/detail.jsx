import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Loading from "@/components/Loading";
import {
  getApplicationById,
} from "@/axios/career/application";
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
  if (value == null || value === "") return "-";
  return String(value);
};

const InfoItem = ({ label, value, children }) => (
  <div>
    <div className="text-xs font-semibold uppercase text-slate-400">{label}</div>
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
    () => sortStages(Array.isArray(application?.stages) ? application.stages : []),
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

      <Card
        title={application?.name || "Detail Pelamar"}
        subtitle={`${application?.job_title || "-"} - ${application?.branch_name || "-"}`}
      >
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          <InfoItem label="Nama Lengkap" value={application?.name} />
          <InfoItem label="Nama Panggilan" value={application?.nickname} />
          <InfoItem label="Email" value={application?.email} />
          <InfoItem label="No. Telepon" value={application?.phone_number} />
          <InfoItem label="WhatsApp">
            <ExternalLink href={application?.whatsapp_link}>
              {application?.phone_number || "Buka WhatsApp"}
            </ExternalLink>
          </InfoItem>
          <InfoItem label="Instagram">
            <ExternalLink href={application?.instagram_link}>
              {application?.instagram || "Buka Instagram"}
            </ExternalLink>
          </InfoItem>
          <InfoItem label="Gender" value={application?.gender_display} />
          <InfoItem label="Usia" value={getAge(application?.birth_date)} />
          <InfoItem label="Tempat Lahir" value={application?.birth_place} />
          <InfoItem
            label="Tanggal Lahir"
            value={formatDate(application?.birth_date)}
          />
          <InfoItem
            label="Status Pernikahan"
            value={application?.marital_status_display}
          />
          <InfoItem label="Agama" value={application?.religion_display} />
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Card title="Alamat">
          <div className="space-y-4">
            <InfoItem label="Alamat KTP" value={application?.address} />
            <InfoItem label="Domisili" value={application?.domicile} />
            <InfoItem
              label="Tinggi / Berat"
              value={`${application?.body_height || "-"} cm / ${application?.body_weight || "-"} kg`}
            />
          </div>
        </Card>

        <Card title="Pendidikan">
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
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Card title="Pengalaman & Preferensi">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
            <InfoItem label="Sumber Info" value={application?.source_display} />
            <InfoItem label="Nama Sumber" value={application?.source_name} />
          </div>
        </Card>

        <Card title="Dokumen">
          <div className="space-y-4">
            <InfoItem label="CV">
              <ExternalLink href={application?.upload_cv}>Lihat CV</ExternalLink>
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
        </Card>
      </div>

      <Card title="Tahapan Rekruitmen">
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
