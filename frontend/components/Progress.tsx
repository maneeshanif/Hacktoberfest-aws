"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { CheckIcon } from "./Icons";
import StudShield from "./StudShield";

// Steps advance on a timer and wait on the last one, so the user always sees something moving while Gemma works.
// The stud shield sweeps violet (live) while the steps tick: the grid itself is the progress indicator.
export default function Progress() {
  const { t } = useI18n();
  const steps = t.checker.steps;
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setActive((a) => Math.min(a + 1, steps.length - 1)), 3500);
    return () => clearInterval(id);
  }, [steps.length]);

  return (
    <div className="flex flex-col items-center gap-6 rounded-2xl bg-tint p-6 sm:flex-row sm:gap-10 sm:p-8" role="status" aria-live="polite">
      <StudShield scan size={150} className="shrink-0 text-ink" />
      <div className="w-full">
        <p className="mb-4 font-display text-[24px] font-extrabold">{t.checker.loading}</p>
        <div className="ledger-rule" />
        <ol>
          {steps.map((label, i) => {
            const done = i < active;
            const current = i === active;
            return (
              <li
                key={label}
                className={`flex items-center gap-3 border-b border-line py-3 text-[18px] ${done || current ? "text-ink" : "text-muted/70"}`}
              >
                <span
                  className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
                    done ? "bg-forest text-lime" : current ? "bg-violet text-white" : "bg-line"
                  }`}
                  aria-hidden="true"
                >
                  {done ? <CheckIcon width={18} height={18} /> : current ? <span className="stud !size-3 !bg-white" /> : null}
                </span>
                <span className={current ? "font-bold" : ""}>{label}</span>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
