"use client";

import { useEffect, useState } from "react";

function findUrduVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  return window.speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().startsWith("ur")) ?? null;
}

// Hidden entirely unless the browser has an Urdu voice installed.
export default function SpeakButton({ parts }: { parts: string[] }) {
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const synth = window.speechSynthesis;
    const update = () => setVoice(findUrduVoice());
    update();
    synth.addEventListener("voiceschanged", update);
    return () => {
      synth.removeEventListener("voiceschanged", update);
      synth.cancel();
    };
  }, []);

  if (!voice) return null;

  function toggle() {
    const synth = window.speechSynthesis;
    if (speaking) {
      synth.cancel();
      setSpeaking(false);
      return;
    }
    synth.cancel();
    const text = parts.filter(Boolean);
    text.forEach((part, i) => {
      const u = new SpeechSynthesisUtterance(part);
      u.lang = "ur-PK";
      u.voice = voice;
      u.rate = 0.9;
      if (i === text.length - 1) {
        u.onend = () => setSpeaking(false);
        u.onerror = () => setSpeaking(false);
      }
      synth.speak(u);
    });
    setSpeaking(true);
  }

  return (
    <button type="button" onClick={toggle} aria-pressed={speaking} className={`btn ${speaking ? "btn-live" : "btn-secondary"}`}>
      <span aria-hidden="true">🔊</span>
      {speaking ? "سنا رہا ہوں… روکیں" : "سن لیں"}
    </button>
  );
}
