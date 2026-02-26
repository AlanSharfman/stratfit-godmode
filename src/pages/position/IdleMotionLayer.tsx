import React, { useEffect, useRef } from "react";

/* ─────────────────────────────────────────────────────────────────────
   IDLE MOTION LAYER — Position V2 God Mode
   Adds ultra-subtle "alive" cues to the terrain viewport:
     A) Micro-motion: gentle Y translation on the canvas wrapper
     B) Focal spotlight: breathing radial glow near peak area
   Pure CSS + rAF. No deps. No camera changes. Respects prefers-reduced-motion.
   Kill switch: ENABLE_IDLE_MOTION
   ───────────────────────────────────────────────────────────────────── */

// ── Kill switch ──
const ENABLE_IDLE_MOTION = true;

// ── Tuning constants ──
const IDLE_AMPLITUDE = 0.35;       // px – vertical breathing displacement
const IDLE_PERIOD_MS = 11_000;     // sine cycle duration
const SPOTLIGHT_MIN = 0.08;        // min opacity
const SPOTLIGHT_MAX = 0.16;        // max opacity
const SPOTLIGHT_PERIOD_MS = 9_000; // slightly offset from idle period

interface Props {
  /** Ref to the terrain viewport wrapper — micro-motion applies translateY here */
  viewportRef: React.RefObject<HTMLDivElement | null>;
}

export default function IdleMotionLayer({ viewportRef }: Props) {
  const spotRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!ENABLE_IDLE_MOTION) return;

    // Respect prefers-reduced-motion
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) return;

    let active = true;
    const start = performance.now();

    function tick(now: number) {
      if (!active) return;
      const elapsed = now - start;

      // A) Micro-motion — ultra-subtle Y sine wave
      if (viewportRef.current) {
        const phase = (elapsed % IDLE_PERIOD_MS) / IDLE_PERIOD_MS;
        const y = Math.sin(phase * Math.PI * 2) * IDLE_AMPLITUDE;
        viewportRef.current.style.transform = `translateY(${y.toFixed(3)}px)`;
      }

      // B) Focal spotlight breathing
      if (spotRef.current) {
        const phase = (elapsed % SPOTLIGHT_PERIOD_MS) / SPOTLIGHT_PERIOD_MS;
        const t = (Math.sin(phase * Math.PI * 2) + 1) / 2; // 0..1
        const opacity = SPOTLIGHT_MIN + t * (SPOTLIGHT_MAX - SPOTLIGHT_MIN);
        spotRef.current.style.opacity = opacity.toFixed(4);
      }

      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);

    // Handle reduced-motion change mid-session
    function onMqChange(e: MediaQueryListEvent) {
      if (e.matches) {
        active = false;
        cancelAnimationFrame(rafRef.current);
        if (viewportRef.current) viewportRef.current.style.transform = "";
        if (spotRef.current) spotRef.current.style.opacity = "0";
      }
    }
    mq.addEventListener("change", onMqChange);

    return () => {
      active = false;
      cancelAnimationFrame(rafRef.current);
      mq.removeEventListener("change", onMqChange);
      if (viewportRef.current) viewportRef.current.style.transform = "";
    };
  }, [viewportRef]);

  if (!ENABLE_IDLE_MOTION) return null;

  return (
    <div
      ref={spotRef}
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 1,
        pointerEvents: "none",
        borderRadius: "inherit",
        opacity: SPOTLIGHT_MIN,
        background:
          "radial-gradient(ellipse 55% 45% at 48% 46%, rgba(56, 180, 248, 0.12) 0%, rgba(34, 160, 238, 0.06) 35%, transparent 72%)",
      }}
    />
  );
}
