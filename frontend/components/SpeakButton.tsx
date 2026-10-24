"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { SpeakerIcon } from "./Icons";

function findVoice(lang: string): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  return window.speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().startsWith(lang)) ?? null;
}

// Hidden entirely unless the browser has a voice for the current language.
export default function SpeakButton({ parts }: { parts: string[] }) {
  const { t, locale } = useI18n();
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const synth = window.speechSynthesis;
    const update = () => setVoice(findVoice(locale));
    update();
    synth.addEventListener("voiceschanged", update);
    return () => {
      synth.removeEventListener("voiceschanged", update);
      synth.cancel();
    };
  }, [locale]);

  if (!voice) return null;

  function toggle() {
    const synth = window.speechSynthesis;
    if (speaking) {
      synth.cancel();
      setSpeaking(false);
      return;
    }
    synth.cancel();
    const spoken = parts.filter(Boolean);
    spoken.forEach((part, i) => {
      const u = new SpeechSynthesisUtterance(part);
      u.lang = voice?.lang ?? (locale === "ur" ? "ur-PK" : "en-US");
      u.voice = voice;
      u.rate = 0.9;
      if (i === spoken.length - 1) {
        u.onend = () => setSpeaking(false);
        u.onerror = () => setSpeaking(false);
      }
      synth.speak(u);
    });
    setSpeaking(true);
  }

  return (
    <button type="button" onClick={toggle} aria-pressed={speaking} className={`btn ${speaking ? "btn-live" : "btn-secondary"}`}>
      <SpeakerIcon width={20} height={20} />
      {speaking ? t.speak.stop : t.speak.start}
    </button>
  );
}
