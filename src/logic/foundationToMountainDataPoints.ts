import type { FoundationData } from "../store/foundationStore";

function nz(v: string): number {
  const x = Number(String(v ?? "").replace(/,/g, "").trim());
  return Number.isFinite(x) ? x : 0;
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0));
}

function norm(x: number, min: number, max: number): number {
  if (!Number.isFinite(x)) return 0;
  if (max === min) return 0;
  return (x - min) / (max - min);
}

function invNorm(x: number, min: number, max: number): number {
  return 1 - norm(x, min, max);
}

/**
 * Initiate/Foundation → legacy 7-vector used by the mountain renderer.
 * This is intentionally heuristic (we don't have full EngineResult KPIs yet).
 *
 * Index mapping:
 * 0: REVENUE (ARR)
 * 1: PROFIT (Gross Margin / Earnings Power proxy)
 * 2: RUNWAY
 * 3: CASH
 * 4: BURN (inverted)
 * 5: EFFICIENCY (LTV/CAC or Magic Number proxy)
 * 6: RISK (safety)
 */
export function foundationToMountainDataPoints(fd: FoundationData): number[] {
  // Sliders on Foundation page use "K" units for cash/burn/arr/mrr/etc.
  const cashK = nz(fd.cash);
  const burnK = nz(fd.burn);
  const arrK = nz(fd.arr);

  const cash = cashK * 1000;
  const burn = burnK * 1000;
  const arr = arrK * 1000;

  const runwayMonths = burn > 0 ? cash / burn : 0;

  const grossMarginPct = nz(fd.grossMargin); // 0..100

  const ltvK = nz(fd.ltv);
  const cacK = nz(fd.cac);
  const ltv = ltvK * 1000;
  const cac = cacK * 1000;
  const ltvCac = cac > 0 ? ltv / cac : 0;

  const magicNumber = nz(fd.magicNumber); // typically ~0..2+

  const churnPct = nz(fd.churn); // 0..15 in UI

  // Risk is a composite “danger” signal, then inverted into “safety”.
  const runwayDanger = clamp01((6 - runwayMonths) / 6); // 0 if >= 6 mo, 1 if 0 mo
  const churnDanger = clamp01(churnPct / 15);
  const debtDanger = clamp01(nz(fd.debtOutstanding) / 5000); // debtOutstanding is K; 0..5M => 0..1

  const riskDanger = clamp01(runwayDanger * 0.55 + churnDanger * 0.35 + debtDanger * 0.10);
  const riskSafety = clamp01(1 - riskDanger);

  const efficiency = ltvCac > 0 ? norm(ltvCac, 0, 6) : norm(magicNumber, 0, 2);

  return [
    clamp01(norm(arr, 0, 10_000_000)),     // 0: revenue
    clamp01(norm(grossMarginPct, 0, 100)), // 1: profit proxy
    clamp01(norm(runwayMonths, 0, 36)),    // 2: runway
    clamp01(norm(cash, 0, 5_000_000)),     // 3: cash
    clamp01(invNorm(burn, 0, 500_000)),    // 4: burn (inverted)
    clamp01(efficiency),                   // 5: efficiency
    clamp01(riskSafety),                   // 6: risk safety
  ];
}


