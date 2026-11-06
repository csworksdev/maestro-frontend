import { describe, expect, it } from "vitest";
import {
  normalizeBlogContent,
  serializeBlogContent,
} from "@/pages/blogs/blogContent";

describe("blog Editor.js content compatibility", () => {
  it("converts API list blocks for Editor.js and back", () => {
    const apiContent = {
      time: 1792054800000,
      version: "2.30.0",
      blocks: [
        {
          id: "list-1",
          type: "list",
          data: {
            type: "unordered",
            items: ["Item <b>pertama</b>", "Item kedua"],
          },
        },
      ],
    };

    const editorContent = normalizeBlogContent(apiContent);
    expect(editorContent.blocks[0].data.style).toBe("unordered");
    expect(editorContent.blocks[0].data.items[0].content).toBe(
      "Item <b>pertama</b>",
    );
    expect(serializeBlogContent(editorContent)).toEqual(apiContent);
  });

  it("keeps non-list plugin blocks unchanged", () => {
    const content = {
      blocks: [
        { type: "image", data: { file: { url: "https://example.com/a.jpg" } } },
        { type: "warning", data: { title: "Info", message: "Pesan" } },
      ],
    };

    expect(normalizeBlogContent(content)).toEqual(content);
    expect(serializeBlogContent(content)).toEqual(content);
  });
});
