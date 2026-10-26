"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AnalyzeInput } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { ClipboardIcon, CloseIcon, ImageIcon } from "./Icons";
import MicButton from "./MicButton";
import { useClipboardWatch } from "@/lib/useClipboardWatch";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_BYTES = 8 * 1024 * 1024;

function isTypingTarget(el: EventTarget | null): boolean {
  return el instanceof HTMLElement && (el.tagName === "TEXTAREA" || el.tagName === "INPUT" || el.isContentEditable);
}

type Initial = { text: string; image: File | null };

export default function Uploader({ onSubmit, initial }: { onSubmit: (input: AnalyzeInput) => void; initial?: Initial | null }) {
  const { t } = useI18n();
  const u = t.uploader;
  const w = t.watch;
  const watch = useClipboardWatch();
  const [picked, setPicked] = useState<{ file: File; url: string } | null>(null);
  const [text, setText] = useState(initial?.text ?? "");
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

  // A message shared to the installed app arrives as `initial`: show its screenshot once on mount.
  useEffect(() => {
    if (initial?.image) setImage(initial.image);
  }, [initial, setImage]);

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
      {watch.found && (
        <div role="status" className="rise flex flex-col gap-3 rounded-2xl bg-violet p-4 text-white">
          <p className="font-mono text-[13px] font-medium">{w.found}</p>
          <p dir="auto" className="line-clamp-3 text-[17px]">
            {watch.found}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-primary !min-h-11 !px-5"
              onClick={() => {
                const text = watch.found ?? "";
                watch.dismiss();
                onSubmit({ image: null, text, question: "" });
              }}
            >
              {w.check}
            </button>
            <button type="button" className="btn btn-outline-light !min-h-11 !px-5" onClick={watch.dismiss}>
              {w.dismiss}
            </button>
          </div>
        </div>
      )}

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
        className={`flex flex-col gap-3 rounded-2xl border-2 border-dashed p-4 transition-colors sm:p-5 ${
          dragging ? "border-forest bg-forest-soft" : "border-mist bg-paper focus-within:border-forest focus-within:bg-white"
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
              className="absolute end-2 top-2 flex size-11 items-center justify-center rounded-full bg-ink text-chalk hover:bg-forest"
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
          className="w-full resize-y bg-transparent p-1 text-[clamp(1.15rem,2.2vw,1.35rem)] outline-none placeholder:text-muted/80"
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
          <MicButton value={text} onChange={setText} />
          {watch.supported && (
            <button
              type="button"
              onClick={watch.toggle}
              aria-pressed={watch.status !== "off"}
              className={`btn !min-h-11 !px-4 ${watch.status === "off" ? "btn-secondary" : "btn-live"}`}
            >
              <ClipboardIcon width={20} height={20} />
              {w.toggle}
            </button>
          )}
          <span className="w-full text-[14px] text-muted sm:ms-2 sm:w-auto">{u.pasteHint}</span>
          {watch.status !== "off" && (
            <p role="status" className={`w-full text-[14px] ${watch.status === "denied" ? "font-semibold text-danger" : "text-muted"}`}>
              {watch.status === "denied" ? w.denied : `${w.on} ${w.note}`}
            </p>
          )}
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-2xl border-[1.5px] border-warn bg-warn-soft p-3 font-semibold">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          dir="auto"
          aria-label={u.questionLabel}
          placeholder={u.questionPlaceholder}
          className="min-h-14 min-w-0 flex-1 rounded-full border-[1.5px] border-line bg-paper px-5 outline-none placeholder:text-muted/80 focus:border-forest"
        />
        <MicButton value={question} onChange={setQuestion} compact />
      </div>

      <button type="submit" className="btn btn-primary w-full !min-h-16 text-[20px]" disabled={!canSubmit}>
        {u.submit}
      </button>
    </form>
  );
}
