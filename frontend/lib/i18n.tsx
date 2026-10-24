"use client";

// Locale state for the UI. The copy itself lives in ./dictionaries.

import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { DEFAULT_LOCALE, DICTIONARIES, type Locale, type Strings } from "./dictionaries";

const STORAGE_KEY = "hifazat.locale";

type Ctx = { locale: Locale; t: Strings; dir: "ltr" | "rtl"; setLocale: (l: Locale) => void; toggle: () => void };
const I18nContext = createContext<Ctx | null>(null);

// The locale lives in an external store (localStorage, with an in-memory fallback) so the server render and the
// first client render both use DEFAULT_LOCALE, and the saved choice is applied right after hydration.
let memoryLocale: Locale = DEFAULT_LOCALE;
const listeners = new Set<() => void>();

function readLocale(): Locale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "en" || saved === "ur") return saved;
  } catch {
    /* storage unavailable: use the in-memory value */
  }
  return memoryLocale;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore(subscribe, readLocale, () => DEFAULT_LOCALE);
  const dir = locale === "ur" ? "rtl" : "ltr";

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
    document.title = DICTIONARIES[locale].meta.title;
  }, [locale, dir]);

  const setLocale = useCallback((l: Locale) => {
    memoryLocale = l;
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
    listeners.forEach((notify) => notify());
  }, []);

  const value = useMemo<Ctx>(
    () => ({ locale, t: DICTIONARIES[locale], dir, setLocale, toggle: () => setLocale(locale === "en" ? "ur" : "en") }),
    [locale, dir, setLocale],
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): Ctx {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
}
