"use client";

// Voice typing via the browser's Web Speech API (Chrome/Edge/Safari). Where it is missing, `supported` is false
// and callers hide the microphone entirely.

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { Locale } from "./dictionaries";

interface RecognitionEvent {
  resultIndex: number;
  results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
}

interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: RecognitionEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

type RecognitionCtor = new () => Recognition;

function getCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const LANG_TAGS: Record<Locale, string> = { en: "en-US", ur: "ur-PK" };
const noopSubscribe = () => () => {};

export type VoiceError = "denied" | "no-speech" | "failed";

export function useSpeechRecognition(locale: Locale) {
  const supported = useSyncExternalStore(noopSubscribe, () => getCtor() !== null, () => false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<VoiceError | null>(null);
  const recRef = useRef<Recognition | null>(null);

  const stop = useCallback(() => recRef.current?.stop(), []);

  // `base` is whatever was already in the field; the spoken words are appended after it.
  const start = useCallback(
    (base: string, onText: (full: string) => void) => {
      const Ctor = getCtor();
      if (!Ctor) return;
      recRef.current?.abort();
      const rec = new Ctor();
      rec.lang = LANG_TAGS[locale];
      rec.continuous = true;
      rec.interimResults = true;

      let finals = "";
      rec.onresult = (e) => {
        let interim = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const result = e.results[i];
          if (result.isFinal) finals += result[0].transcript;
          else interim += result[0].transcript;
        }
        const spoken = (finals + interim).trim();
        onText(base ? `${base} ${spoken}` : spoken);
      };
      rec.onerror = (e) => {
        if (e.error === "aborted") return;
        setError(
          e.error === "not-allowed" || e.error === "service-not-allowed"
            ? "denied"
            : e.error === "no-speech"
              ? "no-speech"
              : "failed",
        );
      };
      rec.onend = () => {
        setListening(false);
        if (recRef.current === rec) recRef.current = null;
      };

      recRef.current = rec;
      setError(null);
      setListening(true);
      try {
        rec.start();
      } catch {
        setListening(false);
        setError("failed");
      }
    },
    [locale],
  );

  useEffect(() => () => recRef.current?.abort(), []);

  return { supported, listening, error, start, stop };
}
