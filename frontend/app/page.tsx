"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Uploader from "@/components/Uploader";
import VerdictCard from "@/components/VerdictCard";
import ScamAlert from "@/components/ScamAlert";
import {
  analyze,
  ApiError,
  getHealth,
  MOCK_RESULTS,
  USE_MOCK,
  type AnalyzeInput,
  type AnalyzeResult,
  type ApiErrorKind,
  type Verdict,
} from "@/lib/api";

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "result"; result: AnalyzeResult; isExample: boolean }
  | { status: "error"; kind: ApiErrorKind };

const ERROR_TEXT: Record<ApiErrorKind, string> = {
  network: "انٹرنیٹ کا مسئلہ لگتا ہے۔ کنکشن چیک کر کے دوبارہ کوشش کریں۔",
  backend_down: "چیک کرنے والا نظام ابھی چل نہیں رہا۔ تھوڑی دیر بعد دوبارہ کوشش کریں۔",
  timeout: "جواب آنے میں بہت دیر ہو گئی۔ دوبارہ کوشش کریں۔",
  server: "ابھی یہ پیغام چیک نہیں ہو سکا۔ دوبارہ کوشش کریں۔",
};

const DEMO_KEYS: Record<string, Verdict> = { "1": "scam", "2": "suspicious", "3": "safe" };

function isTypingTarget(el: EventTarget | null): boolean {
  return el instanceof HTMLElement && (el.tagName === "TEXTAREA" || el.tagName === "INPUT" || el.isContentEditable);
}

export default function Home() {
  const [state, setState] = useState<State>({ status: "idle" });
  const [alertOpen, setAlertOpen] = useState(false);
  const [localMode, setLocalMode] = useState(false);
  const [uploaderKey, setUploaderKey] = useState(0);
  const lastInput = useRef<AnalyzeInput | null>(null);
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
      lastInput.current = input;
      setState({ status: "loading" });
      try {
        showResult(await analyze(input), USE_MOCK);
      } catch (err) {
        setState({ status: "error", kind: err instanceof ApiError ? err.kind : "server" });
      }
    },
    [showResult],
  );

  function reset() {
    lastInput.current = null;
    setAlertOpen(false);
    setState({ status: "idle" });
    setUploaderKey((k) => k + 1);
    window.scrollTo({ top: 0 });
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
        showResult(MOCK_RESULTS[verdict], true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showResult]);

  return (
    <>
      <nav
        aria-label="مرکزی"
        className="on-dark fixed inset-x-0 top-4 z-40 mx-auto flex w-fit max-w-[calc(100%-32px)] items-center gap-4 rounded-full bg-forest py-2 pe-6 ps-2 text-chalk"
      >
        <a href="#top" className="flex items-center gap-3 rounded-full">
          {/* eslint-disable-next-line @next/next/no-img-element -- static svg logo */}
          <img src="/logo.svg" alt="" width={52} height={52} className="rounded-xl" />
          <span className="font-heading text-[24px] font-bold">حفاظت</span>
        </a>
        <a href="#check" className="flex min-h-16 items-center rounded-full px-3 text-[22px] font-bold">
          پیغام چیک کریں
        </a>
      </nav>

      <main id="top" className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 pb-24 pt-32">
        <section className="flex flex-col gap-2 text-center">
          <h1 className="font-urdu-heading text-[36px] font-bold leading-[2.3] sm:text-[52px]">
            مشکوک پیغام؟ پہلے یہاں چیک کریں
          </h1>
          <p className="text-[24px]">اسکرین شاٹ یا پیغام لگائیں۔ ہم آسان اردو میں بتائیں گے کہ یہ دھوکا تو نہیں۔</p>
          {localMode && (
            <p className="mx-auto mt-2 w-fit rounded-full border-2 border-forest px-5 py-1 text-[22px]">
              🔒 آپ کی تصویر آپ کے کمپیوٹر پر ہی رہتی ہے
            </p>
          )}
        </section>

        <section id="check" className="scroll-mt-32">
          {state.status === "idle" && <Uploader key={uploaderKey} onSubmit={run} />}

          {state.status === "loading" && (
            <div className="flex flex-col items-center gap-6 py-16" role="status" aria-live="polite">
              <div className="stud" aria-hidden="true" />
              <p className="text-[28px] font-bold">سوچ رہا ہوں…</p>
            </div>
          )}

          {state.status === "error" && (
            <div role="alert" className="flex flex-col gap-6 rounded-[32px] border-4 border-warn bg-white p-6">
              <h2 className="font-urdu-heading text-[32px] font-bold">معاف کیجیے</h2>
              <p className="text-[26px]">{ERROR_TEXT[state.kind]}</p>
              <p className="text-[22px]">جب تک چیک نہ ہو، اس پیغام کو مشکوک سمجھیں اور کسی کو کوڈ یا پیسے نہ دیں۔</p>
              <div className="flex flex-wrap gap-4">
                {lastInput.current && (
                  <button type="button" className="btn btn-primary" onClick={() => lastInput.current && run(lastInput.current)}>
                    دوبارہ کوشش کریں
                  </button>
                )}
                <button type="button" className="btn btn-secondary" onClick={reset}>
                  نیا پیغام چیک کریں
                </button>
              </div>
            </div>
          )}

          {state.status === "result" && (
            <div className="flex flex-col gap-6">
              <VerdictCard ref={titleRef} result={state.result} isExample={state.isExample} />
              <button type="button" className="btn btn-secondary w-full" onClick={reset}>
                نیا پیغام چیک کریں
              </button>
            </div>
          )}
        </section>
      </main>

      {state.status === "result" && alertOpen && (
        <ScamAlert explanation={state.result.explanation_ur} onDismiss={dismissAlert} />
      )}
    </>
  );
}
