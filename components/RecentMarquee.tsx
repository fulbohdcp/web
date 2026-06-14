"use client";

import { Children, Fragment, useEffect, useRef } from "react";

// Horizontally auto-scrolling figurita row. Unlike a pure CSS marquee, this
// uses real scroll so the user can drag/swipe it manually; the auto-scroll
// pauses while they interact (touch, wheel, hover) and resumes after a pause.
export function RecentMarquee({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const pauseUntil = useRef(0);
  const hovering = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let last = 0;
    const tick = (now: number) => {
      if (last && !hovering.current && now >= pauseUntil.current) {
        const dt = now - last;
        el.scrollLeft += (dt / 16) * 0.7;
        const half = el.scrollWidth / 2;
        if (half > 0 && el.scrollLeft >= half) el.scrollLeft -= half;
      }
      last = now;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const pause = () => {
      pauseUntil.current = performance.now() + 2500;
    };
    const enter = () => {
      hovering.current = true;
    };
    const leave = () => {
      hovering.current = false;
    };

    el.addEventListener("pointerdown", pause);
    el.addEventListener("touchmove", pause, { passive: true });
    el.addEventListener("wheel", pause, { passive: true });
    el.addEventListener("mouseenter", enter);
    el.addEventListener("mouseleave", leave);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointerdown", pause);
      el.removeEventListener("touchmove", pause);
      el.removeEventListener("wheel", pause);
      el.removeEventListener("mouseenter", enter);
      el.removeEventListener("mouseleave", leave);
    };
  }, []);

  // duplicate the list so the loop is seamless (reset at half width)
  const items = Children.toArray(children);
  return (
    <div
      ref={ref}
      className="flex gap-4 overflow-x-auto overflow-y-hidden py-5 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {items}
      {items.map((c, i) => (
        <Fragment key={`dup-${i}`}>{c}</Fragment>
      ))}
    </div>
  );
}
