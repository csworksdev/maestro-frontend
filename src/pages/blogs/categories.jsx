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

const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "-";

const BlogCategories = () => {
  const queryClient = useQueryClient();
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [parentFilter, setParentFilter] = useState("");
  const [onlyRoot, setOnlyRoot] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [form, setForm] = useState({ name: "", description: "", parent: "" });
  const [nameError, setNameError] = useState("");

  const categoriesQuery = useQuery({
    queryKey: [
      "blog-categories-admin",
      pageIndex,
      pageSize,
      appliedSearch,
      parentFilter,
      onlyRoot,
    ],
    queryFn: async () =>
      (
        await getBlogCategories({
          page: pageIndex + 1,
          page_size: pageSize,
          search: appliedSearch || undefined,
          ordering: "-created_at",
          filter_parent_id: parentFilter || undefined,
          only_root: onlyRoot || undefined,
        })
      ).data,
  });

  const optionsQuery = useQuery({
    queryKey: ["blog-category-options"],
    queryFn: async () =>
      (await getBlogCategories({ page_size: 100, ordering: "name" })).data,
  });

  const categories = categoriesQuery.data?.results || [];
  const categoryOptions = optionsQuery.data?.results || [];
  const pageCount = Math.ceil((categoriesQuery.data?.count || 0) / pageSize);

  const invalidateCategories = () => {
    queryClient.invalidateQueries({ queryKey: ["blog-categories-admin"] });
    queryClient.invalidateQueries({ queryKey: ["blog-category-options"] });
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
    setForm({ name: "", description: "", parent: "" });
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
      parent: category.parent || "",
    });
    setNameError("");
    setModalOpen(true);
    try {
      const { data } = await getBlogCategory(category.category_id);
      setSelectedCategory(data);
      setForm({
        name: data.name || "",
        description: data.description || "",
        parent: data.parent || "",
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
          parent: form.parent || null,
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

  const changeFilter = (callback) => {
    callback();
    setPageIndex(0);
  };

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
        className="mb-5 grid gap-3 lg:grid-cols-[minmax(240px,1fr)_minmax(210px,280px)_170px_auto]"
        onSubmit={(event) => {
          event.preventDefault();
          setPageIndex(0);
          setAppliedSearch(search.trim());
        }}
      >
        <input
          className="form-control py-2"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Cari nama, slug, atau deskripsi..."
        />
        <select
          className="form-control py-2"
          value={parentFilter}
          onChange={(event) =>
            changeFilter(() => {
              setParentFilter(event.target.value);
              if (event.target.value) setOnlyRoot(false);
            })
          }
          disabled={onlyRoot}
        >
          <option value="">Semua parent</option>
          {categoryOptions.map((category) => (
            <option key={category.category_id} value={category.category_id}>
              {category.name}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 rounded border border-slate-200 px-3 text-sm dark:border-slate-700">
          <input
            type="checkbox"
            checked={onlyRoot}
            onChange={(event) =>
              changeFilter(() => {
                setOnlyRoot(event.target.checked);
                if (event.target.checked) setParentFilter("");
              })
            }
          />
          Hanya root
        </label>
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

      <div className="overflow-x-auto rounded-md border border-slate-200 dark:border-slate-700">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
          <thead className="bg-slate-50 dark:bg-slate-700">
            <tr className="text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-300">
              <th className="px-5 py-3">Kategori</th>
              <th className="px-5 py-3">Parent</th>
              <th className="px-5 py-3">Deskripsi</th>
              <th className="px-5 py-3">Post</th>
              <th className="px-5 py-3">Dibuat Oleh</th>
              <th className="px-5 py-3">Terakhir Diubah</th>
              <th className="px-5 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {categories.map((category) => (
              <tr key={category.category_id} className="text-sm text-slate-700 dark:text-slate-200">
                <td className="px-5 py-4">
                  <div className="font-medium">{category.name}</div>
                  <div className="mt-1 text-xs text-slate-500">{category.slug}</div>
                </td>
                <td className="px-5 py-4">{category.parent_name || "Root"}</td>
                <td className="max-w-xs px-5 py-4 text-slate-500">
                  <span className="line-clamp-2">{category.description || "-"}</span>
                </td>
                <td className="px-5 py-4">
                  <span className="rounded-full bg-primary-100 px-2.5 py-1 text-xs font-medium text-primary-700">
                    {category.post_count || 0}
                  </span>
                </td>
                <td className="px-5 py-4">{category.created_by_name || "-"}</td>
                <td className="whitespace-nowrap px-5 py-4">{formatDate(category.updated_at)}</td>
                <td className="px-5 py-4">
                  <div className="flex justify-end gap-2">
                    <button
                      className="action-btn bg-primary-500 bg-opacity-30 text-primary-500 hover:bg-opacity-100 hover:text-white"
                      onClick={() => openEdit(category)}
                      title="Edit"
                    >
                      <Icon icon="heroicons:pencil-square" />
                    </button>
                    <button
                      className="action-btn bg-danger-500 bg-opacity-30 text-danger-500 hover:bg-opacity-100 hover:text-white"
                      onClick={() => handleDelete(category)}
                      disabled={deleteMutation.isPending}
                      title="Hapus"
                    >
                      <Icon icon="heroicons-outline:trash" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!categories.length && (
              <tr>
                <td colSpan="7" className="px-5 py-14 text-center text-slate-500">
                  {categoriesQuery.isLoading
                    ? "Memuat categories..."
                    : "Belum ada kategori."}
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
          <div>
            <label className="form-label" htmlFor="category-parent">
              Parent Category
            </label>
            <select
              id="category-parent"
              className="form-control py-2"
              value={form.parent}
              onChange={(event) =>
                setForm((current) => ({ ...current, parent: event.target.value }))
              }
            >
              <option value="">Tanpa parent (root)</option>
              {categoryOptions
                .filter(
                  (category) =>
                    category.category_id !== selectedCategory?.category_id,
                )
                .map((category) => (
                  <option key={category.category_id} value={category.category_id}>
                    {category.name}
                  </option>
                ))}
            </select>
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
            Slug dibuat otomatis oleh backend. Parent dikirim sebagai ID kategori
            atau null untuk kategori root.
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
