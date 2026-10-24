"use client";

import { forwardRef } from "react";
import type { AnalyzeResult, Verdict } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import FamilyWarning from "./FamilyWarning";
import { AlertIcon, CheckCircleIcon, StopIcon } from "./Icons";
import SpeakButton from "./SpeakButton";

const STYLES: Record<Verdict, { band: string; border: string; Icon: typeof AlertIcon }> = {
  safe: { band: "bg-safe text-white", border: "border-safe", Icon: CheckCircleIcon },
  suspicious: { band: "bg-warn text-ink", border: "border-warn", Icon: AlertIcon },
  scam: { band: "bg-danger text-white", border: "border-danger", Icon: StopIcon },
};

type Props = { result: AnalyzeResult; isExample: boolean };

const VerdictCard = forwardRef<HTMLHeadingElement, Props>(function VerdictCard({ result, isExample }, titleRef) {
  const { t } = useI18n();
  // Anything that is not exactly "safe" or "scam" is shown as suspicious, never as safe.
  const verdict: Verdict = result.verdict === "safe" || result.verdict === "scam" ? result.verdict : "suspicious";
  const { band, border, Icon } = STYLES[verdict];

  return (
    <article className={`overflow-hidden rounded-2xl border-2 bg-paper ${border}`} aria-live="polite">
      <header className={`flex items-center gap-3 px-5 py-4 ${band}`}>
        <Icon width={36} height={36} />
        <h2 ref={titleRef} tabIndex={-1} className="text-[clamp(1.6rem,3vw,2.2rem)] outline-none">
          {t.verdict.titles[verdict]}
        </h2>
        {isExample && (
          <span className="ms-auto rounded-full bg-paper px-3 py-0.5 text-[14px] font-bold text-ink">{t.verdict.example}</span>
        )}
      </header>

      <div className="flex flex-col gap-6 p-5 sm:p-6">
        <p className="text-[20px] leading-relaxed">{result.explanation_ur}</p>

        <section className="on-dark rounded-xl bg-ink p-5 text-white">
          <h3 className="text-[18px] text-white/70">{t.verdict.whatToDo}</h3>
          <p className="mt-1 text-[20px] font-semibold leading-relaxed">{result.what_to_do_ur}</p>
        </section>

        {result.red_flags.length > 0 && (
          <section className="flex flex-col gap-2">
            <h3 className="text-[16px] text-muted">{t.verdict.flags}</h3>
            <ul className="flex flex-wrap gap-2">
              {result.red_flags.map((flag) => (
                <li key={flag} className="rounded-full bg-tint px-4 py-1 text-[15px] font-semibold">
                  {t.flagLabels[flag as keyof typeof t.flagLabels] ?? flag}
                </li>
              ))}
            </ul>
          </section>
        )}

        {result.evidence.length > 0 && (
          <section className="flex flex-col gap-1">
            <h3 className="text-[16px] text-muted">{t.verdict.evidence}</h3>
            <ul className="border-t-2 border-ink">
              {result.evidence.map((e, i) => (
                <li key={i} dir="auto" className="border-b border-line py-2 text-[15px]">
                  {e.claim}
                  {e.detail ? ` · ${e.detail}` : ""} <span className="text-muted">({e.source})</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="flex flex-wrap gap-3">
          <FamilyWarning text={result.family_warning_ur} />
          <SpeakButton parts={[result.explanation_ur, result.what_to_do_ur]} />
        </div>

        <p className="border-t border-line pt-4 text-[15px] text-muted">{t.verdict.disclaimer}</p>
      </div>
    </article>
  );
});

export default VerdictCard;
