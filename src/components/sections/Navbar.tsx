import { useEffect, useState } from "react";
import { useLang } from "@/i18n";
import { cn } from "@/lib/utils";
import { openOmarchy } from "@/components/omarchy/events";
import { SECTIONS as ITEMS } from "@/data/sections";
import { HintLabel, useCoarsePointer } from "@/components/ui/OmarchyHint";

const focusRing =
  "outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-phosphor";

export default function Navbar() {
  const { lang, t, setLang } = useLang();
  const [open, setOpen] = useState(false);
  const coarse = useCoarsePointer();

  // Close the mobile panel on Escape or when the viewport grows past the breakpoint.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const mq = window.matchMedia("(min-width: 768px)");
    const onMq = () => mq.matches && setOpen(false);
    window.addEventListener("keydown", onKey);
    mq.addEventListener("change", onMq);
    return () => {
      window.removeEventListener("keydown", onKey);
      mq.removeEventListener("change", onMq);
    };
  }, [open]);

  const toggleLang = () => setLang(lang === "en" ? "es" : "en");

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-bone/20 bg-bg/75 backdrop-blur-md">
      <nav
        aria-label={t.nav.sections}
        className="mx-auto flex flex-wrap items-center gap-x-3 px-4 md:gap-x-4 lg:h-14 lg:flex-nowrap lg:px-8"
      >
        {/* Logotype */}
        <a
          href="#home"
          className={cn("flex h-12 shrink-0 items-center gap-3 lg:h-auto", focusRing)}
          onClick={() => setOpen(false)}
        >
          <span className="inline-block -skew-x-12 font-mono text-base font-bold italic tracking-[0.15em] text-bone">
            {t.nav.brand}
          </span>
          <span aria-hidden="true" className="hidden h-4 w-px bg-bone/40 lg:block" />
          <span className="hidden font-mono text-[10px] tracking-widest text-bone/60 lg:inline">{t.nav.est}</span>
        </a>

        {/* Desktop items */}
        <ul className="ml-auto hidden items-center gap-1 md:flex lg:gap-2">
          {ITEMS.map((id) => (
            <li key={id}>
              <a
                href={`#${id}`}
                className={cn(
                  "block px-1.5 py-1 font-mono text-[10px] tracking-widest whitespace-nowrap text-bone/75 transition-colors hover:text-phosphor lg:px-2 lg:text-[11px]",
                  focusRing,
                )}
              >
                {t.nav[id]}
              </a>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={toggleLang}
          className={cn(
            "hidden shrink-0 border border-bone/30 px-2 py-1 font-mono text-[10px] tracking-widest text-bone transition-colors hover:border-phosphor hover:text-phosphor md:block lg:text-[11px]",
            focusRing,
          )}
        >
          {t.nav.lang}
        </button>

        {/* Mobile menu toggle */}
        <button
          type="button"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((o) => !o)}
          className={cn(
            "ml-auto flex h-8 items-center gap-2 border border-bone/30 px-2 font-mono text-[10px] tracking-widest text-bone md:hidden",
            focusRing,
          )}
        >
          <span aria-hidden="true" className="flex w-3.5 flex-col gap-[3px]">
            <span className={cn("h-px bg-current transition-transform", open && "translate-y-[4px] rotate-45")} />
            <span className={cn("h-px bg-current transition-opacity", open && "opacity-0")} />
            <span className={cn("h-px bg-current transition-transform", open && "-translate-y-[4px] -rotate-45")} />
          </span>
          {open ? t.nav.close : t.nav.menu}
        </button>

        {/* Omarchy hint: inline on desktop, full-width warning strip below lg */}
        <div className="order-last -mx-4 w-[calc(100%+2rem)] border-t border-alert/40 lg:order-none lg:mx-0 lg:w-auto lg:border-0">
          <button
            type="button"
            data-testid="omarchy-hint"
            data-omarchy-hint=""
            onClick={openOmarchy}
            className={cn(
              "hint-blink group relative flex h-8 w-full items-center justify-center gap-2 px-3 font-mono text-[10px] font-bold tracking-widest whitespace-nowrap text-alert transition-colors hover:bg-alert hover:text-bg lg:w-auto lg:border lg:border-alert/70 lg:text-[11px]",
              focusRing,
            )}
          >
            <HintLabel text={coarse ? t.nav.hintTouch : t.nav.hint} />
          </button>
        </div>
      </nav>

      {/* Mobile panel */}
      <nav
        id="mobile-nav"
        aria-label={t.nav.menu}
        hidden={!open}
        className="border-t border-bone/20 bg-bg/95 px-4 pb-5 pt-3 md:hidden"
      >
        <ul className="flex flex-col">
          {ITEMS.map((id) => (
            <li key={id} className="border-b border-bone/10">
              <a
                href={`#${id}`}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center justify-between py-3 font-mono text-xs tracking-widest text-bone/85 hover:text-phosphor",
                  focusRing,
                )}
              >
                {t.nav[id]}
                <span aria-hidden="true" className="text-bone/30">▸</span>
              </a>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={toggleLang}
          className={cn(
            "mt-4 w-full border border-bone/30 py-2.5 font-mono text-xs tracking-widest text-bone hover:border-phosphor hover:text-phosphor",
            focusRing,
          )}
        >
          {t.nav.lang}
        </button>
      </nav>
    </header>
  );
}
