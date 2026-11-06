import { axiosConfig } from "../config";
import { getBlogApiOptions } from "./config";

export const getBlogPosts = (params) =>
  axiosConfig.get("/api/blog/posts/", getBlogApiOptions({ params }));

export const getBlogPost = (postId) =>
  axiosConfig.get(
    `/api/blog/posts/${encodeURIComponent(postId)}/`,
    getBlogApiOptions(),
  );

export const addBlogPost = (data) =>
  axiosConfig.post("/api/blog/posts/", data, getBlogApiOptions());

export const editBlogPost = (postId, data) =>
  axiosConfig.put(
    `/api/blog/posts/${encodeURIComponent(postId)}/`,
    data,
    getBlogApiOptions(),
  );

export const deleteBlogPost = (postId) =>
  axiosConfig.delete(
    `/api/blog/posts/${encodeURIComponent(postId)}/`,
    getBlogApiOptions(),
  );

export const updateBlogPostStatus = (postId, data) =>
  axiosConfig.put(
    `/api/blog/posts/${encodeURIComponent(postId)}/status/`,
    data,
    getBlogApiOptions(),
  );

export const getBlogCategories = (params) =>
  axiosConfig.get("/api/blog/categories/", getBlogApiOptions({ params }));

export const getBlogCategory = (categoryId) =>
  axiosConfig.get(
    `/api/blog/categories/${encodeURIComponent(categoryId)}/`,
    getBlogApiOptions(),
  );

export const addBlogCategory = (data) =>
  axiosConfig.post("/api/blog/categories/", data, getBlogApiOptions());

export const editBlogCategory = (categoryId, data) =>
  axiosConfig.put(
    `/api/blog/categories/${encodeURIComponent(categoryId)}/`,
    data,
    getBlogApiOptions(),
  );

export const deleteBlogCategory = (categoryId) =>
  axiosConfig.delete(
    `/api/blog/categories/${encodeURIComponent(categoryId)}/`,
    getBlogApiOptions(),
  );

export const getBlogTags = (params) =>
  axiosConfig.get("/api/blog/tags/", getBlogApiOptions({ params }));

export const getBlogTag = (tagId) =>
  axiosConfig.get(
    `/api/blog/tags/${encodeURIComponent(tagId)}/`,
    getBlogApiOptions(),
  );

export const addBlogTag = (data) =>
  axiosConfig.post("/api/blog/tags/", data, getBlogApiOptions());

export const editBlogTag = (tagId, data) =>
  axiosConfig.put(
    `/api/blog/tags/${encodeURIComponent(tagId)}/`,
    data,
    getBlogApiOptions(),
  );

export const deleteBlogTag = (tagId) =>
  axiosConfig.delete(
    `/api/blog/tags/${encodeURIComponent(tagId)}/`,
    getBlogApiOptions(),
  );
