import { beforeEach, describe, expect, it, vi } from "vitest";

const axiosConfig = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
};

vi.mock("@/axios/config", () => ({ axiosConfig }));

const api = await import("@/axios/blog/blog");

describe("blog posts API", () => {
  beforeEach(() => vi.clearAllMocks());

  it("uses admin posts endpoints", () => {
    api.getBlogPosts({ page: 1 });
    api.getBlogPost("post-1");
    api.addBlogPost({ title: "Blog" });
    api.editBlogPost("post-1", { title: "Updated" });
    api.deleteBlogPost("post-1");
    api.updateBlogPostStatus("post-1", { status: "published" });

    expect(axiosConfig.get).toHaveBeenNthCalledWith(
      1,
      "/api/blog/posts/",
      expect.objectContaining({ params: { page: 1 } }),
    );
    expect(axiosConfig.get).toHaveBeenNthCalledWith(
      2,
      "/api/blog/posts/post-1/",
      expect.any(Object),
    );
    expect(axiosConfig.post).toHaveBeenCalledWith(
      "/api/blog/posts/",
      { title: "Blog" },
      expect.any(Object),
    );
    expect(axiosConfig.put).toHaveBeenNthCalledWith(
      1,
      "/api/blog/posts/post-1/",
      { title: "Updated" },
      expect.any(Object),
    );
    expect(axiosConfig.delete).toHaveBeenCalledWith(
      "/api/blog/posts/post-1/",
      expect.any(Object),
    );
    expect(axiosConfig.put).toHaveBeenNthCalledWith(
      2,
      "/api/blog/posts/post-1/status/",
      { status: "published" },
      expect.any(Object),
    );
  });

  it("uses tags CRUD endpoints", () => {
    api.getBlogTags({ page: 1, search: "api" });
    api.getBlogTag("tag-1");
    api.addBlogTag({ name: "gaya hidup" });
    api.editBlogTag("tag-1", { name: "Gaya Hidup" });
    api.deleteBlogTag("tag-1");

    expect(axiosConfig.get).toHaveBeenNthCalledWith(
      1,
      "/api/blog/tags/",
      expect.objectContaining({ params: { page: 1, search: "api" } }),
    );
    expect(axiosConfig.get).toHaveBeenNthCalledWith(
      2,
      "/api/blog/tags/tag-1/",
      expect.any(Object),
    );
    expect(axiosConfig.post).toHaveBeenCalledWith(
      "/api/blog/tags/",
      { name: "gaya hidup" },
      expect.any(Object),
    );
    expect(axiosConfig.put).toHaveBeenCalledWith(
      "/api/blog/tags/tag-1/",
      { name: "Gaya Hidup" },
      expect.any(Object),
    );
    expect(axiosConfig.delete).toHaveBeenCalledWith(
      "/api/blog/tags/tag-1/",
      expect.any(Object),
    );
  });

  it("uses categories CRUD endpoints", () => {
    api.getBlogCategories({ page: 1, only_root: true });
    api.getBlogCategory("category-1");
    api.addBlogCategory({
      name: "Gaya Dada",
      description: "Artikel seputar gaya dada",
      parent: "category-root",
    });
    api.editBlogCategory("category-1", {
      name: "Gaya Dada Dasar",
      description: "Panduan dasar",
      parent: null,
    });
    api.deleteBlogCategory("category-1");

    expect(axiosConfig.get).toHaveBeenNthCalledWith(
      1,
      "/api/blog/categories/",
      expect.objectContaining({ params: { page: 1, only_root: true } }),
    );
    expect(axiosConfig.get).toHaveBeenNthCalledWith(
      2,
      "/api/blog/categories/category-1/",
      expect.any(Object),
    );
    expect(axiosConfig.post).toHaveBeenCalledWith(
      "/api/blog/categories/",
      {
        name: "Gaya Dada",
        description: "Artikel seputar gaya dada",
        parent: "category-root",
      },
      expect.any(Object),
    );
    expect(axiosConfig.put).toHaveBeenCalledWith(
      "/api/blog/categories/category-1/",
      {
        name: "Gaya Dada Dasar",
        description: "Panduan dasar",
        parent: null,
      },
      expect.any(Object),
    );
    expect(axiosConfig.delete).toHaveBeenCalledWith(
      "/api/blog/categories/category-1/",
      expect.any(Object),
    );
  });
});
