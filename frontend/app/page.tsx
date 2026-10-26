"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Nav from "@/components/Nav";
import Uploader from "@/components/Uploader";
import PhoneDemo from "@/components/PhoneDemo";
import Progress from "@/components/Progress";
import VerdictCard from "@/components/VerdictCard";
import ScamAlert from "@/components/ScamAlert";
import { AppSection, AutoCheck, Engine, Faq, Footer, HowItWorks, Privacy, WhatWeCatch } from "@/components/Sections";
import { CheckIcon, LockIcon } from "@/components/Icons";
import StudShield from "@/components/StudShield";
import {
  analyze,
  ApiError,
  getHealth,
  getMockResult,
  USE_MOCK,
  type AnalyzeInput,
  type AnalyzeResult,
  type Checks,
  type ApiErrorKind,
  type Verdict,
} from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { takeShared, type SharedPayload } from "@/lib/shared";

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
  const [checks, setChecks] = useState<Checks | null>(null);
  const [uploaderKey, setUploaderKey] = useState(0);
  const [lastInput, setLastInput] = useState<AnalyzeInput | null>(null);
  const [shared, setShared] = useState<SharedPayload | null>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    getHealth()
      .then((h) => {
        setLocalMode(h.ok && h.mode === "local");
        setChecks(h.checks ?? null);
      })
      .catch(() => setLocalMode(false));
  }, []);

  // A message shared from the phone's Share menu (see public/sw.js) lands here as ?shared=1.
  useEffect(() => {
    if (!new URLSearchParams(window.location.search).has("shared")) return;
    window.history.replaceState(null, "", "/");
    takeShared().then((payload) => {
      if (!payload) return;
      setShared(payload);
      setUploaderKey((k) => k + 1);
      document.getElementById("check")?.scrollIntoView({ block: "center" });
    });
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
    setShared(null);
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
        <section className="on-dark overflow-hidden bg-forest text-chalk">
          <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 pb-20 pt-32 sm:px-6 sm:pt-40 lg:grid-cols-[1.1fr_0.9fr] lg:pb-28">
            <div className="flex flex-col items-start gap-8">
              <h1 className="text-[clamp(2.5rem,5.6vw,4.5rem)]">{t.hero.title}</h1>
              <p className="max-w-xl text-[clamp(1.15rem,2vw,1.4rem)] text-chalk/85">{t.hero.sub}</p>
              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                <a href="#check" className="btn btn-primary !min-h-16 text-[19px]">
                  {t.hero.primary}
                </a>
                <a href="#how" className="btn btn-outline-light !min-h-16 text-[19px]">
                  {t.hero.secondary}
                </a>
              </div>
              <ul className="w-full max-w-md border-t-[1.5px] border-lime/70">
                {t.hero.points.map((point) => (
                  <li key={point} className="flex items-center gap-3 border-b border-chalk/20 py-3 text-[17px] font-medium">
                    <CheckIcon width={20} height={20} className="shrink-0 text-lime" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
            <PhoneDemo />
          </div>
        </section>

        <section className="px-3 py-12 sm:px-6 sm:py-20">
          <div id="check" className="card mx-auto w-full max-w-3xl scroll-mt-28 overflow-hidden !border-ink">
            <div className="on-dark flex items-center gap-3 bg-forest px-5 py-4 text-chalk">
              <StudShield size={30} className="text-chalk" />
              <h2 className="font-display text-[22px] font-extrabold">{t.checker.title}</h2>
              {localMode && (
                <span className="chip ms-auto !bg-lime !text-[12px] !text-ink">
                  <LockIcon width={14} height={14} />
                  {t.checker.private}
                </span>
              )}
            </div>

            <div className="p-4 sm:p-6">
              {state.status === "idle" && <Uploader key={uploaderKey} onSubmit={run} initial={shared} />}

              {state.status === "loading" && <Progress />}

              {state.status === "error" && (
                <div role="alert" className="flex flex-col gap-4 rounded-2xl bg-warn-soft p-5">
                  <h2 className="text-[26px]">{t.checker.errorTitle}</h2>
                  <p className="text-[18px]">{t.checker.errors[state.kind]}</p>
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
        <Engine checks={checks} />
        <AutoCheck checks={checks} />
        <AppSection />
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
