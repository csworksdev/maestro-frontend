import { beforeEach, describe, expect, it, vi } from "vitest";

const axiosConfig = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
};

vi.mock("@/axios/config", () => ({ axiosConfig }));

const api = await import("@/axios/blog/media");

describe("blog media API", () => {
  beforeEach(() => vi.clearAllMocks());

  it("uses media CRUD endpoints", () => {
    const file = new File(["image"], "cover.jpg", { type: "image/jpeg" });
    api.getBlogMedia({ page: 1 });
    api.getBlogMediaDetail("media-1");
    api.addBlogMedia({ file, alt_text: "Cover" });
    api.editBlogMedia("media-1", { alt_text: "Updated" });
    api.deleteBlogMedia("media-1");

    expect(axiosConfig.get).toHaveBeenNthCalledWith(
      1,
      "/api/blog/media/",
      expect.objectContaining({ params: { page: 1 } }),
    );
    expect(axiosConfig.get).toHaveBeenNthCalledWith(
      2,
      "/api/blog/media/media-1/",
      expect.any(Object),
    );
    expect(axiosConfig.post).toHaveBeenCalledWith(
      "/api/blog/media/",
      expect.any(FormData),
      expect.any(Object),
    );
    expect(axiosConfig.put).toHaveBeenCalledWith(
      "/api/blog/media/media-1/",
      expect.any(FormData),
      expect.any(Object),
    );
    expect(axiosConfig.delete).toHaveBeenCalledWith(
      "/api/blog/media/media-1/",
      expect.any(Object),
    );
  });

  it("uses Editor.js upload endpoints", () => {
    const file = new File(["file"], "guide.pdf", { type: "application/pdf" });
    api.uploadEditorImage(file);
    api.uploadEditorAttachment(file);

    expect(axiosConfig.post).toHaveBeenNthCalledWith(
      1,
      "/api/blog/media/editorjs/image/",
      expect.any(FormData),
      expect.any(Object),
    );
    expect(axiosConfig.post).toHaveBeenNthCalledWith(
      2,
      "/api/blog/media/editorjs/file/",
      expect.any(FormData),
      expect.any(Object),
    );
  });
});
