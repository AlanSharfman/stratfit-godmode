import { useEffect, useRef, useState } from "react";

/**
 * StudioOverlays — Focus Hierarchy Controller
 *
 * Purely visual: listens for "lever changed" signals and triggers a brief
 * emphasis pulse to guide attention. Does NOT touch simulation logic.
 *
 * Integration: call window.__STRATFIT_STUDIO_LEVER_PULSE__() whenever any lever changes.
 */
export default function StudioOverlays() {
  const [pulse, setPulse] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);

  useEffect(() => {
    (window as any).__STRATFIT_STUDIO_LEVER_PULSE__ = () => {
      startRef.current = performance.now();
      setPulse(1);

      if (rafRef.current) cancelAnimationFrame(rafRef.current);

      const tick = () => {
        const t = (performance.now() - startRef.current) / 900; // 0.9s total
        if (t >= 1) {
          setPulse(0);
          rafRef.current = null;
          return;
        }
        // ease out
        const eased = 1 - Math.pow(1 - t, 3);
        setPulse(1 - eased);
        rafRef.current = requestAnimationFrame(tick);
      };

      rafRef.current = requestAnimationFrame(tick);
    };

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      delete (window as any).__STRATFIT_STUDIO_LEVER_PULSE__;
    };
  }, []);

  // Minimal visible effect (page-level): a very subtle top-right "focus flash"
  // to confirm action without UI clutter.
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        opacity: pulse > 0 ? 1 : 0,
        transition: "opacity 120ms ease",
        background:
          pulse > 0
            ? `radial-gradient(ellipse 45% 35% at 72% 28%, rgba(56,189,248,${
                0.14 * pulse
              }) 0%, rgba(2,6,23,0) 60%)`
            : "transparent",
      }}
    />
  );
}
