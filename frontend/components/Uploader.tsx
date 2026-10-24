"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AnalyzeInput } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { ClipboardIcon, CloseIcon, ImageIcon } from "./Icons";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_BYTES = 8 * 1024 * 1024;

function isTypingTarget(el: EventTarget | null): boolean {
  return el instanceof HTMLElement && (el.tagName === "TEXTAREA" || el.tagName === "INPUT" || el.isContentEditable);
}

export default function Uploader({ onSubmit }: { onSubmit: (input: AnalyzeInput) => void }) {
  const { t } = useI18n();
  const u = t.uploader;
  const [picked, setPicked] = useState<{ file: File; url: string } | null>(null);
  const [text, setText] = useState("");
  const [question, setQuestion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const urlRef = useRef<string | null>(null);
  const image = picked?.file ?? null;
  const preview = picked?.url ?? null;

  const setImage = useCallback((file: File | null) => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = file ? URL.createObjectURL(file) : null;
    setPicked(file && urlRef.current ? { file, url: urlRef.current } : null);
  }, []);

  const pickFile = useCallback(
    (file: File | null | undefined) => {
      if (!file) return;
      if (!ALLOWED_TYPES.includes(file.type)) return setError(u.badType);
      if (file.size > MAX_BYTES) return setError(u.tooBig);
      setError(null);
      setImage(file);
    },
    [u, setImage],
  );

  // Release the object URL when the uploader goes away.
  useEffect(
    () => () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    },
    [],
  );

  // Ctrl+V anywhere on the page: images become the screenshot, text goes into the textarea.
  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      const items = Array.from(e.clipboardData?.items ?? []);
      const imageItem = items.find((i) => i.kind === "file" && i.type.startsWith("image/"));
      if (imageItem) {
        e.preventDefault();
        pickFile(imageItem.getAsFile());
        return;
      }
      if (isTypingTarget(e.target)) return;
      const pasted = e.clipboardData?.getData("text/plain");
      if (pasted) {
        e.preventDefault();
        setText((prev) => (prev ? `${prev}\n${pasted}` : pasted));
        textRef.current?.focus();
      }
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [pickFile]);

  function removeImage() {
    setImage(null);
    setError(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function pasteFromClipboard() {
    try {
      for (const item of await navigator.clipboard.read()) {
        const type = item.types.find((x) => x.startsWith("image/"));
        if (type) return pickFile(new File([await item.getType(type)], "pasted.png", { type }));
      }
      const pasted = await navigator.clipboard.readText();
      if (pasted) setText((prev) => (prev ? `${prev}\n${pasted}` : pasted));
    } catch {
      setError(u.pasteDenied);
    }
  }

  const canSubmit = Boolean(image) || text.trim().length > 0;
  function submit() {
    if (canSubmit) onSubmit({ image, text, question });
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => pickFile(e.target.files?.[0])}
      />

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          pickFile(e.dataTransfer.files?.[0]);
        }}
        className={`flex flex-col gap-3 rounded-2xl border-2 p-4 transition-colors ${
          dragging ? "border-blue bg-tint" : "border-line bg-paper focus-within:border-blue"
        }`}
      >
        {preview && (
          <div className="relative w-fit self-center">
            {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
            <img src={preview} alt={u.imageAlt} className="max-h-72 w-auto max-w-full rounded-xl border border-line" />
            <button
              type="button"
              onClick={removeImage}
              aria-label={u.removeImage}
              className="absolute end-2 top-2 flex size-11 items-center justify-center rounded-full bg-ink text-white hover:bg-blue"
            >
              <CloseIcon width={20} height={20} />
            </button>
          </div>
        )}

        <textarea
          ref={textRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              submit();
            }
          }}
          rows={preview ? 3 : 6}
          dir="auto"
          aria-label={u.textLabel}
          placeholder={u.placeholder}
          className="w-full resize-y bg-transparent p-1 outline-none placeholder:text-muted/80"
        />

        <div className="flex flex-wrap items-center gap-2 border-t border-line pt-3">
          <button type="button" className="btn btn-secondary !min-h-11 !px-4" onClick={() => fileRef.current?.click()}>
            <ImageIcon width={20} height={20} />
            {u.pickImage}
          </button>
          <button type="button" className="btn btn-secondary !min-h-11 !px-4" onClick={pasteFromClipboard}>
            <ClipboardIcon width={20} height={20} />
            {u.paste}
          </button>
          <span className="w-full text-[14px] text-muted sm:ms-2 sm:w-auto">{u.pasteHint}</span>
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-xl border-2 border-warn bg-paper p-3 font-semibold">
          {error}
        </p>
      )}

      <input
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        dir="auto"
        aria-label={u.questionLabel}
        placeholder={u.questionPlaceholder}
        className="min-h-14 w-full rounded-2xl border-2 border-line bg-paper px-4 outline-none placeholder:text-muted/80 focus:border-blue"
      />

      <button type="submit" className="btn btn-primary w-full !min-h-14 text-[18px]" disabled={!canSubmit}>
        {u.submit}
      </button>
    </form>
  );
}
