import { describe, expect, it } from "vitest";
import {
  countCareerLines,
  countCareerParagraphs,
  getCareerRichTextLines,
  hasCareerRichText,
  isCareerRichTextPreserved,
  sanitizeCareerRichText,
} from "./careerRichText";

describe("career rich text", () => {
  it("preserves breaks, empty paragraphs, lists, and inline formatting", () => {
    const html = '<p><strong>Ringkasan</strong><br>Baris kedua</p><p><br></p><ul><li class="ql-align-center">Syarat</li></ul>';
    const result = sanitizeCareerRichText(html);

    expect(result).toContain("<br>");
    expect(result).toContain("<p><br></p>");
    expect(result).toContain("<strong>Ringkasan</strong>");
    expect(result).toContain('<li class="ql-align-center">Syarat</li>');
  });

  it("keeps line breaks from older plain text jobs", () => {
    expect(sanitizeCareerRichText("Baris pertama\nBaris kedua")).toBe(
      "Baris pertama<br>Baris kedua",
    );
  });

  it("turns a single newline inside an HTML paragraph into a break", () => {
    expect(sanitizeCareerRichText("<p>Nama saya Budi. \nRumah di Bandung</p>")).toBe(
      "<p>Nama saya Budi. <br>Rumah di Bandung</p>",
    );
    expect(sanitizeCareerRichText("<p>Nama saya Budi.&#x20;\nRumah di Bandung</p>")).toBe(
      "<p>Nama saya Budi. <br>Rumah di Bandung</p>",
    );
    expect(sanitizeCareerRichText("<p>Satu\n\nDua</p>")).toBe(
      "<p>Satu<br><br>Dua</p>",
    );
  });

  it("removes unsafe HTML and rejects visually empty content", () => {
    const result = sanitizeCareerRichText('<p>Isi</p><script>alert(1)</script><a href="javascript:alert(1)">tautan</a>');
    expect(result).not.toContain("<script");
    expect(result).not.toContain("javascript:");
    expect(hasCareerRichText("<p><br></p>")).toBe(false);
    expect(hasCareerRichText("<p>Isi<br>lanjutan</p>")).toBe(true);
  });

  it("detects when saved paragraphs have been collapsed", () => {
    const submitted = "<p>Pertama</p><p>Kedua</p><p>Ketiga</p>";
    expect(getCareerRichTextLines(submitted)).toBe("Pertama\nKedua\nKetiga");
    expect(isCareerRichTextPreserved(submitted, "Pertama Kedua Ketiga")).toBe(false);
    expect(isCareerRichTextPreserved(submitted, "Pertama\nKedua\nKetiga")).toBe(true);
  });

  it("detects missing text and blank paragraphs", () => {
    expect(isCareerRichTextPreserved("<p>Satu</p><p>Dua</p>", "<p>Satu</p>")).toBe(false);
    expect(isCareerRichTextPreserved("<p>Satu</p><p><br></p><p>Dua</p>", "<p>Satu</p><p>Dua</p>")).toBe(false);
  });

  it("detects lost inline formatting even when words remain", () => {
    expect(isCareerRichTextPreserved("<p><strong>Penting</strong></p>", "<p>Penting</p>")).toBe(false);
    expect(isCareerRichTextPreserved('<p><a href="https://example.com">Tautan</a></p>', "<p>Tautan</p>")).toBe(false);
  });

  it("counts real paragraphs rather than visually wrapped lines", () => {
    expect(countCareerParagraphs("<p>Satu kalimat panjang yang terbungkus di layar kecil.</p>")).toBe(1);
    expect(countCareerParagraphs("<p>Satu</p><p>Dua</p><p>Tiga</p>")).toBe(3);
    expect(countCareerLines("<p>Satu<br>Dua</p>")).toBe(2);
  });
});
