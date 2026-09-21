import React, { createRef } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import CareerRichTextField from "./CareerRichTextField";

beforeAll(() => {
  const rect = { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 };
  Range.prototype.getClientRects = () => [rect];
  Range.prototype.getBoundingClientRect = () => rect;
});

afterEach(cleanup);

describe("CareerRichTextField", () => {
  it("keeps existing paragraphs and inserts a single hard break", async () => {
    const ref = createRef();
    render(
      <CareerRichTextField
        ref={ref}
        label="Deskripsi"
        value="<p>Nama saya Budi.</p><p>Rumah di Bandung</p>"
        onChange={() => {}}
        placeholder="Deskripsi"
      />,
    );

    await waitFor(() => expect(ref.current?.getHTML()).toContain("<p>Rumah di Bandung</p>"));
    fireEvent.click(screen.getByRole("button", { name: "Baris baru" }));
    expect(ref.current.getHTML()).toContain("<br>");
  });

  it("inserts a new paragraph with one command", async () => {
    const ref = createRef();
    render(
      <CareerRichTextField
        ref={ref}
        label="Requirements"
        value="<p>Syarat pertama</p>"
        onChange={() => {}}
        placeholder="Requirements"
      />,
    );

    await waitFor(() => expect(ref.current?.getHTML()).toContain("Syarat pertama"));
    fireEvent.click(screen.getByRole("button", { name: "Paragraf baru" }));
    expect(ref.current.getHTML().match(/<p>/g)).toHaveLength(2);
  });

  it("preserves a single newline when plain text is pasted", async () => {
    const ref = createRef();
    const { container } = render(
      <CareerRichTextField
        ref={ref}
        label="Deskripsi"
        value=""
        onChange={() => {}}
        placeholder="Deskripsi"
      />,
    );

    const content = await waitFor(() => {
      const element = container.querySelector(".career-editor-content");
      expect(element).toBeTruthy();
      return element;
    });
    content.focus();
    fireEvent.paste(content, {
      clipboardData: {
        types: ["text/plain"],
        getData: (type) =>
          type === "text/plain" ? "Nama saya Budi.\nRumah di Bandung" : "",
      },
    });

    expect(ref.current.getHTML()).toContain("Nama saya Budi.");
    expect(ref.current.getHTML()).toContain("Rumah di Bandung");
    expect(ref.current.getHTML().match(/<p>/g)).toHaveLength(2);
  });

  it("loads the latest job content when the selected job changes", async () => {
    const ref = createRef();
    const renderField = (value) => (
      <CareerRichTextField
        ref={ref}
        label="Deskripsi"
        value={value}
        onChange={() => {}}
        placeholder="Deskripsi"
      />
    );
    const view = render(renderField("<p>Loker lama</p>"));
    await waitFor(() => expect(ref.current?.getHTML()).toContain("Loker lama"));

    view.rerender(renderField("<p>Loker baru</p><p>Paragraf kedua</p>"));
    await waitFor(() => expect(ref.current?.getHTML()).toContain("Paragraf kedua"));
    expect(ref.current.getHTML()).not.toContain("Loker lama");
  });

  it.each([
    ["Daftar poin", "ul"],
    ["Daftar nomor", "ol"],
  ])("creates one list item per selected hard-break line with %s", async (button, tag) => {
    const ref = createRef();
    render(
      <CareerRichTextField
        ref={ref}
        label="Persyaratan"
        value="<p>Syarat pertama<br>Syarat kedua<br>Syarat ketiga</p>"
        onChange={() => {}}
        placeholder="Persyaratan"
      />,
    );

    const editor = await waitFor(() => {
      expect(ref.current?.getEditor()).toBeTruthy();
      return ref.current.getEditor();
    });
    editor.commands.setTextSelection({ from: 1, to: editor.state.doc.content.size - 1 });
    fireEvent.click(screen.getByRole("button", { name: button }));

    expect(ref.current.getHTML()).toBe(
      `<${tag}><li><p>Syarat pertama</p></li><li><p>Syarat kedua</p></li><li><p>Syarat ketiga</p></li></${tag}><p></p>`,
    );
  });
});
