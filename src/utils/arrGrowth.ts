// src/utils/arrGrowth.ts
// STRATFIT — Derived KPI helpers (UI-only; does not modify engine math)

export type ArrGrowthDerived = {
  arrCurrent: number | null;
  arrNext12: number | null;
  arrDelta: number | null;
  arrGrowthPct: number | null; // ratio (e.g. 0.18 => +18%)
  displayPct: string; // "+18%" or "—"
  displayDelta: string; // "+$0.72M" or "—"
};

const MIN_ARR_FOR_PCT = 10_000; // $10k: avoid nonsense % on tiny/zero baselines

function signPrefix(n: number) {
  return n > 0 ? "+" : n < 0 ? "−" : "";
}

export function formatUsdCompact(n: number): string {
  const abs = Math.abs(n);
  const sign = signPrefix(n);
  if (!Number.isFinite(abs)) return "—";

  if (abs >= 1_000_000_000) return `${sign}$${(abs / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(1)}K`;
  return `${sign}$${abs.toFixed(0)}`;
}

export function formatPctRatio(ratio: number): string {
  if (!Number.isFinite(ratio)) return "—";
  const pct = ratio * 100;
  const sign = signPrefix(pct);
  return `${sign}${Math.abs(pct).toFixed(0)}%`;
}

export function deriveArrGrowth(params: {
  arrCurrent: number | null;
  arrNext12: number | null;
}): ArrGrowthDerived {
  const { arrCurrent, arrNext12 } = params;
  const c = typeof arrCurrent === "number" && Number.isFinite(arrCurrent) ? arrCurrent : null;
  const n = typeof arrNext12 === "number" && Number.isFinite(arrNext12) ? arrNext12 : null;

  const delta = c !== null && n !== null ? n - c : null;
  const pct = c !== null && c > MIN_ARR_FOR_PCT && delta !== null ? delta / c : null;

  return {
    arrCurrent: c,
    arrNext12: n,
    arrDelta: delta,
    arrGrowthPct: pct,
    displayPct: pct === null ? "—" : formatPctRatio(pct),
    displayDelta: delta === null ? "—" : formatUsdCompact(delta),
  };
}


