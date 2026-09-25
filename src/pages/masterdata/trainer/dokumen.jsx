import React, { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import Textinput from "@/components/ui/Textinput";
import Table from "@/components/globals/table/table";
import TableAction from "@/components/globals/table/tableAction";
import Search from "@/components/globals/table/search";
import SkeletionTable from "@/components/skeleton/Table";
import FilterSidebar from "@/components/ui/FilterSidebar";
import {
  createTrainerDocument,
  deleteTrainerDocument,
  getTrainerDocumentDetail,
  getTrainerDocuments,
  updateTrainerDocument,
} from "@/axios/masterdata/trainer";
import { downloadBlob } from "@/utils/blob-download";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_FILE_EXTENSIONS = ["pdf", "jpg", "jpeg", "png", "doc", "docx"];

const DOCUMENT_TYPES = [
  { value: "IDENTITY_CARD", label: "KTP" },
  { value: "EMPLOYMENT_CONTRACT", label: "Kontrak Kerja" },
  { value: "CERTIFICATE", label: "Sertifikat" },
];

const EMPTY_FORM = {
  fileName: "",
  type: "",
  documentNumber: "",
  documentDate: "",
  file: null,
};

const DOCUMENT_TYPE_BADGE_CLASSES = {
  IDENTITY_CARD:
    "bg-blue-100 text-blue-700 ring-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-500/30",
  CERTIFICATE:
    "bg-emerald-100 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/30",
  EMPLOYMENT_CONTRACT:
    "bg-violet-100 text-violet-700 ring-violet-200 dark:bg-violet-500/15 dark:text-violet-300 dark:ring-violet-500/30",
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const getFileValidationMessage = (file) => {
  if (!file) return "File wajib diunggah.";
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (!ALLOWED_FILE_EXTENSIONS.includes(extension)) {
    return "Format file harus PDF, JPG, PNG, DOC, atau DOCX.";
  }
  if (file.size <= 0) return "File kosong tidak dapat diunggah.";
  if (file.size > MAX_FILE_SIZE) return "Ukuran file maksimal 5 MB.";
  return "";
};

const getDocumentDownloadUrl = (fileUrl) => {
  if (!import.meta.env.DEV) return fileUrl;

  try {
    const url = new URL(fileUrl);
    if (url.hostname === "media.maestroswim.com") {
      return `/__trainer_document_files${url.pathname}${url.search}`;
    }
  } catch {
    return fileUrl;
  }

  return fileUrl;
};

const getApiErrorMessage = (error, fallback) => {
  const payload = error?.response?.data;
  if (typeof payload?.message === "string") return payload.message;
  if (typeof payload?.detail === "string") return payload.detail;

  if (payload && typeof payload === "object") {
    const message = Object.values(payload).flat().find(Boolean);
    if (typeof message === "string") return message;
  }

  return error?.message || fallback;
};

const Dokumen = ({ trainerId }) => {
  const [documents, setDocuments] = useState([]);
  const [documentCount, setDocumentCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterType, setFilterType] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeAction, setActiveAction] = useState("");

  useEffect(() => {
    let active = true;

    const fetchDocuments = async () => {
      if (!trainerId) {
        setDocuments([]);
        setDocumentCount(0);
        setLoadError("ID pelatih belum tersedia.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setLoadError("");
      try {
        const response = await getTrainerDocuments(trainerId, {
          filter_type: filterType || undefined,
        });
        const payload = response?.data;
        const results = Array.isArray(payload?.results)
          ? payload.results
          : Array.isArray(payload?.data)
            ? payload.data
            : null;

        if (!results) {
          throw new Error(payload?.message || "Format data dokumen tidak valid.");
        }
        if (active) {
          setDocuments(results);
          setDocumentCount(payload?.count ?? results.length);
        }
      } catch (error) {
        if (active) {
          setDocuments([]);
          setDocumentCount(0);
          setLoadError(
            error?.response?.data?.message ||
              error?.message ||
              "Dokumen pelatih gagal dimuat.",
          );
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };

    fetchDocuments();
    return () => {
      active = false;
    };
  }, [trainerId, filterType, refreshKey]);

  const filteredDocuments = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    if (!keyword) return documents;

    return documents.filter((document) =>
      [document.file_name, document.type_display, document.code]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword)),
    );
  }, [documents, searchQuery]);

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setErrors({});
  };

  const handleAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setIsModalOpen(true);
  };

  const handleEdit = async (document) => {
    if (activeAction) return;
    setActiveAction(`edit-${document.trainer_document_id}`);
    try {
      const response = await getTrainerDocumentDetail(
        trainerId,
        document.trainer_document_id,
      );
      const detail = response?.data?.data ?? response?.data;
      if (!detail?.trainer_document_id) {
        throw new Error("Format detail dokumen tidak valid.");
      }

      setEditingId(detail.trainer_document_id);
      setForm({
        fileName: detail.file_name || "",
        type: detail.type || "",
        documentNumber: detail.document_number || "",
        documentDate: detail.document_date || "",
        file: null,
      });
      setErrors({});
      setIsModalOpen(true);
    } catch (error) {
      Swal.fire(
        "Gagal",
        getApiErrorMessage(error, "Detail dokumen gagal dimuat."),
        "error",
      );
    } finally {
      setActiveAction("");
    }
  };

  const handleDelete = async (document) => {
    if (activeAction) return;
    const result = await Swal.fire({
      title: "Hapus dokumen?",
      text: `${document.file_name} akan dihapus dari daftar.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, hapus",
      cancelButtonText: "Batal",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      reverseButtons: true,
    });
    if (!result.isConfirmed) return;

    setActiveAction(`delete-${document.trainer_document_id}`);
    try {
      await deleteTrainerDocument(trainerId, document.trainer_document_id);
      Swal.fire("Berhasil", "Dokumen berhasil dihapus.", "success");
      setRefreshKey((current) => current + 1);
    } catch (error) {
      Swal.fire(
        "Gagal",
        getApiErrorMessage(error, "Dokumen gagal dihapus."),
        "error",
      );
    } finally {
      setActiveAction("");
    }
  };

  const handleView = async (document) => {
    if (activeAction) return;
    const previewWindow = window.open("", "_blank");
    setActiveAction(`view-${document.trainer_document_id}`);
    try {
      const response = await getTrainerDocumentDetail(
        trainerId,
        document.trainer_document_id,
      );
      const detail = response?.data?.data ?? response?.data;
      if (!detail?.file) throw new Error("File dokumen tidak tersedia.");
      if (previewWindow) previewWindow.location.href = detail.file;
    } catch (error) {
      previewWindow?.close();
      Swal.fire(
        "Gagal",
        getApiErrorMessage(error, "Dokumen gagal dibuka."),
        "error",
      );
    } finally {
      setActiveAction("");
    }
  };

  const handleDownload = async (document) => {
    if (activeAction) return;
    setActiveAction(`download-${document.trainer_document_id}`);
    try {
      const response = await getTrainerDocumentDetail(
        trainerId,
        document.trainer_document_id,
      );
      const detail = response?.data?.data ?? response?.data;
      if (!detail?.file) throw new Error("File dokumen tidak tersedia.");
      const fileResponse = await fetch(getDocumentDownloadUrl(detail.file));
      if (!fileResponse.ok) {
        throw new Error(`File gagal diunduh (${fileResponse.status}).`);
      }

      const blob = await fileResponse.blob();
      downloadBlob(blob, detail.file_name || "dokumen");
    } catch (error) {
      Swal.fire(
        "Gagal",
        getApiErrorMessage(error, "Dokumen gagal diunduh."),
        "error",
      );
    } finally {
      setActiveAction("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = {
      type: form.type ? "" : "Jenis dokumen wajib dipilih.",
      file: form.file || !editingId ? getFileValidationMessage(form.file) : "",
    };
    setErrors(nextErrors);
    if (nextErrors.type || nextErrors.file) return;

    const payload = {
      type: form.type,
      file: form.file,
      file_name: form.fileName.trim(),
      document_number: form.documentNumber.trim(),
      document_date: form.documentDate,
    };

    setIsSubmitting(true);
    try {
      if (editingId) {
        await updateTrainerDocument(trainerId, editingId, payload);
      } else {
        await createTrainerDocument(trainerId, payload);
      }

      const message = editingId
        ? "Dokumen berhasil diperbarui."
        : "Dokumen berhasil ditambahkan.";
      closeModal();
      Swal.fire("Berhasil", message, "success");
      setRefreshKey((current) => current + 1);
    } catch (error) {
      Swal.fire(
        "Gagal",
        getApiErrorMessage(
          error,
          editingId
            ? "Dokumen gagal diperbarui."
            : "Dokumen gagal ditambahkan.",
        ),
        "error",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = useMemo(
    () => [
      { Header: "Kode", accessor: "code", minWidth: 140 },
      { Header: "Nama File", accessor: "file_name", minWidth: 220 },
      {
        Header: "Jenis Dokumen",
        accessor: "type_display",
        minWidth: 180,
        Cell: ({ value, row }) => (
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${
              DOCUMENT_TYPE_BADGE_CLASSES[row.original.type] ||
              "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-500/15 dark:text-slate-300 dark:ring-slate-500/30"
            }`}
          >
            {value}
          </span>
        ),
      },
      {
        Header: "Nomor Dokumen",
        accessor: "document_number",
        minWidth: 180,
        Cell: ({ value }) => value || "-",
      },
      {
        Header: "Tanggal Dokumen",
        accessor: "document_date",
        minWidth: 180,
        Cell: ({ value }) => value || "-",
      },
      {
        Header: "Dibuat Pada",
        accessor: "created_at",
        minWidth: 210,
        Cell: ({ value }) => formatDateTime(value),
      },
      {
        Header: "Action",
        accessor: "action",
        id: "action",
        sticky: "right",
        Cell: ({ row }) => (
          <div className="flex items-center justify-center gap-2">
            <TableAction
              action={{
                name: "Lihat",
                icon:
                  activeAction === `view-${row.original.trainer_document_id}`
                    ? "heroicons-outline:arrow-path"
                    : "heroicons-outline:eye",
                onClick: () => handleView(row.original),
                disabled: Boolean(activeAction),
                isLoading:
                  activeAction === `view-${row.original.trainer_document_id}`,
                className:
                  "border-blue-200 bg-blue-50 text-blue-600 hover:border-blue-500 hover:bg-blue-500 hover:text-white dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300",
              }}
              row={row}
            />
            <TableAction
              action={{
                name: "Download",
                icon:
                  activeAction ===
                  `download-${row.original.trainer_document_id}`
                    ? "heroicons-outline:arrow-path"
                    : "heroicons-outline:arrow-down-tray",
                onClick: () => handleDownload(row.original),
                disabled: Boolean(activeAction),
                isLoading:
                  activeAction ===
                  `download-${row.original.trainer_document_id}`,
                className:
                  "border-emerald-200 bg-emerald-50 text-emerald-600 hover:border-emerald-500 hover:bg-emerald-500 hover:text-white dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300",
              }}
              row={row}
            />
            <TableAction
              action={{
                name: "Edit",
                icon:
                  activeAction === `edit-${row.original.trainer_document_id}`
                    ? "heroicons-outline:arrow-path"
                    : "heroicons:pencil-square",
                onClick: () => handleEdit(row.original),
                disabled: Boolean(activeAction),
                isLoading:
                  activeAction === `edit-${row.original.trainer_document_id}`,
                className:
                  "border-amber-200 bg-amber-50 text-amber-600 hover:border-amber-500 hover:bg-amber-500 hover:text-white dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300",
              }}
              row={row}
            />
            <TableAction
              action={{
                name: "Delete",
                icon:
                  activeAction ===
                  `delete-${row.original.trainer_document_id}`
                    ? "heroicons-outline:arrow-path"
                    : "heroicons-outline:trash",
                onClick: () => handleDelete(row.original),
                disabled: Boolean(activeAction),
                isLoading:
                  activeAction ===
                  `delete-${row.original.trainer_document_id}`,
                className:
                  "border-danger-200 bg-danger-50 text-danger-500 hover:bg-danger-500 hover:text-white dark:border-danger-500/30 dark:bg-danger-500/10",
              }}
              row={row}
            />
          </div>
        ),
      },
    ],
    [activeAction, trainerId],
  );

  return (
    <div className="space-y-5">
      <FilterSidebar
        open={isFilterOpen}
        onOpen={() => setIsFilterOpen(true)}
        onClose={() => setIsFilterOpen(false)}
        title="Filter Dokumen"
        description="Data dimuat ulang dari backend saat jenis dokumen berubah."
        activeCount={filterType ? 1 : 0}
      >
        <div className="flex flex-col gap-4">
          <Select
            id="filter-document-type"
            label="Jenis Dokumen"
            placeholder="Semua jenis dokumen"
            options={DOCUMENT_TYPES}
            value={filterType}
            onChange={(event) => setFilterType(event.target.value)}
          />
          <Button
            type="button"
            text="Reset Filter"
            icon="heroicons-outline:arrow-path"
            className="btn-light w-full"
            onClick={() => setFilterType("")}
            disabled={!filterType}
          />
        </div>
      </FilterSidebar>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            Dokumen Pelatih
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Unggah dan kelola dokumen pelatih untuk dilihat atau diunduh.
          </p>
        </div>
        <Button
          type="button"
          text="Tambah Dokumen"
          icon="heroicons-outline:plus"
          className="btn-primary"
          onClick={handleAdd}
          disabled={!trainerId}
        />
      </div>

      {isLoading ? (
        <SkeletionTable />
      ) : loadError ? (
        <div className="rounded-lg border border-danger-200 bg-danger-50 p-5 text-center text-sm text-danger-600 dark:border-danger-500/30 dark:bg-danger-500/10 dark:text-danger-300">
          <p>{loadError}</p>
          {trainerId && (
            <Button
              type="button"
              text="Muat Ulang"
              icon="heroicons-outline:arrow-path"
              className="btn-outline-danger mt-3"
              onClick={() => setRefreshKey((current) => current + 1)}
            />
          )}
        </div>
      ) : (
        <>
          <Search searchValue={searchQuery} handleSearch={setSearchQuery} />
          <Table
            tableId="trainer-document-table"
            listData={{
              count: searchQuery ? filteredDocuments.length : documentCount,
              results: filteredDocuments,
            }}
            listColumn={columns}
            isPagination={false}
            fitToContainer
            bodyCellAlign="center"
            actionColumnClass="w-56 min-w-[14rem]"
          />
        </>
      )}

      {isModalOpen && (
        <Modal
          activeModal={isModalOpen}
          onClose={() => {
            if (!isSubmitting) closeModal();
          }}
          title={editingId ? "Edit Dokumen" : "Tambah Dokumen"}
          centered
          className="max-w-2xl"
          scrollContent
        >
          <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:bg-slate-700/40 dark:text-slate-300">
            <span className="font-semibold text-slate-800 dark:text-slate-100">
              {editingId ? "Perbarui data dokumen" : "Tambahkan dokumen baru"}
            </span>
            <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
              Hanya jenis dokumen dan file yang wajib diisi.
            </span>
          </div>

          <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
            <Select
              id="document-type"
              label="Jenis Dokumen *"
              placeholder="Pilih jenis dokumen"
              options={DOCUMENT_TYPES}
              value={form.type}
              error={errors.type ? { message: errors.type } : undefined}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  type: event.target.value,
                }))
              }
            />
            <Textinput
              id="document-file-name"
              label="Nama File"
              placeholder="Contoh: Kontrak Rivan Nurdin 2026"
              value={form.fileName}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  fileName: event.target.value,
                }))
              }
            />
            <Textinput
              id="document-number"
              label="Nomor Dokumen"
              placeholder="Contoh: MS-20260801"
              value={form.documentNumber}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  documentNumber: event.target.value,
                }))
              }
            />
            <Textinput
              id="document-date"
              type="date"
              label="Tanggal Dokumen"
              placeholder="Pilih tanggal dokumen"
              value={form.documentDate}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  documentDate: event.target.value,
                }))
              }
            />
          </div>

          <div
            className={`rounded-xl border border-dashed p-4 sm:p-5 ${
              errors.file
                ? "has-error border-danger-400 bg-danger-50/40 dark:bg-danger-500/5"
                : "border-slate-300 bg-slate-50/70 dark:border-slate-600 dark:bg-slate-700/20"
            }`}
          >
            <label
              htmlFor="document-upload"
              className="form-label block capitalize"
            >
              Upload File {editingId ? "(Opsional)" : "*"}
            </label>
            <input
              id="document-upload"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={(event) => {
                const selectedFile = event.target.files?.[0] ?? null;
                const validationMessage = selectedFile
                  ? getFileValidationMessage(selectedFile)
                  : "";
                if (validationMessage) {
                  setForm((current) => ({ ...current, file: null }));
                  setErrors((current) => ({
                    ...current,
                    file: validationMessage,
                  }));
                  event.target.value = "";
                  return;
                }

                setForm((current) => ({
                  ...current,
                  file: selectedFile,
                  fileName: current.fileName || selectedFile?.name || "",
                }));
                setErrors((current) => ({ ...current, file: "" }));
              }}
              className={`block w-full rounded-md border bg-white text-sm text-slate-500 file:mr-3 file:border-0 file:bg-primary-500/10 file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-primary-600 hover:file:bg-primary-500/20 dark:bg-slate-800 dark:text-slate-300 ${
                errors.file
                  ? "border-danger-500"
                  : "border-slate-200 dark:border-slate-700"
              }`}
            />
            <p className="mt-2 text-xs text-slate-500">
              Format: PDF, JPG, PNG, DOC, atau DOCX. Ukuran maksimal 5 MB.
            </p>
            {editingId && !form.file && (
              <p className="mt-2 rounded-md bg-blue-50 px-3 py-2 text-xs text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                File yang tersimpan tetap digunakan. Pilih file baru hanya jika
                ingin menggantinya.
              </p>
            )}
            {errors.file && (
              <p className="mt-2 text-sm text-danger-500">{errors.file}</p>
            )}
          </div>
          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end dark:border-slate-700">
            <Button
              type="button"
              text="Batal"
              className="btn-outline-secondary w-full sm:w-auto"
              onClick={closeModal}
              disabled={isSubmitting}
            />
            <Button
              type="submit"
              text={
                isSubmitting
                  ? "Menyimpan..."
                  : editingId
                    ? "Simpan Perubahan"
                    : "Simpan"
              }
              icon="heroicons-outline:check"
              className="btn-primary w-full sm:w-auto"
              disabled={isSubmitting}
              isLoading={isSubmitting}
            />
          </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default Dokumen;
