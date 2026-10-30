import { useEffect, useState } from "react";

/** Four-square Super/Windows key glyph (JetBrains Mono has no "⊞"). */
function SuperKey() {
  return (
    <svg aria-hidden="true" viewBox="0 0 12 12" className="inline-block size-[1.1em] shrink-0 align-[-0.15em]">
      <rect x="0.5" y="0.5" width="11" height="11" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1" />
      <rect x="3" y="3" width="2.6" height="2.6" fill="currentColor" />
      <rect x="6.4" y="3" width="2.6" height="2.6" fill="currentColor" />
      <rect x="3" y="6.4" width="2.6" height="2.6" fill="currentColor" />
      <rect x="6.4" y="6.4" width="2.6" height="2.6" fill="currentColor" />
    </svg>
  );
}

/** Renders the dictionary hint copy, swapping the "⊞" glyph for the SVG key. */
export function HintLabel({ text }: { text: string }) {
  const [before, after] = text.split("⊞");
  if (after === undefined) return <>{text}</>;
  return (
    <>
      {/* The spaces live inside the spans so the content-derived name reads "… PRESS SUPER". */}
      <span>{before.trimEnd()} </span>
      <SuperKey />
      <span> {after.trimStart()}</span>
    </>
  );
}

/**
 * True on touch-first devices (`(pointer: coarse)`). Server and first client render return false,
 * so SSR markup shows the keyboard hint and the touch copy swaps in after mount.
 */
export function useCoarsePointer(): boolean {
  const [coarse, setCoarse] = useState(false);
  useEffect(() => {
    let mq: MediaQueryList;
    try {
      mq = window.matchMedia("(pointer: coarse)");
    } catch {
      return;
    }
    const sync = () => setCoarse(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return coarse;
}
