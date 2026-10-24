"use client";

import { useEffect, useRef } from "react";
import { useI18n } from "@/lib/i18n";
import { StopIcon } from "./Icons";

export default function ScamAlert({ explanation, onDismiss }: { explanation: string; onDismiss: () => void }) {
  const { t } = useI18n();
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
      <StopIcon width={88} height={88} />
      <h2 id="scam-alert-title" className="max-w-4xl text-[clamp(2rem,6vw,3.5rem)]">
        {t.alert.title}
      </h2>
      <p id="scam-alert-desc" className="max-w-3xl text-[clamp(1.2rem,2.5vw,1.6rem)] leading-relaxed">
        {explanation}
      </p>
      <button ref={buttonRef} type="button" onClick={onDismiss} className="btn min-h-16 min-w-56 bg-white text-[22px] text-ink hover:bg-tint">
        {t.alert.dismiss}
      </button>
    </div>
  );
}
