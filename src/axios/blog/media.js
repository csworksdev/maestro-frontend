import { axiosConfig } from "../config";
import { getBlogApiOptions } from "./config";

const toMediaFormData = ({ file, alt_text = "" }) => {
  const formData = new FormData();
  if (file) formData.append("file", file);
  formData.append("alt_text", alt_text);
  return formData;
};

export const getBlogMedia = (params) =>
  axiosConfig.get("/api/blog/media/", getBlogApiOptions({ params }));

export const getBlogMediaDetail = (mediaId) =>
  axiosConfig.get(
    `/api/blog/media/${encodeURIComponent(mediaId)}/`,
    getBlogApiOptions(),
  );

export const addBlogMedia = (data) =>
  axiosConfig.post(
    "/api/blog/media/",
    toMediaFormData(data),
    getBlogApiOptions({ headers: { "Content-Type": "multipart/form-data" } }),
  );

export const editBlogMedia = (mediaId, data) =>
  axiosConfig.put(
    `/api/blog/media/${encodeURIComponent(mediaId)}/`,
    toMediaFormData(data),
    getBlogApiOptions({ headers: { "Content-Type": "multipart/form-data" } }),
  );

export const deleteBlogMedia = (mediaId) =>
  axiosConfig.delete(
    `/api/blog/media/${encodeURIComponent(mediaId)}/`,
    getBlogApiOptions(),
  );

const uploadEditorFile = (path, file) => {
  const formData = new FormData();
  formData.append("file", file);
  return axiosConfig.post(
    path,
    formData,
    getBlogApiOptions({ headers: { "Content-Type": "multipart/form-data" } }),
  );
};

export const uploadEditorImage = (file) =>
  uploadEditorFile("/api/blog/media/editorjs/image/", file);

export const uploadEditorAttachment = (file) =>
  uploadEditorFile("/api/blog/media/editorjs/file/", file);
