/* src/logic/deltaMoves.ts
   Single source of truth for:
   - building delta rows from ScenarioDeltaLedger
   - scoring top moves (used by Snapshot + AI Intelligence)
*/

import type { ScenarioDeltaLedger } from "@/logic/scenarioDeltaLedger";

export type DeltaType = "positive" | "negative" | "neutral";

export interface DeltaRow {
  metric: string;
  base: string;
  scenario: string;
  delta: string;
  deltaPct: string;
  deltaType: DeltaType;
  commentary: string;
  // raw fields used for scoring/sorting
  deltaRaw?: number;
  deltaPctRaw?: number | null;
}

const fmtMoney = (n: number) => {
  const abs = Math.abs(n);
  if (abs >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `$${(n / 1e3).toFixed(1)}k`;
  return `$${n.toFixed(0)}`;
};

const fmtPct = (n: number) => `${n.toFixed(1)}%`;

const fmtSigned = (n: number, suffix = "") => `${n >= 0 ? "+" : ""}${n.toFixed(1)}${suffix}`;

const pctFromLedger = (v: number | null) => (v == null ? "—" : fmtPct(v));
const moneyFromLedger = (v: number | null) => (v == null ? "—" : fmtMoney(v));
const numFromLedger = (v: number | null) => (v == null ? "—" : v.toFixed(1));

function deltaTypeFrom(delta: number): DeltaType {
  if (!Number.isFinite(delta) || delta === 0) return "neutral";
  return delta > 0 ? "positive" : "negative";
}

// Very tight CFO commentary: explain driver + implication (no fluff)
function varianceComment(metric: string, dt: DeltaType, pctText: string) {
  if (dt === "neutral") return "No material variance versus base.";
  const up = dt === "positive";

  // IMPORTANT: risk is inverted (higher is worse) – Snapshot logic already treats risk specially in scoring;
  // commentary should still be clear.
  if (metric.toLowerCase().includes("risk")) {
    return up
      ? `Risk has increased (${pctText}). This raises uncertainty and can compress value unless mitigated.`
      : `Risk has reduced (${pctText}). This supports confidence and can expand value if sustained.`;
  }

  if (metric.toLowerCase().includes("runway")) {
    return up
      ? `Runway has extended (${pctText}). This improves survivability and optionality.`
      : `Runway has shortened (${pctText}). This increases execution pressure and reduces optionality.`;
  }

  if (metric.toLowerCase().includes("growth")) {
    return up
      ? `Growth has improved (${pctText}). This strengthens momentum if execution holds.`
      : `Growth has weakened (${pctText}). This reduces momentum and may require commercial correction.`;
  }

  if (metric.toLowerCase().includes("arr")) {
    return up
      ? `ARR is higher (${pctText}). This supports value and resilience if durable.`
      : `ARR is lower (${pctText}). This weakens value and resilience unless recovered.`;
  }

  if (metric.toLowerCase().includes("quality")) {
    return up
      ? `Quality has improved (${pctText}). This supports durability and investor confidence.`
      : `Quality has deteriorated (${pctText}). This increases fragility and investor concern.`;
  }

  return up
    ? `Improved versus base (${pctText}).`
    : `Deteriorated versus base (${pctText}).`;
}

export function buildDeltaRowsFromLedger(ledger: ScenarioDeltaLedger | null): DeltaRow[] {
  if (!ledger) return [];

  // ARR12
  const arr12Base = ledger.arr12.base;
  const arr12Sc = ledger.arr12.scenario;
  const arr12Delta = ledger.arr12.delta;
  const arr12PctRaw = ledger.arr12.deltaPct != null ? ledger.arr12.deltaPct * 100 : null;
  const arr12PctText = pctFromLedger(arr12PctRaw);

  // Risk
  const riskBase = ledger.riskScore.base;
  const riskSc = ledger.riskScore.scenario;
  const riskDelta = ledger.riskScore.delta;
  const riskPctRaw = ledger.riskScore.deltaPct != null ? ledger.riskScore.deltaPct * 100 : null;
  const riskPctText = pctFromLedger(riskPctRaw);

  // Runway
  const runwayBase = ledger.runwayMonths.base;
  const runwaySc = ledger.runwayMonths.scenario;
  const runwayDelta = ledger.runwayMonths.delta;
  const runwayPctRaw = ledger.runwayMonths.deltaPct != null ? ledger.runwayMonths.deltaPct * 100 : null;
  const runwayPctText = pctFromLedger(runwayPctRaw);

  // Growth
  const gBase = ledger.arrGrowthPct.base;
  const gSc = ledger.arrGrowthPct.scenario;
  const gDelta = ledger.arrGrowthPct.delta;
  const gPctRaw = ledger.arrGrowthPct.deltaPct != null ? ledger.arrGrowthPct.deltaPct * 100 : null;
  const gPctText = pctFromLedger(gPctRaw);

  // Quality (score)
  const qBase = ledger.qualityScore.base;
  const qSc = ledger.qualityScore.scenario;
  const qDelta = ledger.qualityScore.delta;
  const qPctRaw = ledger.qualityScore.deltaPct != null ? ledger.qualityScore.deltaPct * 100 : null;
  const qPctText = pctFromLedger(qPctRaw);

  const rows: DeltaRow[] = [
    {
      metric: "ARR12",
      base: moneyFromLedger(arr12Base),
      scenario: moneyFromLedger(arr12Sc),
      delta: arr12Delta == null ? "—" : fmtSigned(arr12Delta, "M"),
      deltaPct: arr12PctText,
      deltaType: deltaTypeFrom(arr12Delta ?? 0),
      commentary: varianceComment("ARR12", deltaTypeFrom(arr12Delta ?? 0), arr12PctText),
      deltaRaw: arr12Delta ?? 0,
      deltaPctRaw: arr12PctRaw,
    },
    {
      metric: "RUNWAY (months)",
      base: numFromLedger(runwayBase),
      scenario: numFromLedger(runwaySc),
      delta: runwayDelta == null ? "—" : fmtSigned(runwayDelta, "mo"),
      deltaPct: runwayPctText,
      deltaType: deltaTypeFrom(runwayDelta ?? 0),
      commentary: varianceComment("Runway", deltaTypeFrom(runwayDelta ?? 0), runwayPctText),
      deltaRaw: runwayDelta ?? 0,
      deltaPctRaw: runwayPctRaw,
    },
    {
      metric: "ARR growth %",
      base: pctFromLedger(gBase),
      scenario: pctFromLedger(gSc),
      delta: gDelta == null ? "—" : fmtSigned(gDelta, "%"),
      deltaPct: gPctText,
      deltaType: deltaTypeFrom(gDelta ?? 0),
      commentary: varianceComment("Growth", deltaTypeFrom(gDelta ?? 0), gPctText),
      deltaRaw: gDelta ?? 0,
      deltaPctRaw: gPctRaw,
    },
    {
      metric: "RISK score",
      base: numFromLedger(riskBase),
      scenario: numFromLedger(riskSc),
      delta: riskDelta == null ? "—" : fmtSigned(riskDelta, ""),
      deltaPct: riskPctText,
      deltaType: deltaTypeFrom(riskDelta ?? 0),
      commentary: varianceComment("Risk", deltaTypeFrom(riskDelta ?? 0), riskPctText),
      deltaRaw: riskDelta ?? 0,
      deltaPctRaw: riskPctRaw,
    },
    {
      metric: "QUALITY score",
      base: numFromLedger(qBase),
      scenario: numFromLedger(qSc),
      delta: qDelta == null ? "—" : fmtSigned(qDelta, ""),
      deltaPct: qPctText,
      deltaType: deltaTypeFrom(qDelta ?? 0),
      commentary: varianceComment("Quality", deltaTypeFrom(qDelta ?? 0), qPctText),
      deltaRaw: qDelta ?? 0,
      deltaPctRaw: qPctRaw,
    },
  ];

  return rows;
}

// Scoring rules:
// - prioritize magnitude of variance
// - penalize “risk up” (worse) even if magnitude is high
export function scoreTopMoves(rows: DeltaRow[], limit = 3): DeltaRow[] {
  if (!rows || rows.length === 0) return [];

  const scored = rows.map((r) => {
    const pct = r.deltaPctRaw == null ? 0 : Math.abs(r.deltaPctRaw);
    const raw = r.deltaRaw == null ? 0 : Math.abs(r.deltaRaw);

    // risk is inverted: deltaRaw > 0 = worse → add penalty
    const isRisk = r.metric.toLowerCase().includes("risk");
    const penalty = isRisk && (r.deltaRaw ?? 0) > 0 ? 0.25 : 0;

    // weight: pct dominates, raw is secondary stabilizer
    const score = (pct * 1.0) + (raw * 0.15) - (penalty * 100);

    return { r, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((x) => x.r);
}
