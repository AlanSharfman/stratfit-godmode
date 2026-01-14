// src/components/ScenarioDeltaSnapshot.tsx
// Scenario Delta Snapshot — CFO-grade Base → Scenario comparison
// Truth wired to engineResults (no demo data, no placeholders)

import { useMemo, useState } from "react";
import { useScenarioStore } from "@/state/scenarioStore";
import { SpiderRadar } from "@/components/charts/SpiderRadar";
import {
  buildSpiderAxes,
  cacQualityBand,
  type ScenarioMetrics,
} from "@/logic/spiderFitness";
import { TrafficLightPill } from "@/components/charts/mini/TrafficLightPill";
import styles from "./ScenarioDeltaSnapshot.module.css";

interface DeltaRow {
  metric: string;
  base: string;
  scenario: string;
  delta: string;
  deltaPct: string;
  deltaType: "positive" | "negative" | "neutral";
  commentary: string;
}

function safeNum(n: unknown): number {
  const v = typeof n === "number" ? n : Number(n);
  return Number.isFinite(v) ? v : 0;
}

function pct(n: number): string {
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(1)}%`;
}

function fmtInt(n: number): string {
  return Math.round(n).toLocaleString();
}

function fmtMo(n: number): string {
  return `${Math.round(n)} mo`;
}

function formatUsdCompact(n: number): string {
  const v = safeNum(n);
  const abs = Math.abs(v);
  const sign = v < 0 ? "-" : "";
  if (abs >= 1_000_000_000) return `${sign}$${(abs / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(0)}K`;
  return `${sign}$${abs.toFixed(0)}`;
}

function formatPctCompact(n: number): string {
  const sign = n > 0 ? "+" : n < 0 ? "-" : "";
  return `${sign}${Math.abs(n).toFixed(1)}%`;
}

function computeDeltaType(metricKey: string, delta: number): "positive" | "negative" | "neutral" {
  if (Math.abs(delta) < 1e-9) return "neutral";

  // For cost/risk metrics, DOWN is better.
  const lowerIsBetter = new Set(["burnRate", "cac", "cacPayback", "riskIndex"]);
  const isBetter = lowerIsBetter.has(metricKey) ? delta < 0 : delta > 0;
  return isBetter ? "positive" : "negative";
}

// CFO-grade variance commentary generator
function getVarianceCommentary(
  metric: string,
  deltaType: "positive" | "negative" | "neutral",
  deltaPct: string,
  scenario: string
): string {
  if (deltaType === "neutral") return "No material variance from base case assumptions.";

  const pctValue = Math.abs(parseFloat(deltaPct.replace(/[^0-9.-]/g, "")) || 0);

  const scenarioContext =
    scenario === "upside"
      ? "upside assumptions"
      : scenario === "downside"
        ? "downside pressures"
        : scenario === "extreme"
          ? "stress test conditions"
          : "adjusted lever inputs";

  const commentaryMap: Record<string, { positive: string; negative: string }> = {
    "ARR (Run-Rate)": {
      positive:
        pctValue > 25
          ? `ARR is accelerating under ${scenarioContext}. Core revenue engine is compounding — growth thesis validated.`
          : `ARR is improving. Customer acquisition and expansion are responding positively to scenario levers.`,
      negative:
        pctValue > 25
          ? `ARR contraction under ${scenarioContext}. Churn or demand fragility detected — revenue engine at risk.`
          : `ARR growth is softening. Monitor pipeline quality and expansion dynamics closely.`,
    },

    "ARR in 12 Months": {
      positive:
        pctValue > 30
          ? `Forward ARR outlook materially strengthened. Scenario implies durable revenue scale and valuation uplift.`
          : `Forward ARR improving, indicating healthier future revenue momentum.`,
      negative:
        pctValue > 30
          ? `Forward ARR outlook deteriorating. Growth trajectory under stress — future revenue base at risk.`
          : `ARR growth outlook moderating. Long-term revenue visibility reduced.`,
    },

    "Gross Margin": {
      positive:
        pctValue > 10
          ? `Margin expansion indicates improving unit economics and operating leverage.`
          : `Gross margin improving, reflecting better cost discipline or mix.`,
      negative:
        pctValue > 10
          ? `Margin compression detected. Unit economics deteriorating — pricing or cost structure needs review.`
          : `Gross margin slipping. Monitor cost inflation and discounting.`,
    },

    "Burn Rate": {
      positive: `Burn efficiency improving. Capital is being deployed more effectively.`,
      negative:
        pctValue > 30
          ? `Burn trajectory unsustainable under ${scenarioContext}. Cash preservation required.`
          : `Burn rate increasing. Operating leverage not yet achieved.`,
    },

    "Runway": {
      positive: `Runway extended — scenario provides more time to execute growth strategy.`,
      negative:
        pctValue > 20
          ? `Runway critically compressed. Financing or cost action required.`
          : `Runway reduced. Strategic buffer narrowing.`,
    },

    "Cash Balance": {
      positive: `Liquidity position strengthened. Greater optionality for investment and risk absorption.`,
      negative: `Cash reserves declining. Flexibility reduced under scenario.`,
    },

    "Risk Score": {
      positive: `Risk profile improving. System stability and resilience increasing.`,
      negative:
        pctValue > 30
          ? `Risk concentration elevated. Stress-test assumptions and contingency plans required.`
          : `Risk trending higher. Monitor operational and financial fragility.`,
    },

    Valuation: {
      positive:
        pctValue > 40
          ? `Enterprise value creation accelerating. Fundamentals support multiple expansion.`
          : `Valuation uplift reflects improving growth and unit economics.`,
      negative:
        pctValue > 40
          ? `Material value erosion projected. Capital strategy and growth model under threat.`
          : `Valuation pressure emerging under scenario.`,
    },
  };

  const entry = commentaryMap[metric];
  if (!entry) return deltaType === "positive" ? "Improvement under scenario." : "Deterioration under scenario.";
  return deltaType === "positive" ? entry.positive : entry.negative;
}

export default function ScenarioDeltaSnapshot() {
  const activeScenarioId = useScenarioStore((s) => s.activeScenarioId);
  const engineResults = useScenarioStore((s) => s.engineResults);

  const [open, setOpen] = useState(true);

  const base = engineResults?.base;
  const scenarioKey = activeScenarioId ?? "base";
  const scenario = engineResults?.[scenarioKey] ?? engineResults?.base;

  if (!base || !scenario) return null;

  const metricDefs = useMemo(
    () => [
      { key: "arr", label: "ARR (Run-Rate)", fmt: (v: number) => formatUsdCompact(v) },
      { key: "arrNext12", label: "ARR in 12 Months", fmt: (v: number) => formatUsdCompact(v) },
      { key: "grossMargin", label: "Gross Margin", fmt: (v: number) => formatPctCompact(v) },
      { key: "burnRate", label: "Burn Rate", fmt: (v: number) => formatUsdCompact(v) },
      { key: "runway", label: "Runway", fmt: (v: number) => fmtMo(v) },
      { key: "cashPosition", label: "Cash Balance", fmt: (v: number) => formatUsdCompact(v) },
      { key: "riskIndex", label: "Risk Score", fmt: (v: number) => `${fmtInt(v)}/100` },
      { key: "enterpriseValue", label: "Valuation", fmt: (v: number) => formatUsdCompact(v) },
    ],
    []
  );

  const rows: DeltaRow[] = useMemo(() => {
    return metricDefs.map((m) => {
      const b = safeNum(base.kpis[m.key]?.value);
      const s = safeNum(scenario.kpis[m.key]?.value);
      const d = s - b;

      const dPct = b !== 0 ? (d / b) * 100 : d === 0 ? 0 : 100;
      const deltaType = computeDeltaType(m.key, d);

      return {
        metric: m.label,
        base: m.fmt(b),
        scenario: m.fmt(s),
        delta:
          m.key === "grossMargin"
            ? `${d > 0 ? "+" : ""}${d.toFixed(1)}pp`
            : m.key === "runway"
              ? `${d > 0 ? "+" : ""}${Math.round(d)} mo`
              : m.fmt(d),
        deltaPct: pct(dPct),
        deltaType,
        commentary: getVarianceCommentary(m.label, deltaType, pct(dPct), scenarioKey),
      };
    });
  }, [base, scenario, metricDefs, scenarioKey]);

  // === Strategic Fitness Profile (Spider) — TRUE comparison (Base vs Scenario) ===
  const spider = useMemo(() => {
    const toMetrics = (src: any): ScenarioMetrics => ({
      arr: safeNum(src?.kpis?.arrCurrent?.value),
      arrGrowthPct: safeNum(src?.kpis?.arrGrowthPct?.value),
      grossMarginPct: safeNum(src?.kpis?.earningsPower?.value),
      burnRateMonthly: safeNum(src?.kpis?.burnQuality?.value) * 1000,
      runwayMonths: safeNum(src?.kpis?.runway?.value),
      riskScore: safeNum(src?.kpis?.riskIndex?.value),
      ltvToCac: safeNum(src?.kpis?.ltvCac?.value),
      cacPaybackMonths: safeNum(src?.kpis?.cacPayback?.value),
    });

    const baseAxes = buildSpiderAxes(toMetrics(base));
    const scenAxes = buildSpiderAxes(toMetrics(scenario));
    const band = cacQualityBand(toMetrics(scenario)); // band reflects active scenario quality
    return { baseAxes, scenAxes, band };
  }, [base, scenario]);

  return (
    <div className={styles.wrap}>
      <div className={styles.headRow}>
        <div className={styles.titleBlock}>
          <div className={styles.kicker}>Scenario Delta Snapshot</div>
          <div className={styles.subkicker}>Base → {scenarioKey === "base" ? "Base" : scenarioKey}</div>
        </div>

        <button type="button" onClick={() => setOpen((v) => !v)} className={styles.toggleBtn}>
          {open ? "Hide" : "Show"}
        </button>
      </div>

      {open && (
        <>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <div className={styles.cardTitle}>Strategic Fitness Profile</div>
                <div className={styles.cardHint}>Base posture vs active scenario posture (same truth)</div>
              </div>
              <TrafficLightPill label="Quality" band={spider.band} />
            </div>

            <div className={styles.topGrid}>
              <div className={styles.spiderShell}>
                <SpiderRadar title="" base={spider.baseAxes} scenario={spider.scenAxes} note="" />
              </div>

              <div className={styles.insightShell}>
                <div className={styles.insightTitle}>What changed (executive read)</div>
                <div className={styles.bullets}>
                  <div>
                    This view isolates the <b>Base → Scenario</b> shift and surfaces whether improvements are driven by
                    <b> unit economics</b>, <b>growth quality</b>, or <b>capital intensity</b>.
                  </div>
                  <div>
                    Use the table below to see the <b>largest deltas</b>, then validate the underlying lever moves.
                  </div>
                  <div>
                    The quality band reflects <b>LTV/CAC + payback</b> under the active scenario (no demo scoring).
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.table}>
              <div className={styles.thead}>
                <div>Metric</div>
                <div>Base</div>
                <div>Scenario</div>
                <div>Δ</div>
                <div>Δ%</div>
                <div>CFO Commentary</div>
              </div>

              {rows.map((r) => {
                const tone =
                  r.deltaType === "positive" ? styles.pos : r.deltaType === "negative" ? styles.neg : styles.neu;

                return (
                  <div key={r.metric} className={styles.row}>
                    <div className={styles.metric}>{r.metric}</div>
                    <div className={styles.muted}>{r.base}</div>
                    <div className={styles.muted}>{r.scenario}</div>
                    <div className={`${styles.delta} ${tone}`}>{r.delta}</div>
                    <div className={`${styles.delta} ${tone}`}>{r.deltaPct}</div>
                    <div className={styles.commentary}>{r.commentary}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
