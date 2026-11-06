import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Button from "@/components/ui/Button";
import Fileinput from "@/components/ui/Fileinput";
import Icon from "@/components/ui/Icon";
import Modal from "@/components/ui/Modal";
import { addBlogMedia, getBlogMedia } from "@/axios/blog/media";
import { getBlogCollection } from "./blogUtils";
import { getBlogErrorMessage } from "./blogAlerts";

const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "gif", "webp", "svg"]);

const isImage = (item) => {
  const extension = String(item?.extension || "").toLowerCase();
  const mimeType = String(item?.mime_type || item?.content_type || "");
  return IMAGE_EXTENSIONS.has(extension) || mimeType.startsWith("image/");
};

const BlogMediaPicker = ({ open, onClose, onSelect }) => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [altText, setAltText] = useState("");
  const [uploadError, setUploadError] = useState("");

  const mediaQuery = useQuery({
    queryKey: ["blog-media-picker"],
    queryFn: async () =>
      (
        await getBlogMedia({
          page_size: 100,
          ordering: "-created_at",
        })
      ).data,
    enabled: open,
  });
  const images = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return getBlogCollection(mediaQuery.data)
      .filter(isImage)
      .filter((item) => {
        if (!keyword) return true;
        return [item.original_name, item.alt_text]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(keyword));
      });
  }, [mediaQuery.data, search]);

  const uploadMutation = useMutation({
    mutationFn: addBlogMedia,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-media"] });
      queryClient.invalidateQueries({ queryKey: ["blog-media-options"] });
      queryClient.invalidateQueries({ queryKey: ["blog-media-picker"] });
    },
  });

  useEffect(() => {
    if (!open) {
      setSearch("");
      setSelectedFile(null);
      setAltText("");
      setUploadError("");
    }
  }, [open]);

  const handleUpload = async () => {
    if (!selectedFile || uploadMutation.isPending) return;
    setUploadError("");
    if (!selectedFile.type.startsWith("image/")) {
      setUploadError("File yang dipilih harus berupa gambar.");
      return;
    }
    try {
      const response = await uploadMutation.mutateAsync({
        file: selectedFile,
        alt_text: altText.trim(),
      });
      const uploaded = response?.data;
      if (!uploaded?.url) {
        throw new Error("URL gambar tidak ditemukan pada respons upload.");
      }
      onSelect(uploaded);
    } catch (error) {
      setUploadError(
        getBlogErrorMessage(error, "Gambar belum berhasil diunggah."),
      );
    }
  };

  return (
    <Modal
      activeModal={open}
      onClose={onClose}
      title="Pilih Gambar dari Media"
      className="max-w-5xl"
      centered
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section className="min-w-0">
          <div className="relative mb-4">
            <Icon
              icon="heroicons-outline:magnifying-glass"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              className="form-control py-2 pl-10"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari nama file atau alt text..."
              aria-label="Cari gambar media"
            />
          </div>

          {mediaQuery.isError && (
            <div className="rounded-md border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700">
              {getBlogErrorMessage(mediaQuery.error, "Media gagal dimuat.")}
            </div>
          )}

          <div className="max-h-[55vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {images.map((item) => (
                <button
                  key={item.media_id || item.url}
                  type="button"
                  className="group overflow-hidden rounded-lg border border-slate-200 bg-white text-left transition hover:border-primary-500 hover:ring-2 hover:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-800"
                  onClick={() => onSelect(item)}
                  title={`Pilih ${item.original_name || "gambar"}`}
                >
                  <img
                    src={item.url}
                    alt={item.alt_text || item.original_name || "Media blog"}
                    className="h-28 w-full bg-slate-100 object-cover dark:bg-slate-900"
                    loading="lazy"
                  />
                  <span className="block truncate px-3 py-2 text-xs font-medium text-slate-700 group-hover:text-primary-600 dark:text-slate-200">
                    {item.original_name || "Gambar"}
                  </span>
                </button>
              ))}
            </div>
            {!images.length && !mediaQuery.isLoading && !mediaQuery.isError && (
              <div className="py-14 text-center text-sm text-slate-500">
                {search ? "Gambar tidak ditemukan." : "Belum ada gambar di media."}
              </div>
            )}
            {mediaQuery.isLoading && (
              <div className="py-14 text-center text-sm text-slate-500">
                Memuat media...
              </div>
            )}
          </div>
        </section>

        <aside className="border-t border-slate-200 pt-5 dark:border-slate-700 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          <h3 className="mb-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
            Upload Gambar Baru
          </h3>
          <p className="mb-4 text-xs text-slate-500">
            Gambar yang diupload juga akan tersimpan di media library.
          </p>
          <div className="space-y-4">
            <Fileinput
              accept="image/*"
              selectedFile={selectedFile}
              onChange={(event) => {
                setSelectedFile(event.target.files?.[0] || null);
                setUploadError("");
              }}
              onRemove={() => setSelectedFile(null)}
              preview={Boolean(selectedFile?.type?.startsWith("image/"))}
            />
            <div>
              <label className="form-label" htmlFor="editor-media-alt-text">
                Alt Text
              </label>
              <textarea
                id="editor-media-alt-text"
                className="form-control py-2"
                rows="3"
                value={altText}
                onChange={(event) => setAltText(event.target.value)}
                placeholder="Deskripsikan isi gambar..."
              />
            </div>
            {uploadError && (
              <p className="text-sm text-danger-500" role="alert">
                {uploadError}
              </p>
            )}
            <Button
              text="Upload dan Gunakan"
              icon="heroicons-outline:arrow-up-tray"
              className="btn-dark w-full"
              onClick={handleUpload}
              disabled={!selectedFile}
              isLoading={uploadMutation.isPending}
            />
          </div>
        </aside>
      </div>
    </Modal>
  );
};

export default BlogMediaPicker;
