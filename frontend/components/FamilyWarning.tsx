"use client";

import { useEffect, useState } from "react";

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for non-secure contexts or blocked clipboard API.
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch {
      ok = false;
    }
    document.body.removeChild(ta);
    return ok;
  }
}

export default function FamilyWarning({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  if (!text) return null;

  return (
    <>
      <button type="button" className="btn btn-primary" onClick={async () => setCopied(await copyText(text))}>
        <span aria-live="polite">{copied ? "کاپی ہو گیا ✓" : "گھر والوں کو بھیجیں"}</span>
      </button>
      <a
        className="btn btn-secondary"
        href={`https://wa.me/?text=${encodeURIComponent(text)}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        واٹس ایپ پر بھیجیں
      </a>
    </>
  );
}
