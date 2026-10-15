import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Swal from "sweetalert2";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import Modal from "@/components/ui/Modal";
import Textinput from "@/components/ui/Textinput";
import PaginationComponent from "@/components/globals/table/pagination";
import {
  addBlogTag,
  deleteBlogTag,
  editBlogTag,
  getBlogTag,
  getBlogTags,
} from "@/axios/blog/blog";
import {
  confirmBlogAction,
  getBlogErrorMessage,
  showBlogLoading,
} from "./blogAlerts";

const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "-";

const BlogTags = () => {
  const queryClient = useQueryClient();
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState(null);
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");

  const tagsQuery = useQuery({
    queryKey: ["blog-tags", pageIndex, pageSize, appliedSearch],
    queryFn: async () =>
      (
        await getBlogTags({
          page: pageIndex + 1,
          page_size: pageSize,
          search: appliedSearch || undefined,
          ordering: "-created_at",
        })
      ).data,
  });
  const tags = tagsQuery.data?.results || [];
  const pageCount = Math.ceil((tagsQuery.data?.count || 0) / pageSize);

  const saveMutation = useMutation({
    mutationFn: ({ tagId, data }) =>
      tagId ? editBlogTag(tagId, data) : addBlogTag(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["blog-tags"] }),
  });
  const deleteMutation = useMutation({
    mutationFn: deleteBlogTag,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["blog-tags"] }),
  });

  const closeModal = () => {
    setModalOpen(false);
    setSelectedTag(null);
    setName("");
    setNameError("");
  };

  const openCreate = () => {
    setSelectedTag(null);
    setName("");
    setNameError("");
    setModalOpen(true);
  };

  const openEdit = async (tag) => {
    setSelectedTag(tag);
    setName(tag.name);
    setNameError("");
    setModalOpen(true);
    try {
      const response = await getBlogTag(tag.tag_id);
      setSelectedTag(response.data);
      setName(response.data.name || "");
    } catch (error) {
      Swal.fire(
        "Detail gagal dimuat",
        getBlogErrorMessage(error, "Data pada tabel tetap dapat diedit."),
        "warning",
      );
    }
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!name.trim()) {
      setNameError("Nama tag wajib diisi.");
      return;
    }
    const wasEditing = Boolean(selectedTag);
    const confirmed = await confirmBlogAction({
      title: wasEditing ? "Simpan perubahan tag?" : "Tambah tag?",
      text: wasEditing
        ? `Perubahan pada tag “${name.trim()}” akan disimpan.`
        : `Tag “${name.trim()}” akan ditambahkan.`,
      confirmButtonText: wasEditing ? "Ya, simpan perubahan" : "Ya, tambah",
    });
    if (!confirmed) return;

    showBlogLoading(
      wasEditing ? "Menyimpan tag..." : "Menambahkan tag...",
      "Mohon tunggu sampai proses selesai.",
    );
    try {
      await saveMutation.mutateAsync({
        tagId: selectedTag?.tag_id,
        data: { name: name.trim() },
      });
      closeModal();
      Swal.fire(
        "Berhasil",
        `Tag berhasil ${wasEditing ? "diperbarui" : "ditambahkan"}.`,
        "success",
      );
    } catch (error) {
      Swal.fire(
        "Gagal menyimpan",
        getBlogErrorMessage(error, "Tag belum berhasil disimpan."),
        "error",
      );
    }
  };

  const handleDelete = async (tag) => {
    const confirmed = await confirmBlogAction({
      title: "Hapus tag?",
      text:
        tag.post_count > 0
          ? `Tag “${tag.name}” digunakan oleh ${tag.post_count} post.`
          : `Tag “${tag.name}” akan dihapus permanen.`,
      icon: "warning",
      confirmButtonText: "Ya, hapus",
      confirmButtonColor: "#ef4444",
    });
    if (!confirmed) return;

    showBlogLoading("Menghapus tag...", "Mohon tunggu sampai proses selesai.");
    try {
      await deleteMutation.mutateAsync(tag.tag_id);
      Swal.fire("Terhapus", "Tag berhasil dihapus.", "success");
    } catch (error) {
      Swal.fire(
        "Gagal menghapus",
        getBlogErrorMessage(error, "Tag mungkin masih digunakan oleh post."),
        "error",
      );
    }
  };

  return (
    <Card
      title="Blog Tags"
      headerslot={
        <Button
          text="Tambah Tag"
          icon="heroicons-outline:plus"
          className="btn-primary"
          onClick={openCreate}
        />
      }
    >
      <form
        className="mb-5 flex flex-col gap-3 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          setPageIndex(0);
          setAppliedSearch(search.trim());
        }}
      >
        <input
          className="form-control py-2 sm:max-w-sm"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Cari nama atau slug tag..."
        />
        <Button
          type="submit"
          text="Cari"
          icon="heroicons-outline:magnifying-glass"
          className="btn-dark"
        />
      </form>

      {tagsQuery.isError && (
        <div className="mb-4 rounded-md border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700">
          {getBlogErrorMessage(tagsQuery.error, "Data tags gagal dimuat.")}
        </div>
      )}

      <div className="overflow-x-auto rounded-md border border-slate-200 dark:border-slate-700">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
          <thead className="bg-slate-50 dark:bg-slate-700">
            <tr className="text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-300">
              <th className="px-5 py-3">Nama</th>
              <th className="px-5 py-3">Slug</th>
              <th className="px-5 py-3">Jumlah Post</th>
              <th className="px-5 py-3">Dibuat Oleh</th>
              <th className="px-5 py-3">Terakhir Diubah</th>
              <th className="px-5 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {tags.map((tag) => (
              <tr key={tag.tag_id} className="text-sm text-slate-700 dark:text-slate-200">
                <td className="px-5 py-4 font-medium">{tag.name}</td>
                <td className="px-5 py-4 text-slate-500">{tag.slug}</td>
                <td className="px-5 py-4">
                  <span className="rounded-full bg-primary-100 px-2.5 py-1 text-xs font-medium text-primary-700">
                    {tag.post_count || 0}
                  </span>
                </td>
                <td className="px-5 py-4">{tag.created_by_name || "-"}</td>
                <td className="whitespace-nowrap px-5 py-4">{formatDate(tag.updated_at)}</td>
                <td className="px-5 py-4">
                  <div className="flex justify-end gap-2">
                    <button
                      className="action-btn bg-primary-500 bg-opacity-30 text-primary-500 hover:bg-opacity-100 hover:text-white"
                      onClick={() => openEdit(tag)}
                      title="Edit"
                    >
                      <Icon icon="heroicons:pencil-square" />
                    </button>
                    <button
                      className="action-btn bg-danger-500 bg-opacity-30 text-danger-500 hover:bg-opacity-100 hover:text-white"
                      onClick={() => handleDelete(tag)}
                      disabled={deleteMutation.isPending}
                      title="Hapus"
                    >
                      <Icon icon="heroicons-outline:trash" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!tags.length && (
              <tr>
                <td colSpan="6" className="px-5 py-14 text-center text-slate-500">
                  {tagsQuery.isLoading ? "Memuat tags..." : "Belum ada tag."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <PaginationComponent
        pageSize={pageSize}
        pageIndex={pageIndex}
        pageCount={pageCount}
        canPreviousPage={pageIndex > 0}
        canNextPage={pageIndex < pageCount - 1}
        gotoPage={setPageIndex}
        previousPage={() => setPageIndex((page) => Math.max(0, page - 1))}
        nextPage={() => setPageIndex((page) => Math.min(pageCount - 1, page + 1))}
        setPageSize={(size) => {
          setPageSize(size);
          setPageIndex(0);
        }}
      />

      <Modal
        activeModal={modalOpen}
        onClose={closeModal}
        title={selectedTag ? "Edit Tag" : "Tambah Tag"}
        className="max-w-lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Textinput
            label="Nama Tag *"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setNameError("");
            }}
            error={nameError ? { message: nameError } : undefined}
            placeholder="Contoh: gaya hidup"
          />
          {selectedTag?.slug && (
            <Textinput label="Slug" value={selectedTag.slug} readonly disabled />
          )}
          <p className="text-xs text-slate-500">
            Slug dibuat otomatis oleh backend berdasarkan nama tag.
          </p>
          <div className="flex justify-end gap-3">
            <Button text="Batal" className="btn-light" onClick={closeModal} />
            <Button
              text={selectedTag ? "Simpan Perubahan" : "Tambah Tag"}
              type="submit"
              className="btn-dark"
              isLoading={saveMutation.isPending}
            />
          </div>
        </form>
      </Modal>
    </Card>
  );
};

export default BlogTags;
