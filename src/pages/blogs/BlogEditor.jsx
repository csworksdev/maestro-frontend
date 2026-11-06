import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import EditorJS from "@editorjs/editorjs";
import Undo from "editorjs-undo";
import Header from "@editorjs/header";
import List from "@editorjs/list";
import Quote from "@editorjs/quote";
import Delimiter from "@editorjs/delimiter";
import InlineCode from "@editorjs/inline-code";
import ImageTool from "@editorjs/image";
import Checklist from "@editorjs/checklist";
import Warning from "@editorjs/warning";
import Table from "@editorjs/table";
import Code from "@editorjs/code";
import AttachesTool from "@editorjs/attaches";
import Icon from "@/components/ui/Icon";
import BlogMediaPicker from "./BlogMediaPicker";
import "./BlogEditor.css";
import { uploadEditorAttachment } from "@/axios/blog/media";

class MediaLibraryImageTool extends ImageTool {
  constructor(args) {
    super(args);
    this.openMediaLibrary = args.config.openMediaLibrary;
    this.editorApi = args.api;
    this.blockApi = args.block;
  }

  async appendCallback() {
    const media = await this.openMediaLibrary?.();
    if (!media?.url) {
      const blockIndex = this.editorApi.blocks.getBlockIndex(this.blockApi.id);
      if (blockIndex >= 0) this.editorApi.blocks.delete(blockIndex);
      return;
    }

    this.data = {
      ...this.data,
      file: {
        ...media,
        url: media.url,
      },
      caption: media.alt_text || this.data.caption || "",
    };
  }
}

const BlogEditor = ({ initialData, editorRef, onReady, onChange }) => {
  const instanceRef = useRef(null);
  const undoRef = useRef(null);
  const scrollRestoreTimersRef = useRef([]);
  const changeTimerRef = useRef(null);
  const saveRevisionRef = useRef(0);
  const mediaRequestRef = useRef(null);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [historyState, setHistoryState] = useState({
    canUndo: false,
    canRedo: false,
  });
  const [editorError, setEditorError] = useState("");
  const holderId = `blog-editor-${useId().replace(/:/g, "")}`;

  const openMediaLibrary = useCallback(
    () =>
      new Promise((resolve) => {
        mediaRequestRef.current?.(null);
        mediaRequestRef.current = resolve;
        setMediaPickerOpen(true);
      }),
    [],
  );

  const finishMediaRequest = useCallback((media = null) => {
    mediaRequestRef.current?.(media);
    mediaRequestRef.current = null;
    setMediaPickerOpen(false);
  }, []);

  const updateHistoryState = () => {
    const history = undoRef.current;
    setHistoryState({
      canUndo: Boolean(history?.canUndo()),
      canRedo: Boolean(history?.canRedo()),
    });
  };

  const keepViewportPosition = () => {
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    const restore = () => window.scrollTo(scrollX, scrollY);

    scrollRestoreTimersRef.current.forEach(window.clearTimeout);
    scrollRestoreTimersRef.current = [];
    requestAnimationFrame(restore);

    // Editor.js memindahkan caret secara asynchronous (sekitar 50 ms).
    // Beberapa checkpoint mencegah browser ikut menggulir ke caret tersebut.
    [60, 140, 280].forEach((delay) => {
      const timer = window.setTimeout(restore, delay);
      scrollRestoreTimersRef.current.push(timer);
    });
  };

  const handleHistoryShortcut = (event) => {
    if (!(event.ctrlKey || event.metaKey)) return;
    const key = event.key.toLowerCase();
    const isUndo = key === "z" && !event.shiftKey;
    const isRedo = key === "y" || (key === "z" && event.shiftKey);
    if (isUndo || isRedo) keepViewportPosition();
  };

  const runHistoryAction = async (action) => {
    const history = undoRef.current;
    const canRun =
      action === "undo" ? history?.canUndo() : history?.canRedo();
    if (!history || !canRun || typeof history[action] !== "function") return;
    keepViewportPosition();
    await history[action]();
    updateHistoryState();
  };

  const saveChangedContent = async (editor) => {
    const revision = ++saveRevisionRef.current;
    const content = await editor.save();
    onChange?.(content, revision);
  };

  useEffect(() => {
    if (instanceRef.current) return undefined;

    let active = true;

    const editor = new EditorJS({
      holder: holderId,
      data: initialData,
      autofocus: false,
      placeholder: "Mulai tulis isi blog di sini...",
      tools: {
        header: {
          class: Header,
          inlineToolbar: true,
          config: { levels: [2, 3, 4], defaultLevel: 2 },
        },
        list: { class: List, inlineToolbar: true },
        quote: { class: Quote, inlineToolbar: true },
        delimiter: Delimiter,
        inlineCode: InlineCode,
        image: {
          class: MediaLibraryImageTool,
          config: {
            openMediaLibrary,
            uploader: {
              uploadByUrl: async (url) => ({
                success: 1,
                file: { url },
              }),
            },
          },
        },
        checklist: { class: Checklist, inlineToolbar: true },
        warning: Warning,
        table: { class: Table, inlineToolbar: true },
        code: Code,
        attaches: {
          class: AttachesTool,
          config: {
            uploader: {
              uploadByFile: async (file) =>
                (await uploadEditorAttachment(file)).data,
            },
          },
        },
      },
      onReady: () => {
        if (!active) return;
        const history = new Undo({
          editor,
          maxLength: 100,
          onUpdate: () => requestAnimationFrame(updateHistoryState),
          config: {
            debounceTimer: 250,
            shortcuts: {
              undo: ["CMD+Z"],
              redo: ["CMD+Y", "CMD+SHIFT+Z"],
            },
          },
        });
        history.initialize(initialData);
        undoRef.current = history;
        updateHistoryState();
        editorRef.current = editor;
        onReady?.();
      },
      onChange: () => {
        window.clearTimeout(changeTimerRef.current);
        changeTimerRef.current = window.setTimeout(async () => {
          try {
            await saveChangedContent(editor);
          } catch {
            // Editor may be navigating away while a change is being serialized.
          }
        }, 400);
      },
    });
    instanceRef.current = editor;
    editor.isReady.catch(() => {
      if (active) {
        setEditorError(
          "Editor tidak berhasil dimuat. Muat ulang halaman lalu coba kembali.",
        );
      }
    });

    return () => {
      active = false;
      mediaRequestRef.current?.(null);
      mediaRequestRef.current = null;
      scrollRestoreTimersRef.current.forEach(window.clearTimeout);
      scrollRestoreTimersRef.current = [];
      window.clearTimeout(changeTimerRef.current);
      editorRef.current = null;
      undoRef.current = null;
      editor.isReady
        .then(async () => {
          try {
            await saveChangedContent(editor);
          } finally {
            editor.destroy();
          }
        })
        .catch(() => undefined);
      instanceRef.current = null;
    };
  }, [editorRef, holderId, initialData, onChange, onReady, openMediaLibrary]);

  const historyButtonClass = (enabled) =>
    `inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary-500/30 ${
      enabled
        ? "border-slate-300 bg-white text-slate-700 shadow-sm hover:border-primary-500 hover:bg-primary-50 hover:text-primary-600 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:hover:border-primary-400"
        : "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 opacity-50 shadow-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500"
    }`;

  return (
    <>
      <div className="rounded-md border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        {editorError && (
          <div role="alert" className="border-b border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700">
            {editorError}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 px-3 py-2 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className={historyButtonClass(historyState.canUndo)}
              disabled={!historyState.canUndo}
              onClick={() => runHistoryAction("undo")}
              onMouseDown={(event) => event.preventDefault()}
              title="Undo (Ctrl/Cmd + Z)"
              aria-disabled={!historyState.canUndo}
            >
              <Icon icon="heroicons-outline:arrow-uturn-left" />
              <span>Undo</span>
            </button>
            <button
              type="button"
              className={historyButtonClass(historyState.canRedo)}
              disabled={!historyState.canRedo}
              onClick={() => runHistoryAction("redo")}
              onMouseDown={(event) => event.preventDefault()}
              title="Redo (Ctrl/Cmd + Y)"
              aria-disabled={!historyState.canRedo}
            >
              <Icon icon="heroicons-outline:arrow-uturn-right" />
              <span>Redo</span>
            </button>
          </div>
        </div>
        <div
          id={holderId}
          className="blog-editor-canvas min-h-[360px] px-3 py-4 text-slate-800 dark:text-slate-200 sm:min-h-[480px] xl:min-h-[560px]"
          onKeyDownCapture={handleHistoryShortcut}
        />
      </div>
      <BlogMediaPicker
        open={mediaPickerOpen}
        onClose={() => finishMediaRequest(null)}
        onSelect={finishMediaRequest}
      />
    </>
  );
};

export default BlogEditor;
