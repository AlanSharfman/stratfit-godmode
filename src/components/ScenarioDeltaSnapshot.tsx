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
  type TrafficLight,
} from "@/logic/spiderFitness";
import { TrafficLightPill } from "@/components/charts/mini/TrafficLightPill";

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
  // Neutral threshold
  if (Math.abs(delta) < 1e-9) return "neutral";

  // For cost/risk metrics, DOWN is better.
  const lowerIsBetter = new Set([
    "burnRate",
    "cac",
    "cacPayback",
    "riskIndex",
  ]);

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
          : `Forward ARR improving, indicating healthy future revenue momentum.`,
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

  // show/hide whole module
  const [open, setOpen] = useState(true);

  // Base always exists; scenario = activeScenarioId (or base itself)
  const base = engineResults?.base;
  const scenarioKey = activeScenarioId ?? "base";
  const scenario = engineResults?.[scenarioKey] ?? engineResults?.base;

  // If missing, render nothing (should not happen in normal flow)
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

  // === Strategic Fitness Profile (Spider) ===
  const spiderData = useMemo(() => {
    // Build metrics from engineResults (truth)
    const m: ScenarioMetrics = {
      arr: safeNum(scenario?.kpis?.arrCurrent?.value),
      arrGrowthPct: safeNum(scenario?.kpis?.arrGrowthPct?.value),
      grossMarginPct: safeNum(scenario?.kpis?.earningsPower?.value),
      burnRateMonthly: safeNum(scenario?.kpis?.burnQuality?.value) * 1000,
      runwayMonths: safeNum(scenario?.kpis?.runway?.value),
      riskScore: safeNum(scenario?.kpis?.riskIndex?.value),
      ltvToCac: safeNum(scenario?.kpis?.ltvCac?.value),
      cacPaybackMonths: safeNum(scenario?.kpis?.cacPayback?.value),
    };

    const axes = buildSpiderAxes(m);
    const band = cacQualityBand(m);
    return { axes, band };
  }, [scenario]);

  return (
    <div style={{ width: "100%" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <div style={{ fontWeight: 900, letterSpacing: 0.12, textTransform: "uppercase", fontSize: 12, color: "rgba(200,225,255,0.92)" }}>
            Scenario Delta Snapshot
          </div>
          <div style={{ fontSize: 12, color: "rgba(180,200,220,0.6)" }}>
            Base → {scenarioKey === "base" ? "Base" : scenarioKey}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          style={{
            border: "1px solid rgba(120,180,255,0.18)",
            background: "linear-gradient(180deg, rgba(10,14,18,0.85), rgba(6,9,14,0.92))",
            color: "rgba(210,235,255,0.86)",
            borderRadius: 10,
            padding: "8px 12px",
            fontSize: 12,
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          {open ? "Hide" : "Show"}
        </button>
      </div>

      {open && (
        <>
          {/* Strategic Fitness Profile */}
          <div
            style={{
              border: "1px solid rgba(120,180,255,0.12)",
              borderRadius: 16,
              padding: 14,
              background: "linear-gradient(180deg, rgba(12,16,22,0.72), rgba(6,9,14,0.88))",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
              marginBottom: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ fontSize: 12, letterSpacing: 0.12, textTransform: "uppercase", fontWeight: 900, color: "rgba(200,225,255,0.9)" }}>
                Strategic Fitness Profile
              </div>
              <TrafficLightPill label="Quality" band={spiderData.band} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 16, alignItems: "center" }}>
              <div style={{ minHeight: 220 }}>
                <SpiderRadar title="" base={[]} scenario={spiderData.axes} note="" />
              </div>

              <div style={{ color: "rgba(210,235,255,0.72)", fontSize: 12, lineHeight: 1.55 }}>
                <div style={{ fontWeight: 800, marginBottom: 6 }}>
                  This profile translates the scenario into an investor-readable posture.
                </div>
                <div style={{ marginBottom: 8 }}>
                  <b>ARR growth</b> and <b>forward ARR</b> reflect revenue engine power. <b>Margin</b> and <b>burn</b> reflect unit economics and capital intensity.
                  <b>Runway</b> and <b>risk</b> reflect survivability under stress.
                </div>
                <div style={{ display: "grid", gap: 6 }}>
                  <div><b>Bands:</b></div>
                  <div>• Green: investor-safe</div>
                  <div>• Amber: aggressive / needs proof</div>
                  <div>• Red: risk zone</div>
                </div>
              </div>
            </div>
          </div>

          {/* Delta Table */}
          <div
            style={{
              border: "1px solid rgba(120,180,255,0.12)",
              borderRadius: 16,
              overflow: "hidden",
              background: "linear-gradient(180deg, rgba(12,16,22,0.62), rgba(6,9,14,0.9))",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.25fr 0.9fr 0.9fr 0.8fr 0.7fr 2fr",
                gap: 0,
                padding: "10px 12px",
                borderBottom: "1px solid rgba(120,180,255,0.10)",
                color: "rgba(180,200,220,0.75)",
                fontSize: 11,
                fontWeight: 900,
                letterSpacing: 0.1,
                textTransform: "uppercase",
              }}
            >
              <div>Metric</div>
              <div>Base</div>
              <div>Scenario</div>
              <div>Δ</div>
              <div>Δ%</div>
              <div>CFO Commentary</div>
            </div>

            {rows.map((r) => {
              const c =
                r.deltaType === "positive"
                  ? "rgba(16,185,129,0.92)"
                  : r.deltaType === "negative"
                    ? "rgba(239,68,68,0.88)"
                    : "rgba(180,200,220,0.55)";

              return (
                <div
                  key={r.metric}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.25fr 0.9fr 0.9fr 0.8fr 0.7fr 2fr",
                    padding: "12px 12px",
                    borderBottom: "1px solid rgba(120,180,255,0.06)",
                    color: "rgba(210,235,255,0.80)",
                    fontSize: 12,
                    alignItems: "center",
                  }}
                >
                  <div style={{ fontWeight: 800, color: "rgba(210,235,255,0.86)" }}>{r.metric}</div>
                  <div style={{ color: "rgba(210,235,255,0.72)" }}>{r.base}</div>
                  <div style={{ color: "rgba(210,235,255,0.72)" }}>{r.scenario}</div>
                  <div style={{ fontWeight: 900, color: c }}>{r.delta}</div>
                  <div style={{ fontWeight: 900, color: c }}>{r.deltaPct}</div>
                  <div style={{ color: "rgba(200,220,240,0.70)", lineHeight: 1.45 }}>{r.commentary}</div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
