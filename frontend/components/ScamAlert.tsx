"use client";

import { useEffect, useMemo, useRef } from "react";
import { useI18n } from "@/lib/i18n";
import { useSpeech } from "@/lib/useSpeech";
import { SpeakerIcon, StopIcon } from "./Icons";

export default function ScamAlert({ explanation, onDismiss }: { explanation: string; onDismiss: () => void }) {
  const { t, locale } = useI18n();
  const dialogRef = useRef<HTMLDivElement>(null);
  const dismissRef = useRef<HTMLButtonElement>(null);
  const parts = useMemo(() => [t.alert.title, explanation], [t.alert.title, explanation]);
  const { available, speaking, toggle } = useSpeech(locale, parts);

  useEffect(() => {
    dismissRef.current?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onDismiss();
      } else if (e.key === "Tab") {
        // Keep focus inside the alert: cycle through its buttons.
        const buttons = Array.from(dialogRef.current?.querySelectorAll<HTMLButtonElement>("button") ?? []);
        if (buttons.length === 0) return;
        e.preventDefault();
        const i = buttons.indexOf(document.activeElement as HTMLButtonElement);
        const next = e.shiftKey ? i - 1 : i + 1;
        buttons[(next + buttons.length) % buttons.length].focus();
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
      ref={dialogRef}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="scam-alert-title"
      aria-describedby="scam-alert-desc"
      className="on-dark fixed inset-0 z-50 flex flex-col items-center justify-center gap-8 overflow-y-auto bg-danger p-6 text-center text-white"
    >
      <StopIcon width={96} height={96} />
      <h2 id="scam-alert-title" className="max-w-4xl text-[clamp(2.2rem,6.5vw,4.2rem)]">
        {t.alert.title}
      </h2>
      <p id="scam-alert-desc" className="max-w-3xl text-[clamp(1.3rem,2.6vw,1.75rem)] font-medium leading-relaxed">
        {explanation}
      </p>
      <div className="flex flex-wrap justify-center gap-4">
        <button ref={dismissRef} type="button" onClick={onDismiss} className="btn min-h-16 min-w-56 !border-chalk bg-chalk text-[22px] text-ink hover:bg-white">
          {t.alert.dismiss}
        </button>
        {available && (
          <button
            type="button"
            onClick={toggle}
            aria-pressed={speaking}
            className="btn min-h-16 min-w-40 border-2 border-white text-[22px] text-white hover:bg-white/15"
          >
            <SpeakerIcon width={24} height={24} />
            {speaking ? t.speak.stop : t.alert.listen}
          </button>
        )}
      </div>
    </div>
  );
}
