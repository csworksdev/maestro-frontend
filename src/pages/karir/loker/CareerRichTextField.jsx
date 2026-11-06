import React, { useEffect, useImperativeHandle, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle, BackgroundColor } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import { TextSelection } from "@tiptap/pm/state";
import Icon from "@/components/ui/Icon";
import { sanitizeCareerRichText } from "@/utils/careerRichText";

const extensions = [
  StarterKit.configure({
    heading: { levels: [1, 2, 3] },
    link: { openOnClick: false },
  }),
  TextAlign.configure({ types: ["heading", "paragraph"] }),
  TextStyle,
  Color,
  BackgroundColor,
  Highlight.configure({ multicolor: true }),
];

const ToolButton = ({ icon, title, active = false, disabled = false, onClick }) => (
  <button
    type="button"
    title={title}
    aria-label={title}
    aria-pressed={active}
    disabled={disabled}
    onClick={onClick}
    className="career-editor-tool"
  >
    <Icon icon={icon} width={17} />
  </button>
);

const splitSelectedHardBreaks = (chain) =>
  chain.command(({ state, tr }) => {
    const { from, to, empty } = state.selection;
    if (empty) return true;

    const breaks = [];
    state.doc.nodesBetween(from, to, (node, pos, parent) => {
      if (node.type.name === "hardBreak" && parent?.type.name === "paragraph") {
        breaks.push(pos);
      }
    });

    if (!breaks.length) return true;

    for (const pos of breaks.reverse()) {
      tr.delete(pos, pos + 1);
      tr.split(pos);
    }

    tr.setSelection(TextSelection.create(
      tr.doc,
      tr.mapping.map(from, -1),
      tr.mapping.map(to, -1),
    ));
    return true;
  });

const toggleList = (editor, type) => {
  if (!editor) return;
  const chain = splitSelectedHardBreaks(editor.chain().focus());
  if (type === "bulletList") chain.toggleBulletList().run();
  else chain.toggleOrderedList().run();
};

const normalizeLinkUrl = (value) => {
  const input = value.trim();
  if (!input) return "";
  const candidate = /^[a-z][a-z\d+.-]*:/i.test(input) ? input : `https://${input}`;
  try {
    const parsed = new URL(candidate);
    if (!["http:", "https:", "mailto:", "tel:"].includes(parsed.protocol)) return null;
    if (["http:", "https:"].includes(parsed.protocol) && !parsed.hostname) return null;
    return candidate;
  } catch {
    return null;
  }
};

const CareerRichTextField = React.forwardRef(
  ({ label, value, onChange, placeholder }, ref) => {
    const [mode, setMode] = useState("visual");
    const [linkOpen, setLinkOpen] = useState(false);
    const [linkUrl, setLinkUrl] = useState("");
    const [linkText, setLinkText] = useState("");
    const [linkError, setLinkError] = useState("");
    const linkSelection = useRef(null);
    const sourceRef = useRef(null);
    const lastEditorHtml = useRef(sanitizeCareerRichText(value));

    const editor = useEditor({
      extensions: [...extensions, Placeholder.configure({ placeholder })],
      content: lastEditorHtml.current,
      immediatelyRender: false,
      editorProps: {
        attributes: {
          class: "career-editor-content",
          "aria-label": label,
          "data-placeholder": placeholder,
        },
      },
      onUpdate: ({ editor: currentEditor }) => {
        const html = currentEditor.getHTML();
        lastEditorHtml.current = html;
        onChange(html);
      },
    });

    useEffect(() => {
      if (!editor || mode !== "visual" || value === lastEditorHtml.current) return;
      const html = sanitizeCareerRichText(value);
      editor.commands.setContent(html, { emitUpdate: false });
      lastEditorHtml.current = editor.getHTML();
    }, [editor, mode, value]);

    useImperativeHandle(
      ref,
      () => ({
        getEditor: () => editor,
        getHTML: () =>
          mode === "html"
            ? sourceRef.current?.value ?? value
            : editor?.getHTML() ?? value,
      }),
      [editor, mode, value],
    );

    const switchToVisual = () => {
      if (mode === "html") {
        const html = sanitizeCareerRichText(sourceRef.current?.value ?? value);
        editor?.commands.setContent(html, { emitUpdate: false });
        lastEditorHtml.current = editor?.getHTML() ?? html;
        onChange(lastEditorHtml.current);
      }
      setMode("visual");
    };

    const openLinkEditor = () => {
      if (!editor) return;
      const { from, to, empty } = editor.state.selection;
      linkSelection.current = { from, to, empty };
      setLinkUrl(editor.getAttributes("link")?.href || "");
      setLinkText(empty ? "" : editor.state.doc.textBetween(from, to, " "));
      setLinkError("");
      setLinkOpen(true);
    };

    const applyLink = () => {
      if (!editor || !linkSelection.current) return;
      const href = normalizeLinkUrl(linkUrl);
      if (!href || (linkSelection.current.empty && !linkText.trim())) {
        setLinkError(!href ? "Masukkan alamat tautan yang valid." : "Masukkan teks tautan.");
        return;
      }
      const { from, to, empty } = linkSelection.current;
      if (empty) {
        editor.chain().focus().insertContentAt(from, {
          type: "text",
          text: linkText.trim(),
          marks: [{ type: "link", attrs: { href } }],
        }).run();
      } else {
        editor.chain().focus().setTextSelection({ from, to }).setLink({ href }).run();
      }
      setLinkOpen(false);
    };

    const removeLink = () => {
      if (!editor || !linkSelection.current) return;
      const { from, to } = linkSelection.current;
      editor.chain().focus().setTextSelection({ from, to }).unsetLink().run();
      setLinkOpen(false);
    };

    return (
      <div className="career-rich-text-field min-w-0">
        <div className="career-rich-text-heading">
          <span className="form-label">{label}</span>
          <div className="career-rich-text-heading-actions">
            <div className="career-rich-text-mode" role="group" aria-label={`Mode editor ${label}`}>
              <button type="button" aria-pressed={mode === "visual"} onClick={switchToVisual}>
                Visual
              </button>
              <button type="button" aria-pressed={mode === "html"} onClick={() => setMode("html")}>
                HTML
              </button>
            </div>
          </div>
        </div>

        {mode === "html" ? (
          <textarea
            ref={sourceRef}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            aria-label={`${label} HTML`}
            spellCheck={false}
            className="career-rich-text-source"
          />
        ) : (
          <div className="career-rich-text-editor">
            <div className="career-editor-toolbar" role="toolbar" aria-label={`Format ${label}`}>
              <select
                aria-label="Format paragraf"
                title="Format paragraf"
                value={editor?.isActive("heading", { level: 1 }) ? "h1" : editor?.isActive("heading", { level: 2 }) ? "h2" : editor?.isActive("heading", { level: 3 }) ? "h3" : "p"}
                onChange={(event) => {
                  const format = event.target.value;
                  if (format === "p") editor?.chain().focus().setParagraph().run();
                  else editor?.chain().focus().toggleHeading({ level: Number(format.slice(1)) }).run();
                }}
              >
                <option value="p">Paragraf</option>
                <option value="h1">Judul 1</option>
                <option value="h2">Judul 2</option>
                <option value="h3">Judul 3</option>
              </select>
              <span className="career-editor-separator" />
              <ToolButton icon="lucide:bold" title="Tebal" active={editor?.isActive("bold")} onClick={() => editor?.chain().focus().toggleBold().run()} />
              <ToolButton icon="lucide:italic" title="Miring" active={editor?.isActive("italic")} onClick={() => editor?.chain().focus().toggleItalic().run()} />
              <ToolButton icon="lucide:underline" title="Garis bawah" active={editor?.isActive("underline")} onClick={() => editor?.chain().focus().toggleUnderline().run()} />
              <ToolButton icon="lucide:strikethrough" title="Coret" active={editor?.isActive("strike")} onClick={() => editor?.chain().focus().toggleStrike().run()} />
              <span className="career-editor-separator" />
              <ToolButton icon="lucide:list" title="Daftar poin" active={editor?.isActive("bulletList")} onClick={() => toggleList(editor, "bulletList")} />
              <ToolButton icon="lucide:list-ordered" title="Daftar nomor" active={editor?.isActive("orderedList")} onClick={() => toggleList(editor, "orderedList")} />
              <ToolButton icon="lucide:quote" title="Kutipan" active={editor?.isActive("blockquote")} onClick={() => editor && splitSelectedHardBreaks(editor.chain().focus()).toggleBlockquote().run()} />
              <span className="career-editor-separator" />
              <ToolButton icon="lucide:pilcrow" title="Paragraf baru" onClick={() => editor?.chain().focus().enter().run()} />
              <ToolButton icon="lucide:corner-down-left" title="Baris baru" onClick={() => editor?.chain().focus().setHardBreak().run()} />
              <span className="career-editor-separator" />
              <ToolButton icon="lucide:align-left" title="Rata kiri" active={editor?.isActive({ textAlign: "left" })} onClick={() => editor?.chain().focus().setTextAlign("left").run()} />
              <ToolButton icon="lucide:align-center" title="Rata tengah" active={editor?.isActive({ textAlign: "center" })} onClick={() => editor?.chain().focus().setTextAlign("center").run()} />
              <ToolButton icon="lucide:align-right" title="Rata kanan" active={editor?.isActive({ textAlign: "right" })} onClick={() => editor?.chain().focus().setTextAlign("right").run()} />
              <span className="career-editor-separator" />
              <label className="career-editor-color" title="Warna teks">
                <Icon icon="lucide:palette" width={17} />
                <input type="color" aria-label="Warna teks" onChange={(event) => editor?.chain().focus().setColor(event.target.value).run()} />
              </label>
              <label className="career-editor-color" title="Warna sorotan">
                <Icon icon="lucide:highlighter" width={17} />
                <input type="color" aria-label="Warna sorotan" defaultValue="#fff0a6" onChange={(event) => editor?.chain().focus().setHighlight({ color: event.target.value }).run()} />
              </label>
              <ToolButton icon="lucide:link" title="Tautan" active={editor?.isActive("link")} onClick={openLinkEditor} />
              <span className="career-editor-separator" />
              <ToolButton icon="lucide:undo-2" title="Urungkan" disabled={!editor?.can().undo()} onClick={() => editor?.chain().focus().undo().run()} />
              <ToolButton icon="lucide:redo-2" title="Ulangi" disabled={!editor?.can().redo()} onClick={() => editor?.chain().focus().redo().run()} />
            </div>
            {linkOpen && (
              <div className="career-editor-link-row">
                {linkSelection.current?.empty && <input type="text" value={linkText} onChange={(event) => setLinkText(event.target.value)} placeholder="Teks tautan" aria-label="Teks tautan" />}
                <input type="text" value={linkUrl} onChange={(event) => { setLinkUrl(event.target.value); setLinkError(""); }} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); applyLink(); } }} placeholder="https://" aria-label="Alamat tautan" aria-invalid={Boolean(linkError)} />
                <button type="button" onClick={applyLink}>Terapkan</button>
                {editor?.isActive("link") && <button type="button" onClick={removeLink}>Hapus tautan</button>}
                <button type="button" onClick={() => setLinkOpen(false)} aria-label="Batal tautan"><Icon icon="lucide:x" width={16} /></button>
                {linkError && <span className="career-editor-link-error" role="alert">{linkError}</span>}
              </div>
            )}
            <EditorContent editor={editor} />
          </div>
        )}
      </div>
    );
  },
);

export default CareerRichTextField;
