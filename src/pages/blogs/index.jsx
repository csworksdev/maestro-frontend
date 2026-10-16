import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Swal from "sweetalert2";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import Table from "@/components/globals/table/table";
import TableAction from "@/components/globals/table/tableAction";
import PaginationComponent from "@/components/globals/table/pagination";
import {
  deleteBlogPost,
  getBlogPosts,
  updateBlogPostStatus,
} from "@/axios/blog/blog";
import {
  confirmBlogAction,
  getBlogErrorMessage,
  showBlogLoading,
} from "./blogAlerts";
import {
  formatBlogDate,
  getBlogCollection,
  getBlogPageCount,
} from "./blogUtils";

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "scheduled", label: "Scheduled" },
  { value: "private", label: "Private" },
];

const statusClasses = {
  draft: "bg-slate-100 text-slate-700",
  published: "bg-success-100 text-success-700",
  scheduled: "bg-info-100 text-info-700",
  private: "bg-warning-100 text-warning-700",
};

const Blogs = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const postsQuery = useQuery({
    queryKey: ["blog-posts", pageIndex, pageSize, appliedQuery],
    queryFn: async () =>
      (
        await getBlogPosts({
          page: pageIndex + 1,
          page_size: pageSize,
          search: appliedQuery || undefined,
          ordering: "-updated_at",
        })
      ).data,
  });

  const posts = getBlogCollection(postsQuery.data);
  const pageCount = getBlogPageCount(postsQuery.data, pageSize);

  const deleteMutation = useMutation({
    mutationFn: deleteBlogPost,
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ["blog-post"] });
      return queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
    },
  });
  const statusMutation = useMutation({
    mutationFn: ({ postId, payload }) =>
      updateBlogPostStatus(postId, payload),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ["blog-post"] });
      return queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
    },
  });

  const handleDelete = async (post) => {
    const confirmed = await confirmBlogAction({
      title: "Hapus blog?",
      text: `Blog “${post.title}” akan dihapus permanen.`,
      icon: "warning",
      confirmButtonText: "Ya, hapus",
      confirmButtonColor: "#ef4444",
    });

    if (!confirmed) return;
    showBlogLoading("Menghapus blog...", "Mohon tunggu sampai proses selesai.");
    try {
      await deleteMutation.mutateAsync(post.post_id);
      Swal.fire("Terhapus", "Blog berhasil dihapus.", "success");
    } catch (error) {
      Swal.fire(
        "Gagal menghapus",
        getBlogErrorMessage(error, "Blog belum berhasil dihapus."),
        "error",
      );
    }
  };

  const handleStatusChange = async (post, status) => {
    if (status === post.status) return;
    try {
      let payload = { status };
      if (status === "scheduled") {
        const schedule = await Swal.fire({
          title: "Jadwalkan publikasi",
          input: "datetime-local",
          inputLabel: "Tanggal dan waktu publikasi",
          showCancelButton: true,
          confirmButtonText: "Simpan jadwal",
          cancelButtonText: "Batal",
          inputValidator: (value) =>
            value ? undefined : "Tanggal publikasi wajib diisi.",
        });
        if (!schedule.isConfirmed) return;
        payload = {
          status,
          published_at: new Date(schedule.value).toISOString(),
        };
      } else {
        const statusLabel =
          STATUS_OPTIONS.find((option) => option.value === status)?.label ||
          status;
        const confirmed = await confirmBlogAction({
          title: "Ubah status blog?",
          text: `Status “${post.title}” akan diubah menjadi ${statusLabel}.`,
          confirmButtonText: "Ya, ubah status",
        });
        if (!confirmed) return;
      }
      showBlogLoading(
        "Memperbarui status...",
        "Mohon tunggu sampai proses selesai.",
      );
      await statusMutation.mutateAsync({ postId: post.post_id, payload });
      Swal.fire("Berhasil", "Status blog berhasil diperbarui.", "success");
    } catch (error) {
      Swal.fire(
        "Gagal memperbarui status",
        getBlogErrorMessage(
          error,
          "Status blog belum berhasil diperbarui.",
        ),
        "error",
      );
    }
  };

  const columns = useMemo(
    () => [
      {
        Header: "Judul",
        accessor: "title",
        minWidth: 280,
        maxWidth: 440,
        Cell: ({ row }) => {
          const post = row.original;
          return (
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium text-slate-700 dark:text-slate-200">
                  {post.title}
                </p>
                {post.is_sticky && (
                  <Icon
                    icon="heroicons-solid:star"
                    className="shrink-0 text-warning-500"
                  />
                )}
              </div>
              <p className="mt-1 truncate text-xs text-slate-500">
                /{post.slug}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {post.author_name || "-"}
              </p>
            </div>
          );
        },
      },
      {
        Header: "Kategori",
        accessor: "categories_detail",
        minWidth: 190,
        Cell: ({ value }) =>
          (value || []).map((category) => category.name).join(", ") || "-",
      },
      {
        Header: "Status",
        accessor: "status",
        minWidth: 170,
        Cell: ({ row }) => {
          const post = row.original;
          return (
            <div className="flex flex-col items-center gap-2">
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  statusClasses[post.status] || statusClasses.draft
                }`}
              >
                {post.status_display || post.status}
              </span>
              <select
                aria-label={`Ubah status ${post.title}`}
                className="form-control min-w-[130px] py-1 text-xs"
                value={post.status}
                disabled={statusMutation.isPending}
                onChange={(event) =>
                  handleStatusChange(post, event.target.value)
                }
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          );
        },
      },
      {
        Header: "Publikasi",
        accessor: "published_at",
        minWidth: 170,
        Cell: ({ row }) => (
          <span className="whitespace-nowrap">
            {formatBlogDate(
              row.original.published_at || row.original.updated_at,
            )}
          </span>
        ),
      },
      {
        Header: "Aksi",
        accessor: "action",
        id: "action",
        sticky: "right",
        disableSortBy: true,
        Cell: ({ row }) => {
          const post = row.original;
          return (
            <div className="flex items-center justify-center gap-2">
              <TableAction
                action={{
                  name: "Edit",
                  icon: "heroicons:pencil-square",
                  className:
                    "!border-primary-200 !bg-primary-100 !text-primary-600 hover:!border-primary-300 hover:!bg-primary-200 hover:!text-primary-700 dark:!border-primary-500/30 dark:!bg-primary-500/10 dark:!text-primary-300 dark:hover:!border-primary-500/50 dark:hover:!bg-primary-500/20",
                  onClick: () => navigate(`${post.post_id}/edit`),
                }}
                row={post}
              />
              <TableAction
                action={{
                  name: "Delete",
                  icon: "heroicons-outline:trash",
                  disabled: deleteMutation.isPending,
                  className:
                    "!border-danger-200 !bg-danger-100 !text-danger-600 hover:!border-danger-300 hover:!bg-danger-200 hover:!text-danger-700 dark:!border-danger-500/30 dark:!bg-danger-500/10 dark:!text-danger-300 dark:hover:!border-danger-500/50 dark:hover:!bg-danger-500/20",
                  onClick: () => handleDelete(post),
                }}
                row={post}
              />
            </div>
          );
        },
      },
    ],
    [deleteMutation.isPending, navigate, statusMutation.isPending],
  );

  return (
    <Card
      title="Blogs"
      headerslot={
        <Button
          link="add"
          text="Tambah Blog"
          icon="heroicons-outline:plus"
          className="btn-primary"
        />
      }
    >
      <div className="mb-4 flex flex-wrap gap-2">
        <Button link="media" text="Media" icon="heroicons-outline:photo" className="btn-light btn-sm" />
        <Button link="categories" text="Kategori" icon="heroicons-outline:folder" className="btn-light btn-sm" />
        <Button link="tags" text="Tag" icon="heroicons-outline:tag" className="btn-light btn-sm" />
      </div>
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Kelola artikel yang akan ditampilkan pada website Maestro.
        </p>
        <form
          className="flex w-full flex-col gap-2 sm:flex-row lg:max-w-md"
          onSubmit={(event) => {
            event.preventDefault();
            setPageIndex(0);
            setAppliedQuery(query.trim());
          }}
        >
          <label className="sr-only" htmlFor="blog-search">Cari blog</label>
          <input
            id="blog-search"
            className="form-control min-w-0 py-2"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari judul, slug, penulis..."
          />
          <Button type="submit" text="Cari" icon="heroicons-outline:magnifying-glass" className="btn-dark" />
        </form>
      </div>

      {postsQuery.isError && (
        <div className="mb-4 rounded-md border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700">
          {getBlogErrorMessage(postsQuery.error, "Data blog gagal dimuat.")}
        </div>
      )}

      {posts.length ? (
        <Table
          tableId="blog-posts-table"
          listData={{ results: posts }}
          listColumn={columns}
          isPagination={false}
          tableMinWidth={840}
        />
      ) : (
        <div className="border-y border-slate-100 py-14 text-center text-sm text-slate-500 dark:border-slate-700">
          {postsQuery.isLoading
            ? "Memuat data blog..."
            : appliedQuery
              ? `Tidak ada blog untuk pencarian “${appliedQuery}”.`
              : "Belum ada blog yang dapat ditampilkan."}
        </div>
      )}
      <PaginationComponent
        pageSize={pageSize}
        pageIndex={pageIndex}
        pageCount={pageCount}
        canPreviousPage={pageIndex > 0}
        canNextPage={pageIndex + 1 < pageCount}
        gotoPage={setPageIndex}
        previousPage={() => setPageIndex((page) => Math.max(0, page - 1))}
        nextPage={() => setPageIndex((page) => Math.min(Math.max(0, pageCount - 1), page + 1))}
        setPageSize={(size) => {
          setPageSize(size);
          setPageIndex(0);
        }}
      />
    </Card>
  );
};

export default Blogs;
