import { useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/motion/gsap";
import { useScrollFx } from "@/lib/motion/useScrollFx";
import { cn } from "@/lib/utils";

/**
 * Endless band of labels. Drifts left, flips direction with the scroll direction and speeds up
 * with scroll velocity; pauses under the pointer. Static wrapped row without motion.
 */
export default function Marquee({
  items,
  speed = 40,
  className,
  ...rest
}: { items: string[]; speed?: number; className?: string } & Record<
  `data-${string}`,
  string
>) {
  const ref = useRef<HTMLDivElement>(null);

  useScrollFx(
    ref,
    ({ el }) => {
      const track = el.querySelector<HTMLElement>("[data-marquee-track]");
      if (!track) return;
      el.dataset.moving = "";
      const half = () => track.scrollWidth / 2;
      let x = 0;
      let dir = -1;
      let boost = 0;
      let paused = false;
      const tick = (_t: number, dt: number) => {
        if (paused) return;
        x += dir * (speed + boost) * (dt / 1000);
        boost *= 0.92;
        const w = half();
        if (w > 0) x = ((x % w) - w) % w; // keep within (-w, 0]
        gsap.set(track, { x });
      };
      gsap.ticker.add(tick);
      const st = ScrollTrigger.create({
        trigger: el,
        start: "top bottom",
        end: "bottom top",
        onUpdate: (self) => {
          dir = self.direction > 0 ? -1 : 1;
          boost = Math.min(400, Math.abs(self.getVelocity()) / 6);
        },
      });
      const enter = () => (paused = true);
      const leave = () => (paused = false);
      el.addEventListener("pointerenter", enter);
      el.addEventListener("pointerleave", leave);
      return () => {
        gsap.ticker.remove(tick);
        st.kill();
        el.removeEventListener("pointerenter", enter);
        el.removeEventListener("pointerleave", leave);
      };
    },
    [items.join("|"), speed],
  );

  const row = (copy: number) =>
    items.map((it, i) => (
      <li
        key={`${copy}-${i}`}
        aria-hidden={copy > 0 || undefined}
        className={cn(
          "flex shrink-0 items-center gap-6 pr-6",
          copy > 0 && "hidden group-data-[moving]/marquee:flex",
        )}
      >
        <span className="whitespace-nowrap">{it}</span>
        <span aria-hidden="true" className="size-1.5 rotate-45 bg-bone/50" />
      </li>
    ));

  return (
    <div
      ref={ref}
      className={cn("group/marquee overflow-hidden", className)}
      {...rest}
    >
      <ul
        data-marquee-track
        className="flex flex-wrap gap-y-2 group-data-[moving]/marquee:w-max group-data-[moving]/marquee:flex-nowrap"
      >
        {row(0)}
        {row(1)}
      </ul>
    </div>
  );
}
