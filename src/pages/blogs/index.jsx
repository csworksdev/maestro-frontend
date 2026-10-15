import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Swal from "sweetalert2";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
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

const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "-";

const Blogs = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const postsQuery = useQuery({
    queryKey: ["blog-posts"],
    queryFn: async () => (await getBlogPosts()).data,
  });

  const posts = postsQuery.data?.results || [];
  const filteredPosts = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return posts;
    return posts.filter((post) =>
      [
        post.title,
        post.author_name,
        post.slug,
        ...(post.categories_detail || []).map((category) => category.name),
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword)),
    );
  }, [posts, query]);

  const deleteMutation = useMutation({
    mutationFn: deleteBlogPost,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["blog-posts"] }),
  });
  const statusMutation = useMutation({
    mutationFn: ({ postId, payload }) =>
      updateBlogPostStatus(postId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["blog-posts"] }),
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

  return (
    <Card
      title="Blogs"
      headerslot={
        <Button className="btn-primary">
          <Link to="add" className="flex items-center gap-2">
            <Icon icon="heroicons-outline:plus" /> Tambah Blog
          </Link>
        </Button>
      }
    >
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Kelola posts yang akan ditampilkan pada website Maestro.
        </p>
        <input
          className="form-control py-2 md:max-w-xs"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Cari blog..."
        />
      </div>

      {postsQuery.isError && (
        <div className="mb-4 rounded-md border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700">
          {getBlogErrorMessage(postsQuery.error, "Data blog gagal dimuat.")}
        </div>
      )}

      <div className="overflow-x-auto rounded-md border border-slate-200 dark:border-slate-700">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
          <thead className="bg-slate-50 dark:bg-slate-700">
            <tr className="text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-300">
              <th className="px-5 py-3">Judul</th>
              <th className="px-5 py-3">Kategori</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Publikasi</th>
              <th className="px-5 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {filteredPosts.map((post) => (
              <tr key={post.post_id} className="text-sm text-slate-700 dark:text-slate-200">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{post.title}</p>
                    {post.is_sticky && <Icon icon="heroicons-solid:star" className="text-warning-500" />}
                  </div>
                  <p className="mt-1 max-w-md truncate text-xs text-slate-500">/{post.slug}</p>
                  <p className="mt-1 text-xs text-slate-400">{post.author_name || "-"}</p>
                </td>
                <td className="px-5 py-4">
                  {(post.categories_detail || []).map((category) => category.name).join(", ") || "-"}
                </td>
                <td className="px-5 py-4">
                  <div className="flex flex-col items-start gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClasses[post.status] || statusClasses.draft}`}>
                      {post.status_display || post.status}
                    </span>
                    <select
                      className="form-control min-w-[130px] py-1 text-xs"
                      value={post.status}
                      disabled={statusMutation.isPending}
                      onChange={(event) => handleStatusChange(post, event.target.value)}
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status.value} value={status.value}>{status.label}</option>
                      ))}
                    </select>
                  </div>
                </td>
                <td className="whitespace-nowrap px-5 py-4">
                  {formatDate(post.published_at || post.updated_at)}
                </td>
                <td className="px-5 py-4">
                  <div className="flex justify-end gap-2">
                    <button
                      className="action-btn bg-primary-500 bg-opacity-30 text-primary-500 hover:bg-opacity-100 hover:text-white"
                      onClick={() => navigate(`${post.post_id}/edit`)}
                      title="Edit"
                    >
                      <Icon icon="heroicons:pencil-square" />
                    </button>
                    <button
                      className="action-btn bg-danger-500 bg-opacity-30 text-danger-500 hover:bg-opacity-100 hover:text-white"
                      onClick={() => handleDelete(post)}
                      disabled={deleteMutation.isPending}
                      title="Hapus"
                    >
                      <Icon icon="heroicons-outline:trash" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!filteredPosts.length && (
              <tr>
                <td colSpan="5" className="px-5 py-14 text-center text-slate-500">
                  {postsQuery.isLoading ? "Memuat data blog..." : "Belum ada blog yang dapat ditampilkan."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default Blogs;
