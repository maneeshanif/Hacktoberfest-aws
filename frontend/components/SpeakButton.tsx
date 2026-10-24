"use client";

import { useI18n } from "@/lib/i18n";
import { useSpeech } from "@/lib/useSpeech";
import { SpeakerIcon } from "./Icons";

// Hidden entirely unless the browser has a voice for the current language.
export default function SpeakButton({ parts }: { parts: string[] }) {
  const { t, locale } = useI18n();
  const { available, speaking, toggle } = useSpeech(locale, parts);
  if (!available) return null;

  return (
    <button type="button" onClick={toggle} aria-pressed={speaking} className={`btn ${speaking ? "btn-live" : "btn-secondary"}`}>
      <SpeakerIcon width={20} height={20} />
      {speaking ? t.speak.stop : t.speak.start}
    </button>
  );
}
