import React, { useEffect, useRef, useState } from "react";

type Props = {
  children: React.ReactNode;
  /** Minimum ms between pulses to avoid spam during rapid updates */
  cooldownMs?: number;
  /** Optional: disable if needed */
  enabled?: boolean;
};

function hashText(text: string) {
  // Cheap deterministic hash of visible text
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export default function DeltaEmphasis({ children, cooldownMs = 750, enabled = true }: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const lastHashRef = useRef<number | null>(null);
  const lastPulseAtRef = useRef<number>(0);

  const [pulseKey, setPulseKey] = useState(0);

  useEffect(() => {
    if (!enabled) return;

    const el = hostRef.current;
    if (!el) return;

    // Initial hash
    const initial = hashText(el.innerText || "");
    lastHashRef.current = initial;

    const obs = new MutationObserver(() => {
      const now = performance.now();
      if (now - lastPulseAtRef.current < cooldownMs) return;

      const txt = el.innerText || "";
      const h = hashText(txt);

      if (lastHashRef.current === null) {
        lastHashRef.current = h;
        return;
      }

      if (h !== lastHashRef.current) {
        lastHashRef.current = h;
        lastPulseAtRef.current = now;
        setPulseKey((k) => k + 1); // triggers CSS animation restart
      }
    });

    obs.observe(el, {
      subtree: true,
      characterData: true,
      childList: true,
    });

    return () => obs.disconnect();
  }, [cooldownMs, enabled]);

  return (
    <div
      ref={hostRef}
      // pulseKey ensures animation replays reliably
      data-delta-pulse-key={pulseKey}
      className={pulseKey > 0 ? "sf-deltaPulse sf-deltaPulse--run" : "sf-deltaPulse"}
    >
      {children}
    </div>
  );
}
