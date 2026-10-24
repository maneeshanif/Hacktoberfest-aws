"use client";

import { useI18n } from "@/lib/i18n";
import { ShieldIcon } from "./Icons";

export default function Nav() {
  const { t, toggle } = useI18n();
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper">
      <nav aria-label={t.nav.label} className="mx-auto flex h-[72px] w-full max-w-6xl items-center gap-4 px-4 sm:px-6">
        <a href="#top" className="flex items-center gap-2 rounded-full text-[22px] font-extrabold tracking-tight">
          <span className="flex size-9 items-center justify-center rounded-xl bg-blue text-white">
            <ShieldIcon width={22} height={22} />
          </span>
          Hifazat
        </a>

        <div className="ms-6 hidden items-center gap-1 md:flex">
          {[
            ["#how", t.nav.howItWorks],
            ["#catches", t.nav.catches],
            ["#faq", t.nav.faq],
          ].map(([href, label]) => (
            <a key={href} href={href} className="rounded-full px-4 py-2 text-[16px] font-semibold text-muted hover:text-ink">
              {label}
            </a>
          ))}
        </div>

        <div className="ms-auto flex items-center gap-2">
          <button
            type="button"
            onClick={toggle}
            aria-label={t.switchToLabel}
            className="rounded-full px-4 py-2 text-[16px] font-bold hover:bg-tint"
          >
            {t.switchTo}
          </button>
          <a href="#check" className="btn btn-primary hidden !min-h-11 !py-1 sm:inline-flex">
            {t.nav.cta}
          </a>
        </div>
      </nav>
    </header>
  );
}
