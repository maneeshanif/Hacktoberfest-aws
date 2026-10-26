"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useInstall } from "@/lib/useInstall";
import { CloseIcon, MenuIcon } from "./Icons";
import StudShield from "./StudShield";

export default function Nav() {
  const { t, toggle } = useI18n();
  const { canInstall, install } = useInstall();
  const [open, setOpen] = useState(false);

  const links = [
    ["#how", t.nav.howItWorks],
    ["#catches", t.nav.catches],
    ["#faq", t.nav.faq],
  ];

  return (
    <header className="fixed inset-x-0 top-0 z-40 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6">
      <nav aria-label={t.nav.label} className="mx-auto max-w-6xl rounded-[28px] border-[1.5px] border-ink bg-chalk">
        <div className="flex h-16 items-center gap-2 px-3 sm:px-4">
          <a href="#top" className="flex items-center gap-2.5 rounded-full font-display text-[23px] font-extrabold tracking-tight">
            <StudShield tile size={38} className="text-chalk" />
            Hifazat
          </a>

          <div className="ms-4 hidden items-center gap-1 md:flex">
            {links.map(([href, label]) => (
              <a key={href} href={href} className="rounded-full px-3.5 py-2 text-[16px] font-semibold text-muted hover:bg-tint hover:text-ink">
                {label}
              </a>
            ))}
          </div>

          <div className="ms-auto flex items-center gap-1.5">
            <button
              type="button"
              onClick={toggle}
              aria-label={t.switchToLabel}
              className="rounded-full px-3.5 py-2 text-[16px] font-bold hover:bg-tint"
            >
              {t.switchTo}
            </button>
            {canInstall && (
              <button type="button" onClick={install} className="btn btn-secondary hidden !min-h-11 !py-1 sm:inline-flex">
                {t.nav.install}
              </button>
            )}
            <a href="#check" className="btn btn-primary hidden !min-h-11 !py-1 sm:inline-flex">
              {t.nav.cta}
            </a>
            <button
              type="button"
              className="flex size-11 items-center justify-center rounded-full hover:bg-tint md:hidden"
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={t.nav.menu}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>

        {open && (
          <div id="mobile-menu" className="flex flex-col gap-1 border-t-[1.5px] border-ink p-3 md:hidden">
            {links.map(([href, label]) => (
              <a
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="rounded-2xl px-4 py-3 text-[19px] font-semibold hover:bg-tint"
              >
                {label}
              </a>
            ))}
            <a href="#check" onClick={() => setOpen(false)} className="btn btn-primary mt-1 w-full">
              {t.nav.cta}
            </a>
            {canInstall && (
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  install();
                }}
                className="btn btn-secondary w-full"
              >
                {t.nav.install}
              </button>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}
