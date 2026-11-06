import { useRef } from "react";
import { gsap } from "@/lib/motion/gsap";
import { useScrollFx } from "@/lib/motion/useScrollFx";

/**
 * Text whose words light up from dim grey to white as it scrolls through the viewport.
 * The words stay real text (one span each, spaces between), so it reads as one sentence.
 */
export default function ScrollRevealText({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const words = text.split(/\s+/).filter(Boolean);

  useScrollFx(
    ref,
    ({ el }) => {
      const spans = el.querySelectorAll<HTMLElement>("[data-word]");
      gsap.fromTo(
        spans,
        { color: "rgb(64, 64, 64)" },
        {
          color: "rgb(245, 245, 245)",
          ease: "none",
          stagger: 0.1,
          scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 50%", scrub: true },
        },
      );
    },
    [text],
  );

  return (
    <span ref={ref} className={className}>
      {words.map((w, i) => (
        <span key={i}>
          <span data-word>{w}</span>
          {i < words.length - 1 && " "}
        </span>
      ))}
    </span>
  );
}
