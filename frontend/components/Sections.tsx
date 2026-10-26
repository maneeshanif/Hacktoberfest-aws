"use client";

import type { Checks } from "@/lib/api";
import { RED_FLAG_ORDER } from "@/lib/flags";
import { useI18n } from "@/lib/i18n";
import { useInstall } from "@/lib/useInstall";
import { ChevronIcon, LockIcon, PhoneIcon } from "./Icons";
import StudShield from "./StudShield";

const wrap = "mx-auto w-full max-w-6xl px-4 sm:px-6";

const pad = (n: number) => String(n).padStart(2, "0");

// Seven warning signs as a ruled ledger: one row per sign, not seven identical cards.
export function WhatWeCatch() {
  const { t } = useI18n();
  return (
    <section id="catches" className="py-20 sm:py-28">
      <div className={`${wrap} grid gap-10 lg:grid-cols-[0.8fr_1.4fr] lg:gap-16`}>
        <div className="lg:sticky lg:top-28 lg:self-start">
          <h2 className="text-[clamp(2.2rem,5vw,3.6rem)]">{t.catches.title}</h2>
          <p className="mt-4 max-w-md text-muted">{t.catches.sub}</p>
        </div>
        <div>
          <div className="ledger-rule" />
          <ul>
            {RED_FLAG_ORDER.map((flag, i) => (
              <li key={flag} className="grid grid-cols-[2.5rem_1fr] gap-x-3 border-b border-line py-5">
                <span className="mono pt-1.5 text-[15px] text-muted" aria-hidden="true">
                  {pad(i + 1)}
                </span>
                <div>
                  <h3 className="text-[clamp(1.35rem,2.4vw,1.7rem)] leading-snug">{t.flagLabels[flag]}</h3>
                  <p className="mt-1.5 max-w-xl text-[17px] text-muted">{t.flagHelp[flag]}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export function HowItWorks() {
  const { t } = useI18n();
  return (
    <section id="how" className="bg-forest-soft py-20 sm:py-28">
      <div className={wrap}>
        <h2 className="max-w-xl text-[clamp(2.2rem,5vw,3.6rem)]">{t.how.title}</h2>
        <ol className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
          {t.how.steps.map((step, i) => (
            <li key={step.title} className="flex flex-col gap-4">
              <div className="flex items-center gap-3" aria-hidden="true">
                <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-forest font-display text-[24px] font-extrabold text-lime">
                  {i + 1}
                </span>
                {i < t.how.steps.length - 1 && <span className="hidden flex-1 border-t-[3px] border-dotted border-forest/50 md:block" />}
              </div>
              <h3 className="text-[clamp(1.6rem,2.6vw,2rem)]">{step.title}</h3>
              <p className="max-w-sm text-[17px] text-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

// How the verdict is made: three AI roles, then tools. The tool list reads /api/health, so a check that is not
// switched on this server is shown as off rather than claimed.
export function Engine({ checks }: { checks: Checks | null }) {
  const { t } = useI18n();
  const e = t.engine;
  return (
    <section id="engine" className="bg-forest-soft py-20 sm:py-28">
      <div className={wrap}>
        <h2 className="max-w-2xl text-[clamp(2.2rem,5vw,3.6rem)]">{e.title}</h2>
        <p className="mt-4 max-w-2xl text-muted">{e.sub}</p>

        <ol className="mt-12 grid gap-8 md:grid-cols-3">
          {e.roles.map((role, i) => (
            <li key={role.name} className="flex flex-col gap-3 border-t-[1.5px] border-ink pt-4">
              <span className="mono text-[15px] text-muted" aria-hidden="true">
                {pad(i + 1)}
              </span>
              <h3 className="text-[clamp(1.5rem,2.4vw,1.9rem)]">{role.name}</h3>
              <p className="max-w-sm text-[17px] text-muted">{role.body}</p>
            </li>
          ))}
        </ol>

        <h3 className="mt-16 text-[clamp(1.6rem,3vw,2.2rem)]">{e.toolsTitle}</h3>
        <div className="ledger-rule mt-4" />
        <ul>
          {e.tools.map((tool) => {
            const on = tool.key === "link" ? true : checks ? checks[tool.key as keyof Checks] : false;
            return (
              <li key={tool.key} className="grid gap-x-6 gap-y-2 border-b border-line py-5 md:grid-cols-[14rem_1fr_auto] md:items-start">
                <h4 className="font-display text-[20px] font-bold">{tool.name}</h4>
                <p className="max-w-2xl text-[17px] text-muted">{tool.body}</p>
                <span className={`chip w-fit ${on ? "!bg-lime text-ink" : "text-muted"}`}>
                  <span aria-hidden="true" className={`size-2 rounded-full ${on ? "bg-forest" : "bg-mist"}`} />
                  {on ? e.on : e.off}
                </span>
              </li>
            );
          })}
        </ul>
        <p className="mt-4 max-w-2xl text-[15px] text-muted">{e.note}</p>
      </div>
    </section>
  );
}

// Honest about what a website can and cannot do: it cannot read SMS, so this lists the ways to get close.
export function AutoCheck({ checks }: { checks: Checks | null }) {
  const { t } = useI18n();
  const a = t.auto;
  return (
    <section id="auto" className="py-20 sm:py-28">
      <div className={`${wrap} grid gap-10 lg:grid-cols-[0.9fr_1.4fr] lg:gap-16`}>
        <div className="lg:sticky lg:top-28 lg:self-start">
          <h2 className="text-[clamp(2.2rem,5vw,3.6rem)]">{a.title}</h2>
          <p className="mt-4 max-w-md text-muted">{a.sub}</p>
        </div>
        <div>
          <div className="ledger-rule" />
          <ol>
            {a.options.map((o, i) => (
              <li key={o.title} className="grid grid-cols-[2.5rem_1fr] gap-x-3 border-b border-line py-5">
                <span className="mono pt-1.5 text-[15px] text-muted" aria-hidden="true">
                  {pad(i + 1)}
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="chip !text-[13px]">{o.tag}</span>
                    {/* The webhook is the only option that needs server setup, so show whether this server has it on. */}
                    {i === a.options.length - 1 && (
                      <span className={`chip !text-[13px] ${checks?.listener ? "!bg-lime text-ink" : "text-muted"}`}>
                        <span aria-hidden="true" className={`size-2 rounded-full ${checks?.listener ? "bg-forest" : "bg-mist"}`} />
                        {checks?.listener ? t.engine.on : t.engine.off}
                      </span>
                    )}
                  </div>
                  <h3 className="mt-2 text-[clamp(1.35rem,2.4vw,1.7rem)] leading-snug">{o.title}</h3>
                  <p className="mt-1.5 max-w-xl text-[17px] text-muted">{o.body}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-4 max-w-xl text-[15px] text-muted">{a.note}</p>
        </div>
      </div>
    </section>
  );
}

export function AppSection() {
  const { t } = useI18n();
  const { canInstall, install } = useInstall();
  return (
    <section id="app" className="py-20 sm:py-28">
      <div className={wrap}>
        <div className="on-dark grid gap-10 rounded-2xl bg-ink p-6 text-chalk sm:p-12 lg:grid-cols-[1fr_1.3fr] lg:gap-16">
          <div className="flex flex-col items-start gap-5">
            <span className="flex size-14 items-center justify-center rounded-xl bg-lime text-ink">
              <PhoneIcon width={28} height={28} />
            </span>
            <h2 className="text-[clamp(2rem,4.5vw,3.2rem)]">{t.app.title}</h2>
            <p className="text-chalk/75">{t.app.sub}</p>
            {canInstall ? (
              <button type="button" onClick={install} className="btn btn-primary">
                {t.app.install}
              </button>
            ) : (
              <p className="text-[16px] text-chalk/65">{t.app.ios}</p>
            )}
          </div>
          <ol>
            <li aria-hidden="true">
              <div className="ledger-rule" />
            </li>
            {t.app.steps.map((step, i) => (
              <li key={step.title} className="flex gap-5 border-b border-chalk/20 py-5">
                <span className="font-display text-[40px] font-extrabold leading-none text-lime" aria-hidden="true">
                  {i + 1}
                </span>
                <div>
                  <h3 className="text-[22px]">{step.title}</h3>
                  <p className="mt-1 text-[16px] text-chalk/70">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

// The one lime slab on the page: the privacy promise is the second thing a worried family looks for.
export function Privacy() {
  const { t } = useI18n();
  return (
    <section className="bg-lime py-20 text-ink sm:py-24">
      <div className={`${wrap} flex flex-col gap-8 md:flex-row md:items-center md:gap-14`}>
        <span className="flex size-24 shrink-0 items-center justify-center rounded-2xl bg-forest text-lime">
          <LockIcon width={44} height={44} />
        </span>
        <div className="flex max-w-3xl flex-col gap-4">
          <h2 className="text-[clamp(2rem,4.5vw,3.1rem)]">{t.privacy.title}</h2>
          <p className="text-[18px]">{t.privacy.body}</p>
        </div>
      </div>
    </section>
  );
}

export function Faq() {
  const { t } = useI18n();
  return (
    <section id="faq" className="py-20 sm:py-28">
      <div className={`${wrap} grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-16`}>
        <h2 className="text-[clamp(2.2rem,5vw,3.6rem)]">{t.faq.title}</h2>
        <div>
          <div className="ledger-rule" />
          {t.faq.items.map((item) => (
            <details key={item.q} className="group border-b border-line">
              <summary className="flex items-center justify-between gap-6 py-5 text-[20px] font-bold">
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
    <footer className="on-dark bg-forest py-12 pb-[max(3rem,env(safe-area-inset-bottom))] text-chalk">
      <div className={`${wrap} flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between`}>
        <div className="flex items-center gap-4">
          <StudShield size={56} className="text-chalk" />
          <p className="font-display text-[22px] font-extrabold">{t.footer.line}</p>
        </div>
        <p className="max-w-md text-[15px] text-chalk/70">{t.footer.note}</p>
      </div>
    </footer>
  );
}
