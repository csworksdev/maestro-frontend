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
  addBlogCategory,
  deleteBlogCategory,
  editBlogCategory,
  getBlogCategories,
  getBlogCategory,
} from "@/axios/blog/blog";
import {
  confirmBlogAction,
  getBlogErrorMessage,
  showBlogLoading,
} from "./blogAlerts";
import { formatBlogDate, getBlogCollection, getBlogPageCount } from "./blogUtils";

const BlogCategories = () => {
  const queryClient = useQueryClient();
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [form, setForm] = useState({ name: "", description: "" });
  const [nameError, setNameError] = useState("");

  const categoriesQuery = useQuery({
    queryKey: [
      "blog-categories-admin",
      pageIndex,
      pageSize,
      appliedSearch,
    ],
    queryFn: async () =>
      (
        await getBlogCategories({
          page: pageIndex + 1,
          page_size: pageSize,
          search: appliedSearch || undefined,
          ordering: "-created_at",
        })
      ).data,
  });

  const categories = getBlogCollection(categoriesQuery.data);
  const pageCount = getBlogPageCount(categoriesQuery.data, pageSize);

  const invalidateCategories = () => {
    queryClient.invalidateQueries({ queryKey: ["blog-categories-admin"] });
    queryClient.invalidateQueries({ queryKey: ["blog-categories"] });
  };

  const saveMutation = useMutation({
    mutationFn: ({ categoryId, data }) =>
      categoryId ? editBlogCategory(categoryId, data) : addBlogCategory(data),
    onSuccess: invalidateCategories,
  });
  const deleteMutation = useMutation({
    mutationFn: deleteBlogCategory,
    onSuccess: invalidateCategories,
  });

  const resetForm = () => {
    setSelectedCategory(null);
    setForm({ name: "", description: "" });
    setNameError("");
  };

  const closeModal = () => {
    setModalOpen(false);
    resetForm();
  };

  const openCreate = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEdit = async (category) => {
    setSelectedCategory(category);
    setForm({
      name: category.name || "",
      description: category.description || "",
    });
    setNameError("");
    setModalOpen(true);
    try {
      const { data } = await getBlogCategory(category.category_id);
      setSelectedCategory(data);
      setForm({
        name: data.name || "",
        description: data.description || "",
      });
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
    if (!form.name.trim()) {
      setNameError("Nama kategori wajib diisi.");
      return;
    }
    const wasEditing = Boolean(selectedCategory);
    const confirmed = await confirmBlogAction({
      title: wasEditing ? "Simpan perubahan kategori?" : "Tambah kategori?",
      text: wasEditing
        ? `Perubahan pada kategori “${form.name.trim()}” akan disimpan.`
        : `Kategori “${form.name.trim()}” akan ditambahkan.`,
      confirmButtonText: wasEditing ? "Ya, simpan perubahan" : "Ya, tambah",
    });
    if (!confirmed) return;

    showBlogLoading(
      wasEditing ? "Menyimpan kategori..." : "Menambahkan kategori...",
      "Mohon tunggu sampai proses selesai.",
    );
    try {
      await saveMutation.mutateAsync({
        categoryId: selectedCategory?.category_id,
        data: {
          name: form.name.trim(),
          description: form.description.trim(),
        },
      });
      closeModal();
      Swal.fire(
        "Berhasil",
        `Kategori berhasil ${wasEditing ? "diperbarui" : "ditambahkan"}.`,
        "success",
      );
    } catch (error) {
      Swal.fire(
        "Gagal menyimpan",
        getBlogErrorMessage(error, "Kategori belum berhasil disimpan."),
        "error",
      );
    }
  };

  const handleDelete = async (category) => {
    const confirmed = await confirmBlogAction({
      title: "Hapus kategori?",
      text:
        category.post_count > 0
          ? `Kategori “${category.name}” digunakan oleh ${category.post_count} post.`
          : `Kategori “${category.name}” akan dihapus permanen.`,
      icon: "warning",
      confirmButtonText: "Ya, hapus",
      confirmButtonColor: "#ef4444",
    });
    if (!confirmed) return;

    showBlogLoading("Menghapus kategori...", "Mohon tunggu sampai proses selesai.");
    try {
      await deleteMutation.mutateAsync(category.category_id);
      Swal.fire("Terhapus", "Kategori berhasil dihapus.", "success");
    } catch (error) {
      Swal.fire(
        "Gagal menghapus",
        getBlogErrorMessage(
          error,
          "Kategori mungkin masih digunakan oleh post atau kategori turunan.",
        ),
        "error",
      );
    }
  };

  const columns = useMemo(
    () => [
      {
        Header: "Kategori",
        accessor: "name",
        minWidth: 190,
        Cell: ({ row }) => (
          <div>
            <div className="font-medium text-slate-700 dark:text-slate-200">
              {row.original.name}
            </div>
            <div className="mt-1 text-xs text-slate-500">
              {row.original.slug}
            </div>
          </div>
        ),
      },
      {
        Header: "Deskripsi",
        accessor: "description",
        minWidth: 220,
        maxWidth: 320,
        Cell: ({ value }) => (
          <span className="line-clamp-2 text-slate-500">{value || "-"}</span>
        ),
      },
      {
        Header: "Post",
        accessor: "post_count",
        minWidth: 90,
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
          const category = row.original;
          return (
            <div className="flex items-center justify-center gap-2">
              <TableAction
                action={{
                  name: "Edit",
                  icon: "heroicons:pencil-square",
                  className:
                    "!border-primary-200 !bg-primary-100 !text-primary-600 hover:!border-primary-300 hover:!bg-primary-200 hover:!text-primary-700 dark:!border-primary-500/30 dark:!bg-primary-500/10 dark:!text-primary-300 dark:hover:!border-primary-500/50 dark:hover:!bg-primary-500/20",
                  onClick: () => openEdit(category),
                }}
                row={category}
              />
              <TableAction
                action={{
                  name: "Delete",
                  icon: "heroicons-outline:trash",
                  disabled: deleteMutation.isPending,
                  className:
                    "!border-danger-200 !bg-danger-100 !text-danger-600 hover:!border-danger-300 hover:!bg-danger-200 hover:!text-danger-700 dark:!border-danger-500/30 dark:!bg-danger-500/10 dark:!text-danger-300 dark:hover:!border-danger-500/50 dark:hover:!bg-danger-500/20",
                  onClick: () => handleDelete(category),
                }}
                row={category}
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
      title="Blog Categories"
      headerslot={
        <Button
          text="Tambah Kategori"
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
          placeholder="Cari nama, slug, atau deskripsi..."
        />
        <Button
          type="submit"
          text="Cari"
          icon="heroicons-outline:magnifying-glass"
          className="btn-dark"
        />
      </form>

      {categoriesQuery.isError && (
        <div className="mb-4 rounded-md border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700">
          {getBlogErrorMessage(
            categoriesQuery.error,
            "Data categories gagal dimuat.",
          )}
        </div>
      )}

      {categories.length ? (
        <Table
          tableId="blog-categories-table"
          listData={{ results: categories }}
          listColumn={columns}
          isPagination={false}
          tableMinWidth={840}
        />
      ) : (
        <div className="border-y border-slate-100 py-14 text-center text-sm text-slate-500 dark:border-slate-700">
          {categoriesQuery.isLoading
            ? "Memuat categories..."
            : "Belum ada kategori."}
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
        title={selectedCategory ? "Edit Kategori" : "Tambah Kategori"}
        className="max-w-xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Textinput
            label="Nama Kategori *"
            value={form.name}
            onChange={(event) => {
              setForm((current) => ({ ...current, name: event.target.value }));
              setNameError("");
            }}
            error={nameError ? { message: nameError } : undefined}
            placeholder="Contoh: Gaya Renang"
          />
          <div>
            <label className="form-label" htmlFor="category-description">
              Deskripsi
            </label>
            <textarea
              id="category-description"
              className="form-control min-h-[110px] py-2"
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              placeholder="Deskripsi singkat kategori"
            />
          </div>
          {selectedCategory?.slug && (
            <Textinput
              label="Slug"
              value={selectedCategory.slug}
              readonly
              disabled
            />
          )}
          <p className="text-xs text-slate-500">
            Slug dibuat otomatis oleh backend berdasarkan nama kategori.
          </p>
          <div className="flex justify-end gap-3">
            <Button text="Batal" className="btn-light" onClick={closeModal} />
            <Button
              text={selectedCategory ? "Simpan Perubahan" : "Tambah Kategori"}
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

export default BlogCategories;
