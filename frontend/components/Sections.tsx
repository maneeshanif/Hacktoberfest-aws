"use client";

import { RED_FLAG_ORDER } from "@/lib/flags";
import { useI18n } from "@/lib/i18n";
import { ChevronIcon, LockIcon } from "./Icons";

const wrap = "mx-auto w-full max-w-6xl px-4 sm:px-6";

export function WhatWeCatch() {
  const { t } = useI18n();
  return (
    <section id="catches" className="py-20 sm:py-28">
      <div className={`${wrap} grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-16`}>
        <div className="lg:sticky lg:top-28 lg:self-start">
          <h2 className="text-[clamp(2rem,4vw,3rem)]">{t.catches.title}</h2>
          <p className="mt-4 max-w-md text-muted">{t.catches.sub}</p>
        </div>
        <ul className="border-t-2 border-ink">
          {RED_FLAG_ORDER.map((flag) => (
            <li key={flag} className="grid gap-1 border-b border-line py-5 sm:grid-cols-[1fr_1.2fr] sm:gap-8">
              <h3 className="text-[20px] leading-snug">{t.flagLabels[flag]}</h3>
              <p className="text-muted">{t.flagHelp[flag]}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function HowItWorks() {
  const { t } = useI18n();
  return (
    <section id="how" className="bg-tint py-20 sm:py-28">
      <div className={wrap}>
        <h2 className="max-w-xl text-[clamp(2rem,4vw,3rem)]">{t.how.title}</h2>
        <ol className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
          {t.how.steps.map((step, i) => (
            <li key={step.title} className="flex flex-col gap-3 border-t-2 border-ink pt-5">
              <span className="text-[56px] font-extrabold leading-none text-blue" aria-hidden="true">
                {i + 1}
              </span>
              <h3 className="text-[24px]">{step.title}</h3>
              <p className="text-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function Privacy() {
  const { t } = useI18n();
  return (
    <section className="py-20 sm:py-28">
      <div className={wrap}>
        <div className="on-dark flex flex-col gap-6 rounded-[32px] bg-ink p-8 text-white sm:p-14 md:flex-row md:items-center md:gap-14">
          <span className="flex size-20 shrink-0 items-center justify-center rounded-3xl bg-blue text-white">
            <LockIcon width={40} height={40} />
          </span>
          <div className="flex max-w-2xl flex-col gap-3">
            <h2 className="text-[clamp(1.8rem,3.5vw,2.6rem)]">{t.privacy.title}</h2>
            <p className="text-white/80">{t.privacy.body}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Faq() {
  const { t } = useI18n();
  return (
    <section id="faq" className="pb-20 sm:pb-28">
      <div className={`${wrap} grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-16`}>
        <h2 className="text-[clamp(2rem,4vw,3rem)]">{t.faq.title}</h2>
        <div className="border-t-2 border-ink">
          {t.faq.items.map((item) => (
            <details key={item.q} className="group border-b border-line">
              <summary className="flex items-center justify-between gap-6 py-5 text-[19px] font-bold">
                {item.q}
                <ChevronIcon className="chev shrink-0 transition-transform" />
              </summary>
              <p className="max-w-xl pb-6 text-muted">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  const { t } = useI18n();
  return (
    <footer className="border-t border-line py-10">
      <div className={`${wrap} flex flex-col gap-1 text-[15px] text-muted sm:flex-row sm:justify-between`}>
        <p className="font-bold text-ink">{t.footer.line}</p>
        <p>{t.footer.note}</p>
      </div>
    </footer>
  );
}
