"use client";

import { useI18n } from "@/lib/i18n";
import { useSpeechRecognition } from "@/lib/useSpeechRecognition";
import { MicIcon, StopSquareIcon } from "./Icons";

type Props = { value: string; onChange: (next: string) => void; compact?: boolean };

// Dictation into a text field. Renders nothing when the browser has no speech recognition.
export default function MicButton({ value, onChange, compact = false }: Props) {
  const { t, locale } = useI18n();
  const { supported, listening, error, start, stop } = useSpeechRecognition(locale);
  if (!supported) return null;

  const label = listening ? t.voice.stop : t.voice.start;
  const Icon = listening ? StopSquareIcon : MicIcon;
  const toggle = () => (listening ? stop() : start(value.trim(), onChange));

  return (
    <>
      <button
        type="button"
        onClick={toggle}
        aria-pressed={listening}
        aria-label={compact ? label : undefined}
        className={`btn ${listening ? "btn-live" : "btn-secondary"} ${compact ? "!size-14 !min-h-14 shrink-0 !p-0" : "!min-h-11 !px-4"}`}
      >
        <Icon width={20} height={20} />
        {!compact && label}
      </button>
      {listening && (
        <p role="status" className="w-full text-[14px] text-muted">
          <span className="font-bold text-ink">{t.voice.listening}</span> {t.voice.privacy}
        </p>
      )}
      {error && (
        <p role="alert" className="w-full text-[14px] font-semibold text-danger">
          {error === "denied" ? t.voice.denied : error === "no-speech" ? t.voice.noSpeech : t.voice.failed}
        </p>
      )}
    </>
  );
}
