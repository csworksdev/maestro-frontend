import React, { useEffect, useId, useRef, useState } from "react";
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
import "./BlogEditor.css";
import {
  uploadEditorAttachment,
  uploadEditorImage,
} from "@/axios/blog/media";

const BlogEditor = ({ initialData, editorRef, onReady }) => {
  const instanceRef = useRef(null);
  const undoRef = useRef(null);
  const scrollRestoreTimersRef = useRef([]);
  const [historyState, setHistoryState] = useState({
    canUndo: false,
    canRedo: false,
  });
  const holderId = `blog-editor-${useId().replace(/:/g, "")}`;

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
          class: ImageTool,
          config: {
            uploader: {
              uploadByFile: async (file) =>
                (await uploadEditorImage(file)).data,
              uploadByUrl: async () => ({ success: 0 }),
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
    });
    instanceRef.current = editor;

    return () => {
      active = false;
      scrollRestoreTimersRef.current.forEach(window.clearTimeout);
      scrollRestoreTimersRef.current = [];
      editorRef.current = null;
      undoRef.current = null;
      editor.isReady
        .then(() => editor.destroy())
        .catch(() => undefined);
      instanceRef.current = null;
    };
  }, [editorRef, holderId, initialData, onReady]);

  const historyButtonClass = (enabled) =>
    `inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary-500/30 ${
      enabled
        ? "border-slate-300 bg-white text-slate-700 shadow-sm hover:border-primary-500 hover:bg-primary-50 hover:text-primary-600 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:hover:border-primary-400"
        : "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 opacity-50 shadow-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500"
    }`;

  return (
    <div className="rounded-md border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
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
        className="blog-editor-canvas min-h-[560px] px-3 py-4 text-slate-800 dark:text-slate-200"
        onKeyDownCapture={handleHistoryShortcut}
      />
    </div>
  );
};

export default BlogEditor;
