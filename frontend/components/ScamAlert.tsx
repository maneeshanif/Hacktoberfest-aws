"use client";

import { useEffect, useRef } from "react";

export default function ScamAlert({ explanation, onDismiss }: { explanation: string; onDismiss: () => void }) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    buttonRef.current?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onDismiss();
      } else if (e.key === "Tab") {
        // Only one control: keep focus on it.
        e.preventDefault();
        buttonRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onDismiss]);

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="scam-alert-title"
      aria-describedby="scam-alert-desc"
      className="on-dark fixed inset-0 z-50 flex flex-col items-center justify-center gap-8 overflow-y-auto bg-danger p-6 text-center text-white"
    >
      <h2 id="scam-alert-title" className="font-urdu-heading max-w-4xl text-[36px] font-bold leading-[2.3] sm:text-[52px]">
        <span aria-hidden="true">🚨 </span>
        یہ دھوکا ہو سکتا ہے! کسی کو کوڈ یا پن مت بتائیں۔
      </h2>
      <p id="scam-alert-desc" className="max-w-3xl text-[26px] leading-[2] sm:text-[30px]">
        {explanation}
      </p>
      <button
        ref={buttonRef}
        type="button"
        onClick={onDismiss}
        className="btn min-h-20 min-w-64 bg-white text-[30px] text-ink"
      >
        سمجھ گیا
      </button>
    </div>
  );
}
