import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import ReactSelect from "react-select";
import Swal from "sweetalert2";
import Card from "@/components/ui/Card";
import Textinput from "@/components/ui/Textinput";
import Button from "@/components/ui/Button";
import BlogEditor from "./BlogEditor";
import { normalizeBlogContent, serializeBlogContent } from "./blogContent";
import {
  addBlogPost,
  editBlogPost,
  getBlogCategories,
  getBlogPost,
  getBlogTags,
} from "@/axios/blog/blog";
import { getBlogMedia } from "@/axios/blog/media";
import {
  confirmBlogAction,
  getBlogErrorMessage,
  showBlogLoading,
} from "./blogAlerts";

const EMPTY_CONTENT = { time: Date.now(), blocks: [], version: "2.31.7" };
const BLOG_DRAFT_PREFIX = "maestro:blog-form-draft:";
const BLOG_DRAFT_VERSION = 2;
const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "scheduled", label: "Scheduled" },
  { value: "private", label: "Private" },
];

const FeaturedImageOption = ({ label, media }) => (
  <div className="flex min-w-0 items-center gap-3">
    <div className="h-10 w-14 flex-none overflow-hidden rounded border border-slate-200 bg-slate-100 dark:border-slate-600 dark:bg-slate-700">
      {media?.url ? (
        <img
          src={media.url}
          alt={media.alt_text || label || "Featured image"}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <span className="flex h-full items-center justify-center text-[10px] text-slate-400">
          No image
        </span>
      )}
    </div>
    <div className="min-w-0">
      <span className="block truncate text-sm">{label}</span>
      {media?.alt_text && (
        <span className="block truncate text-xs text-slate-500">
          {media.alt_text}
        </span>
      )}
    </div>
  </div>
);

const getCollection = (data) => data?.results || data || [];
const formatErrorValue = (value, path = "") => {
  if (value == null) return [];
  if (typeof value === "string" || typeof value === "number") {
    return [`${path ? `${path}: ` : ""}${value}`];
  }
  if (Array.isArray(value)) {
    return value.flatMap((item) => formatErrorValue(item, path));
  }
  if (typeof value === "object") {
    return Object.entries(value).flatMap(([key, nestedValue]) => {
      if (key === "status" && nestedValue === "error") return [];
      const nextPath = key === "message" ? path : path ? `${path}.${key}` : key;
      return formatErrorValue(nestedValue, nextPath);
    });
  }
  return [];
};

const getErrorMessage = (error, fallback) =>
  getBlogErrorMessage(error, fallback);

const getValidationPayload = (error) => {
  const data = error?.response?.data;
  if (!data || typeof data !== "object") return {};
  return data.message && typeof data.message === "object" ? data.message : data;
};

const firstValidationMessage = (value) => {
  const messages = formatErrorValue(value);
  return messages[0]?.replace(/^[^:]+:\s*/, "") || "";
};

const toDateTimeLocal = (value) => {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60 * 1000)
    .toISOString()
    .slice(0, 16);
};

const readBlogDraft = (key, scope) => {
  try {
    const draft = JSON.parse(sessionStorage.getItem(key));
    if (
      !draft ||
      typeof draft !== "object" ||
      draft.version !== BLOG_DRAFT_VERSION ||
      draft.scope !== scope
    ) {
      sessionStorage.removeItem(key);
      return null;
    }
    return draft;
  } catch {
    return null;
  }
};

const writeBlogDraft = (key, scope, draft) => {
  try {
    sessionStorage.setItem(
      key,
      JSON.stringify({
        ...draft,
        version: BLOG_DRAFT_VERSION,
        scope,
        savedAt: new Date().toISOString(),
      }),
    );
  } catch {
    // The form remains usable when browser storage is disabled or full.
  }
};

const getSelectionIds = (values, idField) =>
  (Array.isArray(values) ? values : [])
    .map((value) =>
      value && typeof value === "object" ? value[idField] ?? value.value : value,
    )
    .filter((value) => value !== undefined && value !== null && value !== "");

const createInitialForm = (post, draftForm) => {
  const serverForm = {
    title: post?.title || "",
    status: post?.status || "draft",
    published_at: toDateTimeLocal(post?.published_at),
    categories: getSelectionIds(
      post?.categories || post?.categories_detail,
      "category_id",
    ),
    tags: getSelectionIds(post?.tags || post?.tags_detail, "tag_id"),
    featured_image:
      post?.featured_image?.media_id || post?.featured_image_id || post?.featured_image || "",
    allow_comments: post?.allow_comments ?? true,
    is_sticky: post?.is_sticky ?? false,
    seo_title: post?.seo_title || "",
    seo_description: post?.seo_description || "",
  };

  if (!draftForm || typeof draftForm !== "object") return serverForm;
  const status = STATUS_OPTIONS.some(({ value }) => value === draftForm.status)
    ? draftForm.status
    : serverForm.status;

  return {
    ...serverForm,
    title: typeof draftForm.title === "string" ? draftForm.title : serverForm.title,
    status,
    published_at:
      typeof draftForm.published_at === "string"
        ? draftForm.published_at
        : serverForm.published_at,
    categories: getSelectionIds(draftForm.categories, "category_id"),
    tags: getSelectionIds(draftForm.tags, "tag_id"),
    featured_image:
      typeof draftForm.featured_image === "string"
        ? draftForm.featured_image
        : serverForm.featured_image,
    allow_comments:
      typeof draftForm.allow_comments === "boolean"
        ? draftForm.allow_comments
        : serverForm.allow_comments,
    is_sticky:
      typeof draftForm.is_sticky === "boolean"
        ? draftForm.is_sticky
        : serverForm.is_sticky,
    seo_title:
      typeof draftForm.seo_title === "string"
        ? draftForm.seo_title
        : serverForm.seo_title,
    seo_description:
      typeof draftForm.seo_description === "string"
        ? draftForm.seo_description
        : serverForm.seo_description,
  };
};

const BlogFormContent = ({ post = null }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const editorRef = useRef(null);
  const publishedAtRef = useRef(null);
  const publishedAtFieldRef = useRef(null);
  const draftKey = `${BLOG_DRAFT_PREFIX}${post?.post_id || "new"}`;
  const draftScope = post
    ? `${post.post_id}:${post.updated_at || post.modified_at || "unknown"}`
    : "new";
  const initialDraftRef = useRef(readBlogDraft(draftKey, draftScope));
  const formRef = useRef(null);
  const discardDraftRef = useRef(false);
  const editorRevisionRef = useRef(0);
  const [editorReady, setEditorReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState(() =>
    createInitialForm(post, initialDraftRef.current?.form),
  );
  formRef.current = form;
  const initialContentRef = useRef(
    normalizeBlogContent(
      initialDraftRef.current?.content || post?.content || EMPTY_CONTENT,
    ),
  );

  useEffect(() => {
    const currentDraft = readBlogDraft(draftKey, draftScope) || {};
    writeBlogDraft(draftKey, draftScope, { ...currentDraft, form });
  }, [draftKey, draftScope, form]);

  const categoriesQuery = useQuery({
    queryKey: ["blog-categories"],
    queryFn: async () => (await getBlogCategories({ page_size: 100 })).data,
  });
  const tagsQuery = useQuery({
    queryKey: ["blog-tags"],
    queryFn: async () => (await getBlogTags({ page_size: 100 })).data,
  });
  const mediaQuery = useQuery({
    queryKey: ["blog-media-options"],
    queryFn: async () =>
      (
        await getBlogMedia({
          page_size: 100,
          ordering: "-created_at",
        })
      ).data,
  });
  const categoryOptions = useMemo(
    () =>
      getCollection(categoriesQuery.data).map((category) => ({
        value: category.category_id,
        label: category.name,
      })),
    [categoriesQuery.data],
  );
  const tagOptions = useMemo(
    () =>
      getCollection(tagsQuery.data).map((tag) => ({
        value: tag.tag_id,
        label: tag.name,
      })),
    [tagsQuery.data],
  );
  const mediaOptions = useMemo(
    () =>
      getCollection(mediaQuery.data).map((media) => ({
        value: media.media_id,
        label: media.original_name,
        media,
      })),
    [mediaQuery.data],
  );
  const selectedMedia = useMemo(
    () =>
      mediaOptions.find(
        (option) => String(option.value) === String(form.featured_image),
      )
        ?.media || null,
    [form.featured_image, mediaOptions],
  );
  const initialContent = initialContentRef.current;
  const handleEditorReady = useCallback(() => setEditorReady(true), []);
  const handleEditorChange = useCallback(
    (content, revision) => {
      if (
        discardDraftRef.current ||
        revision <= editorRevisionRef.current
      ) return;
      editorRevisionRef.current = revision;
      const currentDraft = readBlogDraft(draftKey, draftScope) || {};
      writeBlogDraft(draftKey, draftScope, {
        ...currentDraft,
        form: formRef.current,
        content: normalizeBlogContent(content),
      });
    },
    [draftKey, draftScope],
  );

  const clearDraft = useCallback(() => {
    discardDraftRef.current = true;
    try {
      sessionStorage.removeItem(draftKey);
    } catch {
      // Ignore unavailable browser storage.
    }
  }, [draftKey]);

  const updateField = (field, maxLength) => (event) => {
    const value = maxLength
      ? event.target.value.slice(0, maxLength)
      : event.target.value;
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  };

  const revealPublishedAtField = () => {
    // Tunggu pesan validasi selesai dirender agar posisi yang dihitung akurat.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const field = publishedAtFieldRef.current;
        const input = publishedAtRef.current;
        if (!field || !input) return;

        // Fokus lebih dahulu lalu lakukan scroll manual. Ini lebih stabil di Safari
        // daripada scrollIntoView(), terutama pada layout dua kolom yang tinggi.
        try {
          input.focus({ preventScroll: true });
        } catch {
          input.focus();
        }

        const header = document.querySelector("header");
        const headerBottom = header
          ? Math.max(0, header.getBoundingClientRect().bottom)
          : 0;
        const fieldTop = window.scrollY + field.getBoundingClientRect().top;
        const top = Math.max(0, fieldTop - headerBottom - 24);

        window.scrollTo({ top, behavior: "smooth" });
      });
    });
  };

  const handleSave = async (event) => {
    event.preventDefault();
    const scheduledDate = form.published_at
      ? new Date(form.published_at)
      : null;
    const nextErrors = {
      title: form.title.trim() ? "" : "Judul blog wajib diisi.",
      published_at:
        form.status === "scheduled" && !form.published_at
          ? "Jadwal publikasi wajib diisi untuk status Scheduled."
          : form.status === "scheduled" &&
              (!scheduledDate ||
                Number.isNaN(scheduledDate.getTime()) ||
                scheduledDate.getTime() <= Date.now())
            ? "Jadwal publikasi harus berada di masa mendatang. Ubah jadwal atau pilih status Published."
          : "",
    };
    setErrors(nextErrors);
    if (nextErrors.published_at) {
      revealPublishedAtField();
    }
    if (nextErrors.title || nextErrors.published_at || !editorRef.current) {
      return;
    }

    try {
      const content = serializeBlogContent(await editorRef.current.save());
      const payload = {
        title: form.title.trim(),
        status: form.status,
        categories: form.categories,
        tags: form.tags,
        featured_image: form.featured_image || null,
        allow_comments: form.allow_comments,
        is_sticky: form.is_sticky,
        seo_title: form.seo_title.trim(),
        seo_description: form.seo_description.trim(),
        content,
        ...(form.status === "scheduled"
          ? { published_at: new Date(form.published_at).toISOString() }
          : {}),
      };

      const confirmed = await confirmBlogAction({
        title: post ? "Simpan perubahan blog?" : "Tambah blog baru?",
        text: post
          ? `Perubahan pada “${form.title.trim()}” akan disimpan.`
          : `Blog “${form.title.trim()}” akan ditambahkan dengan status ${form.status}.`,
        confirmButtonText: post ? "Ya, simpan perubahan" : "Ya, tambah blog",
      });
      if (!confirmed) return;

      setSaving(true);
      showBlogLoading(
        post ? "Menyimpan perubahan..." : "Menambahkan blog...",
        "Mohon tunggu. Jangan tutup halaman sampai proses selesai.",
      );

      const saveResponse = post
        ? await editBlogPost(post.post_id, payload)
        : await addBlogPost(payload);

      clearDraft();
      // Detail blog memiliki cache terpisah dari daftar blog. Perbarui cache
      // aktif langsung dari respons PUT supaya data lama tidak sempat dirender,
      // lalu tandai seluruh detail stale sebagai pengaman untuk kunjungan lain.
      if (post && saveResponse?.data && typeof saveResponse.data === "object") {
        queryClient.setQueryData(
          ["blog-post", String(post.post_id)],
          saveResponse.data,
        );
      }
      await queryClient.invalidateQueries({
        queryKey: ["blog-post"],
        refetchType: "none",
      });
      await queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      await Swal.fire(
        "Berhasil",
        `Blog berhasil ${post ? "diperbarui" : "ditambahkan"}.`,
        "success",
      );
      navigate("/blogs");
      queryClient.removeQueries({ queryKey: ["blog-post"] });
    } catch (error) {
      const validation = getValidationPayload(error);
      setErrors((current) => ({
        ...current,
        title: firstValidationMessage(validation.title) || current.title,
        published_at:
          firstValidationMessage(validation.published_at) ||
          current.published_at,
      }));
      Swal.fire(
        "Gagal menyimpan",
        getErrorMessage(error, "Blog belum berhasil disimpan."),
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card
      title={
        post ? (
          <>
            <span>Edit Blog</span>
            <span className="font-normal text-slate-500 dark:text-slate-400">
              {` - ${post.title}`}
            </span>
          </>
        ) : (
          "Tambah Blog"
        )
      }
    >
      <form onSubmit={handleSave} className="space-y-5">
        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
          <section className="min-w-0">
            <div className="mb-3">
              <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">Isi Blog</h3>
            </div>
            <BlogEditor
              initialData={initialContent}
              editorRef={editorRef}
              onReady={handleEditorReady}
              onChange={handleEditorChange}
            />
          </section>

          <aside className="min-w-0 rounded-md border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
            <h3 className="mb-4 text-base font-semibold text-slate-800 dark:text-slate-100">Informasi Blog</h3>
            <div className="grid grid-cols-1 gap-4">
              <Textinput
                label="Judul Blog *"
                value={form.title}
                onChange={updateField("title")}
                error={errors.title ? { message: errors.title } : undefined}
                placeholder="Contoh: Tips Belajar Renang untuk Pemula"
              />
              {post && (
                <Textinput label="Slug" value={post.slug || ""} readonly disabled />
              )}
              {post && (
                <Textinput label="Penulis" value={post.author_name || ""} readonly disabled />
              )}
              <div>
                <label className="form-label" htmlFor="blog-status">Status *</label>
                <select
                  id="blog-status"
                  className="form-control py-2"
                  value={form.status}
                  onChange={updateField("status")}
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
              </div>
              {form.status === "scheduled" && (
                <div
                  ref={publishedAtFieldRef}
                  className={`scroll-mt-28 rounded-md transition-all duration-300 ${
                    errors.published_at
                      ? "has-error bg-danger-50 p-3 ring-2 ring-danger-400 dark:bg-danger-500/10"
                      : ""
                  }`}
                >
                  <label className="form-label" htmlFor="blog-published-at">Jadwal Publikasi *</label>
                  <input
                    ref={publishedAtRef}
                    id="blog-published-at"
                    type="datetime-local"
                    className="form-control py-2"
                    value={form.published_at}
                    onChange={updateField("published_at")}
                  />
                  {errors.published_at && <p className="mt-1 text-sm text-danger-500">{errors.published_at}</p>}
                </div>
              )}
              <div>
                <label className="form-label" htmlFor="blog-categories">Kategori</label>
                <ReactSelect
                  inputId="blog-categories"
                  classNamePrefix="blog-select"
                  isMulti
                  isLoading={categoriesQuery.isLoading}
                  options={categoryOptions}
                  value={categoryOptions.filter((option) =>
                    form.categories.some(
                      (value) => String(value) === String(option.value),
                    ),
                  )}
                  onChange={(selected) => setForm((current) => ({ ...current, categories: selected.map((option) => option.value) }))}
                  placeholder="Pilih kategori..."
                  noOptionsMessage={() => "Kategori tidak tersedia"}
                />
              </div>
              <div>
                <label className="form-label" htmlFor="blog-tags">Tags</label>
                <ReactSelect
                  inputId="blog-tags"
                  classNamePrefix="blog-select"
                  isMulti
                  isLoading={tagsQuery.isLoading}
                  options={tagOptions}
                  value={tagOptions.filter((option) =>
                    form.tags.some(
                      (value) => String(value) === String(option.value),
                    ),
                  )}
                  onChange={(selected) => setForm((current) => ({ ...current, tags: selected.map((option) => option.value) }))}
                  placeholder="Pilih tags..."
                  noOptionsMessage={() => "Tag tidak tersedia"}
                />
              </div>
              <div>
                <label className="form-label" htmlFor="blog-featured-image">Featured Image</label>
                <ReactSelect
                  inputId="blog-featured-image"
                  classNamePrefix="blog-select"
                  isClearable
                  isLoading={mediaQuery.isLoading}
                  options={mediaOptions}
                  formatOptionLabel={(option) => (
                    <FeaturedImageOption {...option} />
                  )}
                  value={
                    mediaOptions.find(
                      (option) =>
                        String(option.value) === String(form.featured_image),
                    ) || null
                  }
                  onChange={(selected) =>
                    setForm((current) => ({
                      ...current,
                      featured_image: selected?.value || "",
                    }))
                  }
                  placeholder="Pilih dari media library..."
                  noOptionsMessage={() => "Media tidak tersedia"}
                />
              </div>
              {(selectedMedia?.url || post?.featured_image_url) && (
                <img
                  key={selectedMedia?.url || post.featured_image_url}
                  src={selectedMedia?.url || post.featured_image_url}
                  alt={selectedMedia?.alt_text || post?.title || "Featured blog"}
                  className="h-36 w-full rounded-md border border-slate-200 object-cover dark:border-slate-700"
                  loading="lazy"
                  onError={(event) => {
                    event.currentTarget.hidden = true;
                  }}
                />
              )}
              <Textinput
                label="SEO Title"
                value={form.seo_title}
                onChange={updateField("seo_title", 60)}
                placeholder="Judul untuk mesin pencari"
                maxLength={60}
              />
              <p className="-mt-3 text-right text-xs text-slate-500">
                {form.seo_title.length}/60
              </p>
              <div>
                <label className="form-label" htmlFor="blog-seo-description">SEO Description</label>
                <textarea
                  id="blog-seo-description"
                  className="form-control py-2"
                  rows="3"
                  value={form.seo_description}
                  onChange={updateField("seo_description", 160)}
                  placeholder="Deskripsi singkat untuk mesin pencari"
                  maxLength={160}
                />
                <p className="mt-1 text-right text-xs text-slate-500">
                  {form.seo_description.length}/160
                </p>
              </div>
              <ToggleField
                label="Sticky post"
                description="Tampilkan sebagai artikel unggulan."
                checked={form.is_sticky}
                onChange={(checked) => setForm((current) => ({ ...current, is_sticky: checked }))}
              />
            </div>
          </aside>
        </div>
        <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-end">
          <div className="text-xs text-slate-500 dark:text-slate-400 sm:mr-auto">
            Perubahan disimpan otomatis selama sesi ini.
          </div>
          <div className="grid grid-cols-1 gap-2 xs:grid-cols-2 sm:flex">
            <Button
              text="Batal"
              className="btn-light w-full"
              onClick={() => {
                clearDraft();
                navigate("/blogs");
              }}
            />
            <Button
              text={post ? "Simpan Perubahan" : "Tambah Blog"}
              type="submit"
              className="btn-dark w-full"
              isLoading={saving}
              disabled={!editorReady}
            />
          </div>
        </div>
      </form>
    </Card>
  );
};

const ToggleField = ({ label, description, checked, onChange }) => (
  <label className="flex cursor-pointer items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-3 dark:border-slate-700 dark:bg-slate-800">
    <span>
      <span className="block text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span>
      <span className="block text-xs text-slate-500">{description}</span>
    </span>
    <input
      type="checkbox"
      className="h-4 w-4 rounded border-slate-300 text-primary-500"
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
    />
  </label>
);

const BlogForm = () => {
  const navigate = useNavigate();
  const { blogId } = useParams();
  const postQuery = useQuery({
    queryKey: ["blog-post", blogId],
    queryFn: async () => (await getBlogPost(blogId)).data,
    enabled: Boolean(blogId),
  });

  if (blogId && postQuery.isLoading) {
    return <Card title="Edit Blog">Memuat data blog...</Card>;
  }
  if (blogId && (postQuery.isError || !postQuery.data)) {
    return (
      <Card title="Blog tidak ditemukan">
        <p className="mb-4 text-slate-600">Data blog tidak tersedia atau gagal dimuat.</p>
        <Button text="Kembali ke Blogs" onClick={() => navigate("/blogs")} />
      </Card>
    );
  }

  return <BlogFormContent key={blogId || "new"} post={postQuery.data || null} />;
};

export default BlogForm;
