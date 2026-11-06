import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Swal from "sweetalert2";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Textinput from "@/components/ui/Textinput";
import Table from "@/components/globals/table/table";
import TableAction from "@/components/globals/table/tableAction";
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
import { formatBlogDate, getBlogCollection, getBlogPageCount } from "./blogUtils";

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
  const tags = getBlogCollection(tagsQuery.data);
  const pageCount = getBlogPageCount(tagsQuery.data, pageSize);

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

  const columns = useMemo(
    () => [
      {
        Header: "Nama",
        accessor: "name",
        minWidth: 180,
        Cell: ({ value }) => (
          <span className="font-medium text-slate-700 dark:text-slate-200">
            {value}
          </span>
        ),
      },
      {
        Header: "Slug",
        accessor: "slug",
        minWidth: 190,
        Cell: ({ value }) => <span className="text-slate-500">{value}</span>,
      },
      {
        Header: "Jumlah Post",
        accessor: "post_count",
        minWidth: 120,
        Cell: ({ value }) => (
          <span className="rounded-full bg-primary-100 px-2.5 py-1 text-xs font-medium text-primary-700">
            {value || 0}
          </span>
        ),
      },
      {
        Header: "Dibuat Oleh",
        accessor: "created_by_name",
        minWidth: 150,
        Cell: ({ value }) => value || "-",
      },
      {
        Header: "Terakhir Diubah",
        accessor: "updated_at",
        minWidth: 170,
        Cell: ({ value }) => (
          <span className="whitespace-nowrap">{formatBlogDate(value)}</span>
        ),
      },
      {
        Header: "Aksi",
        accessor: "action",
        id: "action",
        sticky: "right",
        disableSortBy: true,
        Cell: ({ row }) => {
          const tag = row.original;
          return (
            <div className="flex items-center justify-center gap-2">
              <TableAction
                action={{
                  name: "Edit",
                  icon: "heroicons:pencil-square",
                  className:
                    "!border-primary-200 !bg-primary-100 !text-primary-600 hover:!border-primary-300 hover:!bg-primary-200 hover:!text-primary-700 dark:!border-primary-500/30 dark:!bg-primary-500/10 dark:!text-primary-300 dark:hover:!border-primary-500/50 dark:hover:!bg-primary-500/20",
                  onClick: () => openEdit(tag),
                }}
                row={tag}
              />
              <TableAction
                action={{
                  name: "Delete",
                  icon: "heroicons-outline:trash",
                  disabled: deleteMutation.isPending,
                  className:
                    "!border-danger-200 !bg-danger-100 !text-danger-600 hover:!border-danger-300 hover:!bg-danger-200 hover:!text-danger-700 dark:!border-danger-500/30 dark:!bg-danger-500/10 dark:!text-danger-300 dark:hover:!border-danger-500/50 dark:hover:!bg-danger-500/20",
                  onClick: () => handleDelete(tag),
                }}
                row={tag}
              />
            </div>
          );
        },
      },
    ],
    [deleteMutation.isPending],
  );

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

      {tags.length ? (
        <Table
          tableId="blog-tags-table"
          listData={{ results: tags }}
          listColumn={columns}
          isPagination={false}
          tableMinWidth={820}
        />
      ) : (
        <div className="border-y border-slate-100 py-14 text-center text-sm text-slate-500 dark:border-slate-700">
          {tagsQuery.isLoading ? "Memuat tags..." : "Belum ada tag."}
        </div>
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
