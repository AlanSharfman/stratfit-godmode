import { useEffect, useMemo, useRef, useState } from "react";

function clamp(v: number, lo: number, hi: number): number {
  if (v < lo) return lo;
  if (v > hi) return hi;
  return v;
}

function easeOutCubic(t: number): number {
  // t in [0,1]
  const x = 1 - t;
  return 1 - x * x * x;
}

function roundTo(v: number, decimals: number): number {
  const d = Math.max(0, Math.min(6, Math.round(decimals)));
  const p = Math.pow(10, d);
  return Math.round(v * p) / p;
}

export function useCountUpNumber(
  target: number,
  opts?: { from?: number; durationMs?: number; decimals?: number }
): number {
  const decimals = opts?.decimals ?? 0;
  const durationMs = clamp(opts?.durationMs ?? 520, 420, 650);

  const safeTarget = useMemo(() => {
    return typeof target === "number" && Number.isFinite(target) ? target : 0;
  }, [target]);

  const [value, setValue] = useState<number>(() => roundTo(opts?.from ?? safeTarget, decimals));

  const rafRef = useRef<number | null>(null);
  const startTsRef = useRef<number>(0);
  const fromRef = useRef<number>(value);
  const lastTargetRef = useRef<number>(safeTarget);
  const lastRenderedRef = useRef<number>(value);

  useEffect(() => {
    const eps = Math.pow(10, -Math.max(0, Math.min(3, decimals)));
    const shouldRun = Math.abs(safeTarget - lastTargetRef.current) > eps || opts?.from != null;
    if (!shouldRun) return;

    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    const from = typeof opts?.from === "number" && Number.isFinite(opts.from) ? opts.from : lastRenderedRef.current;
    fromRef.current = from;
    lastTargetRef.current = safeTarget;
    startTsRef.current = performance.now();

    const tick = (ts: number) => {
      const elapsed = ts - startTsRef.current;
      const t = clamp(elapsed / durationMs, 0, 1);
      const eased = easeOutCubic(t);
      const next = roundTo(fromRef.current + (safeTarget - fromRef.current) * eased, decimals);

      if (next !== lastRenderedRef.current) {
        lastRenderedRef.current = next;
        setValue(next);
      }

      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeTarget, durationMs, decimals, opts?.from]);

  return value;
}

export default useCountUpNumber;


