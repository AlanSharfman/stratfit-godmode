import React, { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  children: React.ReactNode;
  cooldownMs?: number;
  enabled?: boolean;
};

function normalizeText(s: string) {
  return (s || "").replace(/\s+/g, " ").trim();
}

function hashText(text: string) {
  // FNV-1a 32-bit
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export default function DeltaEmphasis({ children, cooldownMs = 900, enabled = true }: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const lastHashRef = useRef<number | null>(null);
  const lastPulseAtRef = useRef<number>(0);

  const [pulseKey, setPulseKey] = useState(0);

  // stable options
  const obsOptions = useMemo(
    () => ({
      subtree: true,
      characterData: true,
      childList: true,
    }),
    []
  );

  useEffect(() => {
    if (!enabled) return;

    const el = hostRef.current;
    if (!el) return;

    // Initialize hash from normalized text
    const initial = hashText(normalizeText(el.innerText || ""));
    lastHashRef.current = initial;

    const obs = new MutationObserver(() => {
      const now = performance.now();
      if (now - lastPulseAtRef.current < cooldownMs) return;

      const txt = normalizeText(el.innerText || "");
      const h = hashText(txt);

      if (lastHashRef.current === null) {
        lastHashRef.current = h;
        return;
      }

      if (h !== lastHashRef.current) {
        lastHashRef.current = h;
        lastPulseAtRef.current = now;
        setPulseKey((k) => k + 1);
      }
    });

    obs.observe(el, obsOptions);

    return () => obs.disconnect();
  }, [cooldownMs, enabled, obsOptions]);

  return (
    <div
      ref={hostRef}
      data-delta-pulse-key={pulseKey}
      className={pulseKey > 0 ? "sf-deltaPulse sf-deltaPulse--run" : "sf-deltaPulse"}
    >
      {children}
    </div>
  );
}
