"use client";

import { useEffect, useRef, useState } from "react";
import type { AnalyzeInput } from "@/lib/api";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_BYTES = 8 * 1024 * 1024;

function validate(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) return "صرف تصویر لگائیں (PNG، JPG یا WEBP)۔";
  if (file.size > MAX_BYTES) return "یہ تصویر بہت بڑی ہے۔ 8 MB سے چھوٹی تصویر لگائیں۔";
  return null;
}

function isTypingTarget(el: EventTarget | null): boolean {
  return el instanceof HTMLElement && (el.tagName === "TEXTAREA" || el.tagName === "INPUT" || el.isContentEditable);
}

export default function Uploader({ onSubmit }: { onSubmit: (input: AnalyzeInput) => void }) {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [question, setQuestion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);

  function pickFile(file: File | undefined | null) {
    if (!file) return;
    const problem = validate(file);
    setError(problem);
    if (!problem) setImage(file);
  }

  useEffect(() => {
    if (!image) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(image);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

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
        setText((t) => (t ? `${t}\n${pasted}` : pasted));
        textRef.current?.focus();
      }
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, []);

  function removeImage() {
    setImage(null);
    setError(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  const canSubmit = Boolean(image) || text.trim().length > 0;

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (canSubmit) onSubmit({ image, text, question });
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

      {preview ? (
        <div className="flex flex-col items-center gap-4 rounded-[32px] border-4 border-forest bg-white p-6">
          {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
          <img src={preview} alt="آپ کی لگائی ہوئی تصویر" className="max-h-80 w-auto max-w-full rounded-2xl" />
          <button type="button" className="btn btn-secondary" onClick={removeImage}>
            تصویر ہٹائیں
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
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
          className={`flex min-h-64 w-full flex-col items-center justify-center gap-3 rounded-[32px] border-4 border-dashed border-forest p-8 text-center ${
            dragging ? "bg-lime" : "bg-chalk"
          }`}
        >
          <span aria-hidden="true" className="text-6xl">
            🖼️
          </span>
          <span className="text-[28px] font-bold">اسکرین شاٹ یہاں لگائیں</span>
          <span className="text-[22px]">
            کلک کریں، تصویر یہاں کھینچ لائیں، یا <span dir="ltr" className="font-mono">Ctrl+V</span> دبائیں
          </span>
        </button>
      )}

      {error && (
        <p role="alert" className="rounded-2xl border-4 border-warn bg-white p-4 font-bold">
          {error}
        </p>
      )}

      <label className="flex flex-col gap-2">
        <span className="font-bold">یا پیغام کا متن یہاں لگائیں</span>
        <textarea
          ref={textRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          dir="auto"
          className="w-full rounded-2xl border-4 border-forest bg-white p-4 text-[22px]"
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="font-bold">آپ کا سوال (اختیاری)</span>
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          dir="auto"
          className="min-h-16 w-full rounded-2xl border-4 border-forest bg-white px-4 text-[22px]"
        />
      </label>

      <button type="submit" className="btn btn-primary w-full text-[28px]" disabled={!canSubmit}>
        چیک کریں
      </button>
    </form>
  );
}
