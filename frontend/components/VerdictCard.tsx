"use client";

import { forwardRef } from "react";
import type { AnalyzeResult, Verdict } from "@/lib/api";
import { flagLabel } from "@/lib/flags";
import FamilyWarning from "./FamilyWarning";
import SpeakButton from "./SpeakButton";

const STYLES: Record<Verdict, { band: string; border: string; icon: string; title: string }> = {
  safe: { band: "bg-safe text-ink", border: "border-safe", icon: "✅", title: "ٹھیک لگتا ہے" },
  suspicious: { band: "bg-warn text-ink", border: "border-warn", icon: "⚠️", title: "مشکوک ہے" },
  scam: { band: "bg-danger text-white", border: "border-danger", icon: "🚨", title: "دھوکا ہو سکتا ہے" },
};

type Props = { result: AnalyzeResult; isExample: boolean };

const VerdictCard = forwardRef<HTMLHeadingElement, Props>(function VerdictCard({ result, isExample }, titleRef) {
  // Anything that is not exactly "safe" or "scam" is shown as suspicious, never as safe.
  const verdict: Verdict = result.verdict === "safe" || result.verdict === "scam" ? result.verdict : "suspicious";
  const s = STYLES[verdict];

  return (
    <article className={`overflow-hidden rounded-[32px] border-4 bg-white ${s.border}`} aria-live="polite">
      <header className={`flex items-center gap-4 px-6 py-4 ${s.band}`}>
        <span aria-hidden="true" className="text-5xl">
          {s.icon}
        </span>
        <h2 ref={titleRef} tabIndex={-1} className="font-urdu-heading text-[40px] font-bold leading-[2.2]">
          {s.title}
        </h2>
        {isExample && (
          <span className="ms-auto rounded-full bg-white px-4 py-1 text-[20px] font-bold text-ink">نمونہ · Example</span>
        )}
      </header>

      <div className="flex flex-col gap-6 p-6">
        <p className="text-[26px] leading-[2]">{result.explanation_ur}</p>

        <section className="on-dark rounded-3xl bg-forest p-6 text-chalk">
          <h3 className="font-urdu-heading text-[28px] font-bold text-lime">اب کیا کریں</h3>
          <p className="text-[26px] leading-[2]">{result.what_to_do_ur}</p>
        </section>

        {result.red_flags.length > 0 && (
          <ul className="flex flex-wrap gap-3" aria-label="خطرے کی نشانیاں">
            {result.red_flags.map((flag) => (
              <li key={flag} className="rounded-full border-2 border-ink bg-chalk px-4 py-1 font-mono text-[20px]">
                {flagLabel(flag)}
              </li>
            ))}
          </ul>
        )}

        {result.evidence.length > 0 && (
          <section className="flex flex-col gap-2">
            <h3 className="font-urdu-heading text-[28px] font-bold">ثبوت</h3>
            <div className="ledger" aria-hidden="true" />
            <ul className="flex flex-col gap-3">
              {result.evidence.map((e, i) => (
                <li key={i} dir="auto" className="border-b-2 border-mist pb-2 font-mono text-[20px]">
                  {e.claim} · {e.detail} <span className="text-ink/80">({e.source})</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="flex flex-wrap gap-4">
          <FamilyWarning text={result.family_warning_ur} />
          <SpeakButton parts={[result.explanation_ur, result.what_to_do_ur]} />
        </div>

        <p className="border-t-2 border-mist pt-4 text-[22px]">
          یہ دوسری رائے ہے، حتمی فیصلہ نہیں۔ شک ہو تو گھر والوں سے پوچھیں۔
        </p>
      </div>
    </article>
  );
});

export default VerdictCard;
