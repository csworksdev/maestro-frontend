import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Swal from "sweetalert2";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import Modal from "@/components/ui/Modal";
import Fileinput from "@/components/ui/Fileinput";
import Tooltip from "@/components/ui/Tooltip";
import PaginationComponent from "@/components/globals/table/pagination";
import {
  addBlogMedia,
  deleteBlogMedia,
  editBlogMedia,
  getBlogMedia,
} from "@/axios/blog/media";
import {
  confirmBlogAction,
  getBlogErrorMessage,
  showBlogLoading,
} from "./blogAlerts";
import { getBlogCollection, getBlogPageCount } from "./blogUtils";

const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "gif", "webp", "svg"]);
const formatBytes = (bytes = 0) => {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`;
};
const BlogMedia = () => {
  const queryClient = useQueryClient();
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editMedia, setEditMedia] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [altText, setAltText] = useState("");

  const mediaQuery = useQuery({
    queryKey: ["blog-media", pageIndex, pageSize, appliedSearch],
    queryFn: async () =>
      (
        await getBlogMedia({
          page: pageIndex + 1,
          page_size: pageSize,
          search: appliedSearch || undefined,
          ordering: "-created_at",
        })
      ).data,
  });
  const media = getBlogCollection(mediaQuery.data);
  const pageCount = getBlogPageCount(mediaQuery.data, pageSize);

  const uploadMutation = useMutation({
    mutationFn: addBlogMedia,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["blog-media"] }),
  });
  const editMutation = useMutation({
    mutationFn: ({ mediaId, data }) => editBlogMedia(mediaId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["blog-media"] }),
  });
  const deleteMutation = useMutation({
    mutationFn: deleteBlogMedia,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["blog-media"] }),
  });

  const resetUpload = () => {
    setUploadOpen(false);
    setSelectedFile(null);
    setAltText("");
  };

  const handleUpload = async (event) => {
    event.preventDefault();
    if (!selectedFile) {
      Swal.fire("File belum dipilih", "Pilih file yang ingin diunggah.", "warning");
      return;
    }
    const confirmed = await confirmBlogAction({
      title: "Upload media?",
      text: `File “${selectedFile.name}” akan diunggah ke media blog.`,
      confirmButtonText: "Ya, upload",
    });
    if (!confirmed) return;

    showBlogLoading(
      "Mengunggah media...",
      "Mohon tunggu. Waktu upload bergantung pada ukuran file dan koneksi internet.",
    );
    try {
      await uploadMutation.mutateAsync({ file: selectedFile, alt_text: altText.trim() });
      resetUpload();
      Swal.fire("Berhasil", "Media berhasil diunggah.", "success");
    } catch (error) {
      Swal.fire("Gagal mengunggah", getBlogErrorMessage(error, "Media belum berhasil diunggah."), "error");
    }
  };

  const openEdit = (item) => {
    setEditMedia(item);
    setAltText(item.alt_text || "");
  };

  const handleEdit = async (event) => {
    event.preventDefault();
    const confirmed = await confirmBlogAction({
      title: "Simpan alt text?",
      text: `Alt text untuk “${editMedia.original_name}” akan diperbarui.`,
      confirmButtonText: "Ya, simpan",
    });
    if (!confirmed) return;

    showBlogLoading("Menyimpan alt text...", "Mohon tunggu sampai proses selesai.");
    try {
      await editMutation.mutateAsync({
        mediaId: editMedia.media_id,
        data: { alt_text: altText.trim() },
      });
      setEditMedia(null);
      setAltText("");
      Swal.fire("Berhasil", "Alt text media berhasil diperbarui.", "success");
    } catch (error) {
      Swal.fire("Gagal memperbarui", getBlogErrorMessage(error, "Media belum berhasil diperbarui."), "error");
    }
  };

  const handleDelete = async (item) => {
    const confirmed = await confirmBlogAction({
      title: "Hapus media?",
      text: `File “${item.original_name}” akan dihapus permanen.`,
      icon: "warning",
      confirmButtonText: "Ya, hapus",
      confirmButtonColor: "#ef4444",
    });
    if (!confirmed) return;
    showBlogLoading("Menghapus media...", "Mohon tunggu sampai proses selesai.");
    try {
      await deleteMutation.mutateAsync(item.media_id);
      Swal.fire("Terhapus", "Media berhasil dihapus.", "success");
    } catch (error) {
      Swal.fire("Gagal menghapus", getBlogErrorMessage(error, "Media mungkin masih digunakan oleh blog."), "error");
    }
  };

  const handleCopy = async (url) => {
    try {
      if (!url) throw new Error("URL media tidak tersedia.");
      if (!navigator.clipboard?.writeText) {
        throw new Error("Browser tidak mendukung akses clipboard.");
      }
      await navigator.clipboard.writeText(url);
      Swal.fire({ title: "URL disalin", icon: "success", timer: 1000, showConfirmButton: false });
    } catch (error) {
      Swal.fire("Gagal menyalin URL", error.message || "Salin URL secara manual.", "error");
    }
  };

  return (
    <Card
      title="Blog Media"
      headerslot={<Button text="Upload Media" icon="heroicons-outline:arrow-up-tray" className="btn-primary" onClick={() => setUploadOpen(true)} />}
    >
      <form
        className="mb-5 flex flex-col gap-3 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          setPageIndex(0);
          setAppliedSearch(search.trim());
        }}
      >
        <input className="form-control py-2 sm:max-w-sm" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari nama file atau alt text..." />
        <Button type="submit" text="Cari" icon="heroicons-outline:magnifying-glass" className="btn-dark" />
      </form>

      {mediaQuery.isError && (
        <div className="mb-4 rounded-md border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700">{getBlogErrorMessage(mediaQuery.error, "Media gagal dimuat.")}</div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {media.map((item) => {
          const isImage = IMAGE_EXTENSIONS.has(String(item.extension || "").toLowerCase());
          return (
            <article key={item.media_id} className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
              <div className="flex h-44 items-center justify-center bg-slate-100 dark:bg-slate-900">
                {isImage ? (
                  <img src={item.url} alt={item.alt_text || item.original_name} className="h-full w-full object-cover" />
                ) : (
                  <div className="text-center text-slate-400">
                    <Icon icon="heroicons-outline:document" className="mx-auto text-5xl" />
                    <span className="mt-2 block text-xs uppercase">{item.extension || "file"}</span>
                  </div>
                )}
              </div>
              <div className="space-y-3 p-4">
                <div>
                  <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100" title={item.original_name}>{item.original_name}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatBytes(item.file_size)} · {item.created_by_name || "-"}</p>
                  <p className="mt-2 line-clamp-2 min-h-[2.5rem] text-xs text-slate-500">{item.alt_text || "Belum ada alt text"}</p>
                </div>
                <div className="flex justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-700">
                  <Tooltip content="Salin URL" placement="top" arrow>
                    <button type="button" className="action-btn bg-info-500 bg-opacity-30 text-info-500 hover:bg-opacity-100 hover:text-white" onClick={() => handleCopy(item.url)} aria-label={`Salin URL ${item.original_name}`}><Icon icon="heroicons-outline:link" /></button>
                  </Tooltip>
                  <Tooltip content="Edit" placement="top" arrow>
                    <button type="button" className="action-btn bg-primary-500 bg-opacity-30 text-primary-500 hover:bg-opacity-100 hover:text-white" onClick={() => openEdit(item)} aria-label={`Edit alt text ${item.original_name}`}><Icon icon="heroicons:pencil-square" /></button>
                  </Tooltip>
                  <Tooltip content="Hapus" placement="top" arrow>
                    <button type="button" className="action-btn bg-danger-500 bg-opacity-30 text-danger-500 hover:bg-opacity-100 hover:text-white" onClick={() => handleDelete(item)} disabled={deleteMutation.isPending} aria-label={`Hapus ${item.original_name}`}><Icon icon="heroicons-outline:trash" /></button>
                  </Tooltip>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {!media.length && (
        <div className="py-16 text-center text-slate-500">{mediaQuery.isLoading ? "Memuat media..." : "Belum ada media."}</div>
      )}

      <PaginationComponent
        pageSize={pageSize}
        pageIndex={pageIndex}
        pageCount={pageCount}
        canPreviousPage={pageIndex > 0}
        canNextPage={pageIndex < pageCount - 1}
        gotoPage={setPageIndex}
        previousPage={() => setPageIndex((page) => Math.max(0, page - 1))}
        nextPage={() => setPageIndex((page) => Math.min(Math.max(0, pageCount - 1), page + 1))}
        setPageSize={(size) => { setPageSize(size); setPageIndex(0); }}
      />

      <Modal activeModal={uploadOpen} onClose={resetUpload} title="Upload Blog Media" className="max-w-lg">
        <form onSubmit={handleUpload} className="space-y-4">
          <Fileinput selectedFile={selectedFile} onChange={(event) => setSelectedFile(event.target.files?.[0] || null)} onRemove={() => setSelectedFile(null)} preview={Boolean(selectedFile?.type?.startsWith("image/"))} />
          <div>
            <label className="form-label" htmlFor="media-alt-text">Alt Text</label>
            <textarea id="media-alt-text" className="form-control py-2" rows="3" value={altText} onChange={(event) => setAltText(event.target.value)} placeholder="Deskripsikan isi gambar untuk aksesibilitas..." />
          </div>
          <div className="flex justify-end gap-3"><Button text="Batal" className="btn-light" onClick={resetUpload} /><Button text="Upload" type="submit" className="btn-dark" isLoading={uploadMutation.isPending} /></div>
        </form>
      </Modal>

      <Modal activeModal={Boolean(editMedia)} onClose={() => setEditMedia(null)} title="Edit Alt Text" className="max-w-lg">
        <form onSubmit={handleEdit} className="space-y-4">
          {editMedia && <p className="truncate text-sm font-medium">{editMedia.original_name}</p>}
          <label className="form-label" htmlFor="edit-media-alt-text">Alt Text</label>
          <textarea id="edit-media-alt-text" className="form-control py-2" rows="4" value={altText} onChange={(event) => setAltText(event.target.value)} placeholder="Alt text media..." />
          <div className="flex justify-end gap-3"><Button text="Batal" className="btn-light" onClick={() => setEditMedia(null)} /><Button text="Simpan" type="submit" className="btn-dark" isLoading={editMutation.isPending} /></div>
        </form>
      </Modal>
    </Card>
  );
};

export default BlogMedia;
