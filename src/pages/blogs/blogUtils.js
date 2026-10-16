export const getBlogCollection = (data) => {
  if (Array.isArray(data)) return data;
  return Array.isArray(data?.results) ? data.results : [];
};

export const formatBlogDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

export const getBlogPageCount = (data, pageSize) => {
  const size = Number(pageSize);
  if (!Number.isFinite(size) || size <= 0) return 0;
  const count = Number(data?.count);
  if (Number.isFinite(count)) return Math.ceil(Math.max(0, count) / size);
  return getBlogCollection(data).length ? 1 : 0;
};

