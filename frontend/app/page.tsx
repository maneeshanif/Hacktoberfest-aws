"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Nav from "@/components/Nav";
import Uploader from "@/components/Uploader";
import VerdictCard from "@/components/VerdictCard";
import ScamAlert from "@/components/ScamAlert";
import { Faq, Footer, HowItWorks, Privacy, WhatWeCatch } from "@/components/Sections";
import { CheckIcon, LockIcon } from "@/components/Icons";
import {
  analyze,
  ApiError,
  getHealth,
  getMockResult,
  USE_MOCK,
  type AnalyzeInput,
  type AnalyzeResult,
  type ApiErrorKind,
  type Verdict,
} from "@/lib/api";
import { useI18n } from "@/lib/i18n";

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "result"; result: AnalyzeResult; isExample: boolean }
  | { status: "error"; kind: ApiErrorKind };

const DEMO_KEYS: Record<string, Verdict> = { "1": "scam", "2": "suspicious", "3": "safe" };

function isTypingTarget(el: EventTarget | null): boolean {
  return el instanceof HTMLElement && (el.tagName === "TEXTAREA" || el.tagName === "INPUT" || el.isContentEditable);
}

export default function Home() {
  const { t, locale } = useI18n();
  const [state, setState] = useState<State>({ status: "idle" });
  const [alertOpen, setAlertOpen] = useState(false);
  const [localMode, setLocalMode] = useState(false);
  const [uploaderKey, setUploaderKey] = useState(0);
  const [lastInput, setLastInput] = useState<AnalyzeInput | null>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    getHealth()
      .then((h) => setLocalMode(h.ok && h.mode === "local"))
      .catch(() => setLocalMode(false));
  }, []);

  const showResult = useCallback((result: AnalyzeResult, isExample: boolean) => {
    setState({ status: "result", result, isExample });
    setAlertOpen(result.verdict === "scam");
  }, []);

  const run = useCallback(
    async (input: AnalyzeInput) => {
      setLastInput(input);
      setState({ status: "loading" });
      try {
        showResult(await analyze({ ...input, lang: locale }), USE_MOCK);
      } catch (err) {
        setState({ status: "error", kind: err instanceof ApiError ? err.kind : "server" });
      }
    },
    [showResult, locale],
  );

  function reset() {
    setLastInput(null);
    setAlertOpen(false);
    setState({ status: "idle" });
    setUploaderKey((k) => k + 1);
    document.getElementById("check")?.scrollIntoView({ block: "center" });
  }

  const dismissAlert = useCallback(() => {
    setAlertOpen(false);
    requestAnimationFrame(() => titleRef.current?.focus());
  }, []);

  // Demo helper: press D, then 1 / 2 / 3 for scam / suspicious / safe example results.
  useEffect(() => {
    let armedAt = 0;
    function onKey(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey || isTypingTarget(e.target)) return;
      if (e.key.toLowerCase() === "d") {
        armedAt = Date.now();
        return;
      }
      const verdict = DEMO_KEYS[e.key];
      if (verdict && Date.now() - armedAt < 1500) {
        armedAt = 0;
        showResult(getMockResult(verdict, locale), true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showResult, locale]);

  return (
    <>
      <Nav />

      <main id="top">
        <section className="bg-tint px-4 pb-20 pt-14 sm:px-6 sm:pb-28 sm:pt-20">
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 text-center">
            <h1 className="text-[clamp(2.6rem,7vw,5rem)]">{t.hero.title}</h1>
            <p className="max-w-2xl text-[20px] text-muted">{t.hero.sub}</p>
            <div className="flex flex-wrap justify-center gap-3">
              <a href="#check" className="btn btn-primary !min-h-14 text-[18px]">
                {t.hero.primary}
              </a>
              <a href="#how" className="btn btn-secondary !min-h-14 text-[18px]">
                {t.hero.secondary}
              </a>
            </div>
            <ul className="flex flex-wrap justify-center gap-x-6 gap-y-1 text-[15px] font-semibold">
              {t.hero.points.map((point) => (
                <li key={point} className="flex items-center gap-1.5">
                  <CheckIcon width={18} height={18} className="text-blue" />
                  {point}
                </li>
              ))}
            </ul>
          </div>

          <div id="check" className="mx-auto mt-14 w-full max-w-3xl scroll-mt-24 overflow-hidden rounded-3xl border-2 border-ink bg-paper">
            <div className="flex items-center gap-3 border-b-2 border-ink px-4 py-3">
              <span className="flex gap-1.5" aria-hidden="true">
                <span className="size-3 rounded-full bg-danger" />
                <span className="size-3 rounded-full bg-warn" />
                <span className="size-3 rounded-full bg-safe" />
              </span>
              <span className="text-[15px] font-bold">{t.checker.title}</span>
              {localMode && (
                <span className="ms-auto flex items-center gap-1.5 rounded-full bg-tint px-3 py-1 text-[13px] font-semibold">
                  <LockIcon width={14} height={14} />
                  {t.checker.private}
                </span>
              )}
            </div>

            <div className="p-4 sm:p-6">
              {state.status === "idle" && <Uploader key={uploaderKey} onSubmit={run} />}

              {state.status === "loading" && (
                <div className="flex flex-col items-center gap-5 py-16" role="status" aria-live="polite">
                  <div className="stud" aria-hidden="true" />
                  <p className="text-[20px] font-bold">{t.checker.loading}</p>
                </div>
              )}

              {state.status === "error" && (
                <div role="alert" className="flex flex-col gap-4 rounded-2xl border-2 border-warn p-5">
                  <h2 className="text-[26px]">{t.checker.errorTitle}</h2>
                  <p className="text-[19px]">{t.checker.errors[state.kind]}</p>
                  <p className="text-muted">{t.checker.errorAdvice}</p>
                  <div className="flex flex-wrap gap-3">
                    {lastInput && (
                      <button type="button" className="btn btn-primary" onClick={() => run(lastInput)}>
                        {t.checker.retry}
                      </button>
                    )}
                    <button type="button" className="btn btn-secondary" onClick={reset}>
                      {t.checker.another}
                    </button>
                  </div>
                </div>
              )}

              {state.status === "result" && (
                <div className="flex flex-col gap-4">
                  <VerdictCard ref={titleRef} result={state.result} isExample={state.isExample} />
                  <button type="button" className="btn btn-secondary w-full" onClick={reset}>
                    {t.checker.another}
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        <WhatWeCatch />
        <HowItWorks />
        <Privacy />
        <Faq />
      </main>

      <Footer />

      {state.status === "result" && alertOpen && (
        <ScamAlert explanation={state.result.explanation_ur} onDismiss={dismissAlert} />
      )}
    </>
  );
}
