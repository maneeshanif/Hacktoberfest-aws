"use client";

import { useI18n } from "@/lib/i18n";
import { StopIcon } from "./Icons";
import StudShield from "./StudShield";

// Static illustration for the hero: a scam SMS and what Hifazat says about it. Always labelled as an example.
// The big stud shield behind the phone is the brand mark; its lime check is the "verified by Hifazat" signal.
export default function PhoneDemo() {
  const { t } = useI18n();
  const d = t.hero.demo;
  return (
    <div className="relative mx-auto aspect-[4/5] w-full max-w-[440px]" aria-hidden="true">
      {/* The shield sits top-right so its lime check stays visible; the phone overlaps its lower-left. */}
      <StudShield size={420} className="absolute end-0 top-0 h-auto w-[92%] text-chalk" />

      <div className="absolute bottom-0 start-0 w-[64%] max-w-[300px] -rotate-2 rounded-[40px] border-[9px] border-ink bg-chalk p-3">
        <div className="mx-auto mb-3 h-1.5 w-14 rounded-full bg-ink/80" />
        <p className="px-1 pb-2 text-center font-mono text-[11px] font-medium text-muted">{d.from}</p>
        <div className="rise rounded-[18px] rounded-es-md bg-white p-3.5 text-[14px] leading-snug text-ink" dir="auto">
          {d.sms}
        </div>

        <div className="rise mt-3 rounded-[18px] bg-danger p-3.5 text-white [animation-delay:350ms]">
          <div className="flex items-center gap-2">
            <StopIcon width={24} height={24} />
            <span className="font-display text-[16px] font-bold">{d.verdict}</span>
          </div>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {d.flags.map((f) => (
              <span key={f} className="rounded-full bg-white px-2.5 py-0.5 font-mono text-[11px] font-medium text-ink">
                {f}
              </span>
            ))}
          </div>
        </div>

        <p className="mt-3 pb-1 text-center font-mono text-[11px] font-medium text-muted">Hifazat · {d.caption}</p>
      </div>
    </div>
  );
}
