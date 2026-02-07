// src/compare/summary.ts
// PASS 4D — Pure compare summary utilities (no engine changes)

export type DeltaDirection = "up" | "down" | "flat";

export type CompareDeltaItem = {
  label: string;
  baseValue?: string;
  scenarioValue?: string;
  deltaValue?: string;
  direction?: DeltaDirection;
  importanceRank: number;
};

export type CompareSummary = {
  headline: string;
  deltas: CompareDeltaItem[];
};

type PercentileSet = Partial<Record<"p5" | "p10" | "p25" | "p50" | "p75" | "p90" | "p95", number>>;

type StoredMonteCarloResult = Partial<{
  survivalRate: number; // 0..1
  medianSurvivalMonths: number;
  arrPercentiles: PercentileSet;
  cashPercentiles: PercentileSet;
  runwayPercentiles: PercentileSet;
  medianCase: Partial<{
    finalARR: number;
    finalCash: number;
    finalRunway: number;
  }>;
}>;

function isObj(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function asNum(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function asPercentileSet(v: unknown): PercentileSet | null {
  if (!isObj(v)) return null;
  const out: PercentileSet = {};
  const keys = ["p5", "p10", "p25", "p50", "p75", "p90", "p95"] as const;
  for (const k of keys) {
    const n = asNum(v[k]);
    if (n != null) out[k] = n;
  }
  return Object.keys(out).length ? out : null;
}

function asStoredResult(v: unknown): StoredMonteCarloResult | null {
  if (!isObj(v)) return null;

  const arrPercentiles = asPercentileSet(v.arrPercentiles);
  const cashPercentiles = asPercentileSet(v.cashPercentiles);
  const runwayPercentiles = asPercentileSet(v.runwayPercentiles);

  const medianCase = isObj(v.medianCase)
    ? {
        finalARR: asNum(v.medianCase.finalARR) ?? undefined,
        finalCash: asNum(v.medianCase.finalCash) ?? undefined,
        finalRunway: asNum(v.medianCase.finalRunway) ?? undefined,
      }
    : undefined;

  const res: StoredMonteCarloResult = {
    survivalRate: asNum(v.survivalRate) ?? undefined,
    medianSurvivalMonths: asNum(v.medianSurvivalMonths) ?? undefined,
    arrPercentiles: arrPercentiles ?? undefined,
    cashPercentiles: cashPercentiles ?? undefined,
    runwayPercentiles: runwayPercentiles ?? undefined,
    medianCase,
  };

  const hasAny =
    res.survivalRate != null ||
    res.medianSurvivalMonths != null ||
    !!res.arrPercentiles ||
    !!res.cashPercentiles ||
    !!res.runwayPercentiles ||
    !!res.medianCase;

  return hasAny ? res : null;
}

function dirFromDelta(delta: number, eps: number): DeltaDirection {
  if (Math.abs(delta) <= eps) return "flat";
  return delta > 0 ? "up" : "down";
}

function fmtPct01(v01: number): string {
  const pct = v01 * 100;
  return `${pct.toFixed(pct >= 10 ? 0 : 1)}%`;
}

function fmtInt(v: number): string {
  return `${Math.round(v).toString()}`;
}

function fmtMoney(v: number): string {
  const a = Math.abs(v);
  if (a >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(1)}B`;
  if (a >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (a >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${Math.round(v)}`;
}

function signed(v: number, unit: string, decimals = 0): string {
  const sign = v >= 0 ? "+" : "";
  return `${sign}${v.toFixed(decimals)}${unit}`;
}

type MetricKey = "survival" | "runway" | "outcome" | "tail" | "volatility";

type MetricCandidate = {
  key: MetricKey;
  rank: number;
  label: string;
  base?: number;
  scenario: number;
  betterWhenHigher: boolean;
  format: (n: number) => string;
  unitForDelta: (delta: number) => string;
  deltaDecimals: (delta: number) => number;
};

function pickMetric(
  label: string,
  rank: number,
  key: MetricKey,
  betterWhenHigher: boolean,
  scenario: number | null,
  base: number | null,
  format: (n: number) => string,
  unitForDelta: (delta: number) => string,
  deltaDecimals: (delta: number) => number
): MetricCandidate | null {
  if (scenario == null) return null;
  return {
    key,
    rank,
    label,
    base: base ?? undefined,
    scenario,
    betterWhenHigher,
    format,
    unitForDelta,
    deltaDecimals,
  };
}

function extractMetrics(r: StoredMonteCarloResult | null) {
  if (!r) return null;

  const survivalRate = r.survivalRate ?? null;
  const runwayP50 = r.runwayPercentiles?.p50 ?? r.medianCase?.finalRunway ?? null;
  const arrP50 = r.arrPercentiles?.p50 ?? r.medianCase?.finalARR ?? null;
  const tailRunwayP10 = r.runwayPercentiles?.p10 ?? null;

  // "Volatility" proxy: spread between p90 and p10 ARR (higher spread == more volatile, worse)
  const arrP90 = r.arrPercentiles?.p90 ?? null;
  const arrP10 = r.arrPercentiles?.p10 ?? null;
  const arrSpread = arrP90 != null && arrP10 != null ? arrP90 - arrP10 : null;

  return {
    survivalRate,
    runwayP50,
    arrP50,
    tailRunwayP10,
    arrSpread,
  };
}

export function computeCompareSummary(args: {
  baselineResult?: unknown | null;
  scenarioResult: unknown;
}): CompareSummary {
  const scenario = asStoredResult(args.scenarioResult);
  const baseline = asStoredResult(args.baselineResult ?? null);

  const sm = extractMetrics(scenario);
  if (!sm) {
    return { headline: "Simulation loaded.", deltas: [] };
  }

  const bm = extractMetrics(baseline);

  const candidates: Array<MetricCandidate | null> = [
    pickMetric(
      "Survival probability",
      1,
      "survival",
      true,
      sm.survivalRate,
      bm?.survivalRate ?? null,
      fmtPct01,
      () => "pp",
      () => 0
    ),
    pickMetric(
      "Median runway",
      2,
      "runway",
      true,
      sm.runwayP50,
      bm?.runwayP50 ?? null,
      (n) => `${fmtInt(n)} mo`,
      () => " mo",
      () => 0
    ),
    pickMetric(
      "Median ARR (proxy)",
      3,
      "outcome",
      true,
      sm.arrP50,
      bm?.arrP50 ?? null,
      fmtMoney,
      () => "",
      () => 0
    ),
    pickMetric(
      "Tail runway (P10)",
      4,
      "tail",
      true,
      sm.tailRunwayP10,
      bm?.tailRunwayP10 ?? null,
      (n) => `${fmtInt(n)} mo`,
      () => " mo",
      () => 0
    ),
    pickMetric(
      "ARR volatility (P90–P10)",
      5,
      "volatility",
      false,
      sm.arrSpread,
      bm?.arrSpread ?? null,
      fmtMoney,
      () => "",
      () => 0
    ),
  ];

  const deltas: CompareDeltaItem[] = candidates
    .filter((c): c is MetricCandidate => !!c)
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 5)
    .map((c) => {
      const hasBase = typeof c.base === "number" && Number.isFinite(c.base);
      const baseValue = hasBase ? c.format(c.base as number) : undefined;
      const scenarioValue = c.format(c.scenario);

      let deltaValue: string | undefined;
      let direction: DeltaDirection | undefined;
      if (hasBase) {
        const rawDelta =
          c.key === "survival"
            ? (c.scenario - (c.base as number)) * 100 // pp
            : c.scenario - (c.base as number);

        const delta = rawDelta;
        const eps = c.key === "survival" ? 0.25 : c.key === "runway" ? 0.5 : 0.01;
        direction = dirFromDelta(delta, eps);

        const displayedDelta =
          c.key === "survival"
            ? signed(delta, c.unitForDelta(delta), c.deltaDecimals(delta))
            : signed(delta, c.unitForDelta(delta), c.deltaDecimals(delta));

        deltaValue = displayedDelta;
      }

      return {
        label: c.label,
        baseValue,
        scenarioValue,
        deltaValue,
        direction,
        importanceRank: c.rank,
      };
    });

  const surv = deltas.find((d) => d.importanceRank === 1);
  const runway = deltas.find((d) => d.importanceRank === 2);
  const tail = deltas.find((d) => d.importanceRank === 4);

  const headline = (() => {
    const hasBase = !!surv?.baseValue || !!runway?.baseValue;

    if (!hasBase) {
      const s = surv?.scenarioValue ? `Survival ${surv.scenarioValue}` : "Survival —";
      const r = runway?.scenarioValue ? `median runway ${runway.scenarioValue}` : "median runway —";
      return `${s}; ${r}.`;
    }

    const survDelta = surv?.deltaValue ?? "";
    const runwayDelta = runway?.deltaValue ?? "";
    const tailDelta = tail?.deltaValue ?? "";

    const parts: string[] = [];
    if (survDelta) parts.push(`survival ${survDelta}`);
    if (runwayDelta) parts.push(`median runway ${runwayDelta}`);

    // If headline already has two clauses, don't add a third unless we only have one.
    if (parts.length < 2 && tailDelta) parts.push(`tail runway ${tailDelta}`);

    if (!parts.length) return "Scenario outcome summary available.";
    return `Scenario changes ${parts.join(" and ")} vs baseline.`;
  })();

  return { headline, deltas };
}


