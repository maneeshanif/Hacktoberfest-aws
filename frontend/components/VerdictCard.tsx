"use client";

import { forwardRef } from "react";
import type { AnalyzeResult, Verdict } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import FamilyWarning from "./FamilyWarning";
import { AlertIcon, CheckCircleIcon, LinkIcon, StopIcon } from "./Icons";
import SpeakButton from "./SpeakButton";

// Solid verdict colour with the text colour that passes AA on it: ink on green and orange, white on red.
const STYLES: Record<Verdict, { block: string; Icon: typeof AlertIcon }> = {
  safe: { block: "bg-safe text-ink", Icon: CheckCircleIcon },
  suspicious: { block: "bg-warn text-ink", Icon: AlertIcon },
  scam: { block: "bg-danger text-white", Icon: StopIcon },
};
const ORDER: Verdict[] = ["safe", "suspicious", "scam"];

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

type Props = { result: AnalyzeResult; isExample: boolean };

const VerdictCard = forwardRef<HTMLHeadingElement, Props>(function VerdictCard({ result, isExample }, titleRef) {
  const { t } = useI18n();
  // Anything that is not exactly "safe" or "scam" is shown as suspicious, never as safe.
  const verdict: Verdict = result.verdict === "safe" || result.verdict === "scam" ? result.verdict : "suspicious";
  const { block, Icon } = STYLES[verdict];

  const checksRan = result.checks_run ?? [];
  const web = result.evidence.filter((e) => e.source === "tavily");
  const local = result.evidence.filter((e) => e.source !== "tavily");
  // A check "found something" when it left evidence. A web search that only says "no reports" (no URL) found nothing.
  const foundBy = (key: string) =>
    key === "web_search" ? web.some((e) => e.detail) : result.evidence.some((e) => e.source === key && key !== "local_allowlist");

  return (
    <article className="rise flex flex-col gap-5" aria-live="polite">
      <header className={`rounded-2xl p-6 sm:p-8 ${block}`}>
        <div className="flex items-center gap-4">
          <Icon width={52} height={52} className="shrink-0" />
          <h2 ref={titleRef} tabIndex={-1} className="text-[clamp(2.1rem,6vw,3.2rem)] outline-none">
            {t.verdict.titles[verdict]}
          </h2>
          {isExample && <span className="chip ms-auto !bg-paper !text-ink">{t.verdict.example}</span>}
        </div>

        {/* Qualitative meter on the stud grid: three studs, the verdict's stud is the big one. No invented percentages. */}
        <div className="mt-5 flex items-end gap-6" role="img" aria-label={t.verdict.meter[verdict]}>
          {ORDER.map((v) => (
            <div key={v} className="flex items-center gap-2">
              <span className={`rounded-full bg-current ${v === verdict ? "size-7" : "size-3.5 opacity-35"}`} />
              <span className={`font-mono text-[13px] ${v === verdict ? "font-semibold" : "opacity-70"}`}>{t.verdict.meter[v]}</span>
            </div>
          ))}
        </div>

        <p className="mt-5 text-[clamp(1.3rem,2.6vw,1.6rem)] font-medium leading-relaxed">{result.explanation_ur}</p>
      </header>

      <section className="on-dark rounded-2xl bg-forest p-6 text-chalk sm:p-8">
        <h3 className="font-mono text-[14px] font-medium uppercase tracking-wider text-lime">{t.verdict.whatToDo}</h3>
        <p className="mt-2 font-display text-[clamp(1.4rem,3vw,1.9rem)] font-bold leading-snug">{result.what_to_do_ur}</p>
      </section>

      {result.red_flags.length > 0 && (
        <section>
          <h3 className="mb-3 font-mono text-[14px] font-medium uppercase tracking-wider text-muted">{t.verdict.flags}</h3>
          <div className="ledger-rule" />
          <ul>
            {result.red_flags.map((flag, i) => {
              const key = flag as keyof typeof t.flagLabels;
              return (
                <li key={flag} className="flex gap-4 border-b border-line py-4">
                  <span className="mono mt-1 w-7 shrink-0 text-[15px] text-muted" aria-hidden="true">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <span className="font-display text-[20px] font-bold leading-snug">{t.flagLabels[key] ?? flag}</span>
                    {t.flagHelp[key] && <span className="mt-0.5 block text-[16px] text-muted">{t.flagHelp[key]}</span>}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {(result.evidence.length > 0 || checksRan.length > 0) && (
        <section>
          <h3 className="mb-3 font-mono text-[14px] font-medium uppercase tracking-wider text-muted">{t.verdict.evidence}</h3>

          {/* Which checks actually ran and what each found: "no match" is shown only for a check that really happened. */}
          {checksRan.length > 0 && (
            <ul className="mb-4 flex flex-wrap gap-2" aria-label={t.verdict.checksRan}>
              {checksRan.map((key) => {
                const found = foundBy(key);
                return (
                  <li key={key} className={`chip !text-[13px] ${found ? "!bg-warn-soft !text-ink" : "!bg-safe-soft !text-ink"}`}>
                    <span aria-hidden="true" className={`size-2 rounded-full ${found ? "bg-warn" : "bg-safe"}`} />
                    {t.verdict.sources[key] ?? key}: {found ? t.verdict.foundIssue : t.verdict.clean}
                  </li>
                );
              })}
            </ul>
          )}

          <div className="ledger-rule" />
          <ul>
            {[...local, ...web].map((e, i) => (
              <li key={i} dir="auto" className="flex items-start gap-3 border-b border-line py-3.5 text-[16px]">
                <LinkIcon width={18} height={18} className="mt-1 shrink-0 text-lime-deep" />
                <span className="min-w-0 flex-1 break-words">
                  {e.claim}
                  {/* Only web-report URLs are clickable. A scam link from the message is shown as plain text, never as a link. */}
                  {e.detail && e.source === "tavily" && /^https?:\/\//.test(e.detail) ? (
                    <a
                      href={e.detail}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      dir="ltr"
                      className="mono mt-0.5 block truncate text-[14px] text-forest underline underline-offset-2"
                      aria-label={`${t.verdict.openReport}: ${hostOf(e.detail)}`}
                    >
                      {hostOf(e.detail)} ↗
                    </a>
                  ) : (
                    e.detail && <span className="mono block truncate text-[14px] text-muted">{e.detail}</span>
                  )}
                </span>
                <span className="chip shrink-0">{t.verdict.sources[e.source] ?? e.source}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex flex-wrap gap-3">
        <FamilyWarning text={result.family_warning_ur} />
        <SpeakButton parts={[result.explanation_ur, result.what_to_do_ur]} />
      </div>

      <p className="text-[15px] text-muted">{t.verdict.disclaimer}</p>
    </article>
  );
});

export default VerdictCard;
