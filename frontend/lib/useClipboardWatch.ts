"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "hifazat.watchClipboard";
const POLL_MS = 2000;
const MIN_LENGTH = 20; // shorter copies (a word, a number) are not worth a prompt

export type WatchStatus = "off" | "watching" | "denied";

function readSaved(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function save(on: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, on ? "1" : "0");
  } catch {
    /* storage unavailable: the choice just won't be remembered */
  }
}

// Offers to check a message the moment it is copied. Browsers cannot read SMS or WhatsApp, but they can read the
// clipboard while this page is visible. Nothing is sent anywhere: `found` is only offered to the user.
export function useClipboardWatch() {
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [denied, setDenied] = useState(false);
  const [found, setFound] = useState<string | null>(null);
  const seen = useRef<string | null>(null);

  useEffect(() => {
    setSupported(typeof navigator !== "undefined" && typeof navigator.clipboard?.readText === "function");
    setEnabled(readSaved());
  }, []);

  useEffect(() => {
    if (!supported || !enabled) return;
    let stopped = false;

    async function poll() {
      if (stopped || document.visibilityState !== "visible" || !document.hasFocus()) return;
      try {
        const text = (await navigator.clipboard.readText()).trim();
        setDenied(false);
        if (seen.current === null) {
          seen.current = text; // whatever was already copied before turning this on is not "new"
          return;
        }
        if (text !== seen.current) {
          seen.current = text;
          if (text.length >= MIN_LENGTH) setFound(text);
        }
      } catch {
        setDenied(true);
      }
    }

    poll();
    const id = window.setInterval(poll, POLL_MS);
    return () => {
      stopped = true;
      window.clearInterval(id);
    };
  }, [supported, enabled]);

  const toggle = useCallback(() => {
    setEnabled((on) => {
      save(!on);
      seen.current = null;
      setFound(null);
      setDenied(false);
      return !on;
    });
  }, []);

  const dismiss = useCallback(() => setFound(null), []);
  const status: WatchStatus = !enabled ? "off" : denied ? "denied" : "watching";
  return { supported, status, found, toggle, dismiss };
}
