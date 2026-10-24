"use client";

// Read-aloud via the browser's speech synthesis. `voice` stays null (and callers hide their button)
// unless the browser has a voice for the current language.

import { useCallback, useEffect, useState } from "react";
import type { Locale } from "./dictionaries";

function findVoice(lang: Locale): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  return window.speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().startsWith(lang)) ?? null;
}

export function useSpeech(locale: Locale, parts: string[]) {
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

  const toggle = useCallback(() => {
    if (!voice) return;
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
      u.lang = voice.lang;
      u.voice = voice;
      u.rate = 0.9;
      if (i === spoken.length - 1) {
        u.onend = () => setSpeaking(false);
        u.onerror = () => setSpeaking(false);
      }
      synth.speak(u);
    });
    setSpeaking(true);
  }, [voice, speaking, parts]);

  return { available: voice !== null, speaking, toggle };
}
