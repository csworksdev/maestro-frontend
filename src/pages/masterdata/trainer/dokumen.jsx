import React, { useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import Swal from "sweetalert2";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import {
  getTrainerDocuments,
  uploadTrainerDocuments,
} from "@/axios/masterdata/trainer";

const emptyFiles = {
  identityCard: null,
  employmentContract: null,
  sertificates: [],
};

const normalizeDocumentUrls = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  return value ? [value] : [];
};

const documentToneClasses = {
  blue: {
    card: "border-blue-200 bg-blue-50/60 dark:border-blue-500/30 dark:bg-blue-500/10",
    icon: "bg-blue-500/10 text-blue-600 dark:text-blue-300",
    upload:
      "border-blue-200 bg-blue-50/30 hover:border-blue-400 dark:border-blue-500/30 dark:bg-blue-500/5",
  },
  violet: {
    card: "border-violet-200 bg-violet-50/60 dark:border-violet-500/30 dark:bg-violet-500/10",
    icon: "bg-violet-500/10 text-violet-600 dark:text-violet-300",
    upload:
      "border-violet-200 bg-violet-50/30 hover:border-violet-400 dark:border-violet-500/30 dark:bg-violet-500/5",
  },
  emerald: {
    card: "border-emerald-200 bg-emerald-50/60 dark:border-emerald-500/30 dark:bg-emerald-500/10",
    icon: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
    upload:
      "border-emerald-200 bg-emerald-50/30 hover:border-emerald-400 dark:border-emerald-500/30 dark:bg-emerald-500/5",
  },
};

const getFileName = (url, fallback) => {
  if (!url) return fallback;

  try {
    return decodeURIComponent(new URL(url).pathname.split("/").pop()) || fallback;
  } catch {
    return url.split("/").pop() || fallback;
  }
};

const ExistingDocument = ({
  label,
  url,
  icon = "heroicons-outline:document",
  tone = "blue",
}) => (
  <div
    className={`flex min-w-0 items-center gap-3 rounded-lg border p-3 ${documentToneClasses[tone].card}`}
  >
    <span
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${documentToneClasses[tone].icon}`}
    >
      <Icon icon={icon} width={20} />
    </span>
    <div className="min-w-0 flex-1">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">
        {url ? getFileName(url, label) : "Belum tersedia"}
      </p>
    </div>
    {url && (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md border border-slate-200 px-3 text-xs font-semibold text-slate-600 transition hover:border-primary-400 hover:text-primary-500 dark:border-slate-600 dark:text-slate-300"
      >
        <Icon icon="heroicons-outline:arrow-top-right-on-square" width={16} />
        Lihat
      </a>
    )}
  </div>
);

const FileField = ({
  label,
  description,
  accept,
  multiple,
  onChange,
  selectedFiles = [],
  onRemove,
  tone = "blue",
}) => (
  <div
    className={`block rounded-lg border border-dashed p-4 transition ${documentToneClasses[tone].upload}`}
  >
    <span className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-200">
      {label}
    </span>
    <span className="mb-3 block text-xs text-slate-400">{description}</span>
    <input
      type="file"
      accept={accept}
      multiple={multiple}
      onChange={onChange}
      className="block w-full text-sm text-slate-500 file:mr-3 file:rounded-md file:border-0 file:bg-primary-500/10 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-primary-600 hover:file:bg-primary-500/20 dark:text-slate-300"
    />
    {selectedFiles.length > 0 && (
      <span className="mt-3 grid gap-2">
        {selectedFiles.map((file, index) => (
          <span
            key={`${file.name}-${file.size}-${file.lastModified}-${index}`}
            className="flex min-w-0 items-center gap-2 rounded-md bg-slate-50 px-3 py-2 dark:bg-slate-700/50"
          >
            <Icon
              icon="heroicons-outline:document"
              width={16}
              className="shrink-0 text-primary-500"
            />
            <span className="min-w-0 flex-1 truncate text-xs font-medium text-slate-600 dark:text-slate-200">
              {file.name}
            </span>
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                onRemove?.(index);
              }}
              className="shrink-0 text-slate-400 transition hover:text-danger-500"
              aria-label={`Hapus ${file.name}`}
            >
              <Icon icon="heroicons-outline:x-mark" width={17} />
            </button>
          </span>
        ))}
      </span>
    )}
  </div>
);

const Dokumen = ({ trainerId }) => {
  const [files, setFiles] = useState(emptyFiles);
  const formRef = useRef(null);

  const documentsQuery = useQuery({
    queryKey: ["trainer-documents", trainerId],
    queryFn: async () => {
      const response = await getTrainerDocuments(trainerId);
      const payload = response?.data;

      if (payload?.status && Object.prototype.hasOwnProperty.call(payload, "data")) {
        return payload.data ?? {};
      }

      return payload ?? {};
    },
    enabled: Boolean(trainerId),
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const uploadMutation = useMutation({
    mutationFn: () => uploadTrainerDocuments(trainerId, files),
    onSuccess: async () => {
      await documentsQuery.refetch();
      setFiles(emptyFiles);
      formRef.current?.reset();
      Swal.fire("Berhasil", "Dokumen pelatih berhasil diunggah.", "success");
    },
    onError: (error) => {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Dokumen gagal diunggah. Silakan coba kembali.";
      Swal.fire("Gagal", message, "error");
    },
  });

  if (!trainerId) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700">
        Simpan biodata pelatih terlebih dahulu sebelum mengunggah dokumen.
      </div>
    );
  }

  const documents = documentsQuery.data ?? {};
  const identityCards = normalizeDocumentUrls(documents.identity_card);
  const employmentContracts = normalizeDocumentUrls(
    documents.employment_contract,
  );
  const sertificates = normalizeDocumentUrls(documents.sertificates);
  const hasSelectedFiles =
    files.identityCard ||
    files.employmentContract ||
    files.sertificates.length > 0;

  const handleUpload = async (event) => {
    event.preventDefault();

    if (!hasSelectedFiles || uploadMutation.isPending) return;

    const selectedDocuments = [
      files.identityCard ? "1 KTP" : null,
      files.employmentContract ? "1 kontrak kerja" : null,
      files.sertificates.length
        ? `${files.sertificates.length} sertifikat`
        : null,
    ].filter(Boolean);
    const result = await Swal.fire({
      title: "Unggah dokumen?",
      text: `${selectedDocuments.join(", ")} akan diunggah. Pastikan dokumen yang dipilih sudah benar.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya, unggah",
      cancelButtonText: "Batal",
      confirmButtonColor: "#3b82f6",
      cancelButtonColor: "#64748b",
      reverseButtons: true,
    });

    if (result.isConfirmed) {
      uploadMutation.mutate();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          Dokumen Pelatih
        </h3>
      </div>

      {documentsQuery.isLoading ? (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="h-[66px] animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800"
            />
          ))}
        </div>
      ) : documentsQuery.isError ? (
        <div className="rounded-lg border border-danger-200 bg-danger-50 p-4 text-sm text-danger-600">
          <p>Dokumen belum dapat dimuat.</p>
          <button
            type="button"
            onClick={() => documentsQuery.refetch()}
            className="mt-2 font-semibold underline"
          >
            Muat ulang
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <div className="space-y-3">
            {identityCards.length ? (
              identityCards.map((url, index) => (
                <ExistingDocument
                  key={`${url}-${index}`}
                  label={`KTP ${identityCards.length > 1 ? index + 1 : ""}`.trim()}
                  url={url}
                  icon="heroicons-outline:identification"
                  tone="blue"
                />
              ))
            ) : (
              <ExistingDocument
                label="KTP"
                icon="heroicons-outline:identification"
                tone="blue"
              />
            )}
          </div>
          <div className="space-y-3">
            {employmentContracts.length ? (
              employmentContracts.map((url, index) => (
                <ExistingDocument
                  key={`${url}-${index}`}
                  label={`Kontrak Kerja ${employmentContracts.length > 1 ? index + 1 : ""}`.trim()}
                  url={url}
                  icon="heroicons-outline:document-text"
                  tone="violet"
                />
              ))
            ) : (
              <ExistingDocument
                label="Kontrak Kerja"
                icon="heroicons-outline:document-text"
                tone="violet"
              />
            )}
          </div>
          <div className="space-y-3 lg:col-span-2">
            {sertificates.length ? (
              sertificates.map((url, index) => (
                <ExistingDocument
                  key={`${url}-${index}`}
                  label={`Sertifikat ${index + 1}`}
                  url={url}
                  icon="heroicons-outline:academic-cap"
                  tone="emerald"
                />
              ))
            ) : (
              <ExistingDocument
                label="Sertifikat"
                icon="heroicons-outline:academic-cap"
                tone="emerald"
              />
            )}
          </div>
        </div>
      )}

      <form
        ref={formRef}
        className="space-y-4 border-t border-slate-200 pt-6 dark:border-slate-700"
        onSubmit={handleUpload}
      >
        <div>
          <h4 className="font-semibold text-slate-800 dark:text-slate-100">
            Unggah Dokumen
          </h4>
          <p className="mt-1 text-xs text-slate-400">
            Pilih hanya dokumen yang ingin ditambahkan atau diperbarui.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <FileField
            label="KTP"
            description="Pilih satu file gambar atau PDF. File baru akan mengganti file lama."
            accept="image/*,.pdf"
            tone="blue"
            onChange={(event) =>
              setFiles((current) => ({
                ...current,
                identityCard: event.target.files?.[0] ?? null,
              }))
            }
          />
          <FileField
            label="Kontrak Kerja"
            description="Pilih satu file gambar atau PDF. File baru akan mengganti file lama."
            accept="image/*,.pdf"
            tone="violet"
            onChange={(event) =>
              setFiles((current) => ({
                ...current,
                employmentContract: event.target.files?.[0] ?? null,
              }))
            }
          />
          <div className="lg:col-span-2">
            <FileField
              label="Sertifikat"
              description="Pilihan baru akan ditambahkan ke daftar. Anda bisa memilih file beberapa kali."
              accept="image/*,.pdf"
              multiple
              tone="emerald"
              selectedFiles={files.sertificates}
              onRemove={(index) =>
                setFiles((current) => ({
                  ...current,
                  sertificates: current.sertificates.filter(
                    (_, fileIndex) => fileIndex !== index,
                  ),
                }))
              }
              onChange={(event) => {
                const selectedFiles = Array.from(event.target.files ?? []);

                setFiles((current) => {
                  const existingKeys = new Set(
                    current.sertificates.map(
                      (file) => `${file.name}-${file.size}-${file.lastModified}`,
                    ),
                  );
                  const newFiles = selectedFiles.filter(
                    (file) =>
                      !existingKeys.has(
                        `${file.name}-${file.size}-${file.lastModified}`,
                      ),
                  );

                  return {
                    ...current,
                    sertificates: [...current.sertificates, ...newFiles],
                  };
                });

                event.target.value = "";
              }}
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button
            type="submit"
            text={uploadMutation.isPending ? "Mengunggah..." : "Unggah Dokumen"}
            icon="heroicons-outline:arrow-up-tray"
            className="btn-primary"
            disabled={!hasSelectedFiles || uploadMutation.isPending}
            isLoading={uploadMutation.isPending}
          />
        </div>
      </form>
    </div>
  );
};

export default Dokumen;
