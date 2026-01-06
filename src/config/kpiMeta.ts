// src/config/kpiMeta.ts
// Minimal KPI metadata contract used by `AIIntelligence.tsx`
// (Formatting + "higher is better" semantics)

export type KPIMeta = {
  label?: string;
  higherIsBetter?: boolean;
  format?: (value: number) => string;
};

function fmtNumber(n: number, digits = 0): string {
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString(undefined, { maximumFractionDigits: digits });
}

function fmtMoneyCompact(n: number): string {
  if (!Number.isFinite(n)) return "—";
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1_000_000_000) return `${sign}$${fmtNumber(abs / 1_000_000_000, 1)}B`;
  if (abs >= 1_000_000) return `${sign}$${fmtNumber(abs / 1_000_000, 1)}M`;
  if (abs >= 1_000) return `${sign}$${fmtNumber(abs / 1_000, 1)}K`;
  return `${sign}$${fmtNumber(abs, 0)}`;
}

export const KPI_META: Record<string, KPIMeta> = {
  runway: { label: "Runway", higherIsBetter: true, format: (v) => `${fmtNumber(v, 1)}y` },
  cashPosition: { label: "Cash", higherIsBetter: true, format: (v) => fmtMoneyCompact(v) },
  momentum: { label: "Momentum", higherIsBetter: true, format: (v) => fmtNumber(v, 1) },
  burnQuality: { label: "Burn", higherIsBetter: false, format: (v) => fmtMoneyCompact(v) },
  riskIndex: { label: "Risk", higherIsBetter: false, format: (v) => fmtNumber(v, 1) },
  earningsPower: { label: "Earnings", higherIsBetter: true, format: (v) => fmtMoneyCompact(v) },
  enterpriseValue: { label: "Value", higherIsBetter: true, format: (v) => fmtMoneyCompact(v) },
};


