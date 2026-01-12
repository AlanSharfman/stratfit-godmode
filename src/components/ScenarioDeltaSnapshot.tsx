// src/components/ScenarioDeltaSnapshot.tsx
// Scenario Delta Snapshot — Collapsible table below mountain
// Shows Base → Scenario comparison with deltas and AI variance commentary
//
// G-D Mode upgrade (scoped):
// - Adds “Strategic Fitness Profile” hero (SpiderRadar + explanation + pills)
// - Keeps existing toggle + delta table
// - No changes to KPI math, Mountain engine, or Scenario engine logic
// - No layout-width changes to main app (Scenario module only)

import React, { useMemo, type MouseEvent } from "react";
import { useShallow } from "zustand/react/shallow";
import { useScenarioStore } from "@/state/scenarioStore";

import { SpiderRadar } from "@/components/charts/SpiderRadar";
import { buildSpiderAxes, cacQualityBand, type ScenarioMetrics, type TrafficLight } from "@/logic/spiderFitness";
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

// CFO-grade variance commentary generator
function getVarianceCommentary(
  metric: string,
  deltaType: "positive" | "negative" | "neutral",
  deltaPct: string,
  scenario: string
): string {
  if (deltaType === "neutral") return "No material variance from base case assumptions.";

  const isPositive = deltaType === "positive";
  const pctValue = Math.abs(parseFloat(deltaPct.replace(/[^0-9.-]/g, "")) || 0);

  // Scenario-aware commentary
  const scenarioContext =
    scenario === "upside"
      ? "upside assumptions"
      : scenario === "downside"
        ? "downside pressures"
        : scenario === "extreme"
          ? "stress test conditions"
          : "adjusted lever inputs";

  const commentaryMap: Record<string, { positive: string; negative: string }> = {
    Revenue: {
      positive:
        pctValue > 30
          ? `Strong revenue uplift driven by ${scenarioContext}. Demand thesis validated; growth trajectory on track.`
          : `Modest revenue improvement observed. Growth levers responding positively to scenario inputs.`,
      negative:
        pctValue > 30
          ? `Material revenue compression under ${scenarioContext}. Recommend reassessing demand assumptions and pipeline.`
          : `Revenue softening anticipated. Continue monitoring top-line drivers and market conditions.`,
    },
    ARR: {
      positive:
        pctValue > 25
          ? `ARR acceleration exceeding expectations under ${scenarioContext}. Recurring revenue base strengthening.`
          : `Incremental ARR growth reflects healthy customer acquisition and retention dynamics.`,
      negative:
        pctValue > 25
          ? `ARR contraction signals churn risk or acquisition slowdown. Review customer success metrics.`
          : `ARR growth moderating. Recommend reviewing pricing strategy and expansion revenue opportunities.`,
    },
    "Gross Margin": {
      positive:
        pctValue > 10
          ? `Margin expansion driven by ${scenarioContext}. Unit economics improving; operational leverage emerging.`
          : `Gross margin improvement reflects cost discipline and favorable mix shift.`,
      negative:
        pctValue > 10
          ? `Margin compression requires immediate attention. Review COGS structure and pricing power.`
          : `Margin pressure emerging from ${scenarioContext}. Monitor input costs and product mix.`,
    },
    "Risk Score": {
      positive: `Risk profile improving. System stability and operational resilience strengthening.`,
      negative:
        pctValue > 30
          ? `Elevated risk concentration detected. Recommend stress testing key assumptions and contingency planning.`
          : `Risk score increasing moderately. Continue monitoring key risk indicators.`,
    },
    Valuation: {
      positive:
        pctValue > 50
          ? `Significant enterprise value creation under ${scenarioContext}. Multiple expansion supported by fundamentals.`
          : `Incremental valuation uplift reflecting improved unit economics and growth outlook.`,
      negative:
        pctValue > 50
          ? `Substantial value erosion projected. Review capital allocation strategy and funding options.`
          : `Valuation pressure emerging from ${scenarioContext}. Monitor closely for further deterioration.`,
    },
    Runway: {
      positive: `Extended operating runway provides strategic flexibility. Additional time to execute growth initiatives.`,
      negative:
        pctValue > 20
          ? `Critical runway compression. Prioritize cash preservation measures and evaluate funding alternatives.`
          : `Operating buffer reduced under scenario. Recommend tightening expense controls proactively.`,
    },
    "Burn Rate": {
      positive: `Burn rate discipline improving. Efficiency gains being realized through operational improvements.`,
      negative:
        pctValue > 30
          ? `Burn rate trajectory unsustainable under ${scenarioContext}. Immediate cost rationalization required.`
          : `Elevated burn rate anticipated. Conduct detailed review of cost structure and discretionary spend.`,
    },
    "Cash Balance": {
      positive: `Liquidity position strengthened. Enhanced optionality for strategic investments and contingencies.`,
      negative:
        pctValue > 20
          ? `Accelerated cash erosion projected. Activate funding contingency planning immediately.`
          : `Cash drawdown within tolerance but trending unfavorably. Maintain heightened monitoring.`,
    },
  };

  const metricCommentary = commentaryMap[metric];
  if (!metricCommentary) return isPositive ? "Favorable variance from base case." : "Adverse variance requiring attention.";

  return isPositive ? metricCommentary.positive : metricCommentary.negative;
}

const parseKpiDisplay = (display: string): number => {
  if (!display) return 0;

  // Handle "X/100" format (risk score etc)
  if (display.includes("/")) {
    const parts = display.split("/");
    return parseFloat(parts[0].replace(/[^0-9.-]/g, "")) || 0;
  }

  const cleaned = display.replace(/[^0-9.-]/g, "");
  return parseFloat(cleaned) || 0;
};

function bandLabel(b: TrafficLight): string {
  if (b === "green") return "Investor-safe";
  if (b === "amber") return "Aggressive";
  return "Risk";
}

export default function ScenarioDeltaSnapshot() {
  const isOpen = useScenarioStore((state) => state.showScenarioImpact);

  const handleToggle = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    useScenarioStore.getState().setShowScenarioImpact(!isOpen);
  };

  const scenario = useScenarioStore((state) => state.scenario);

  const { activeScenarioId, engineResults } = useScenarioStore(
    useShallow((state) => ({
      activeScenarioId: state.activeScenarioId,
      engineResults: state.engineResults,
    }))
  );

  const activeResult = engineResults?.[activeScenarioId];
  const kpiDisplayValues = activeResult?.kpis || {};

  // Demo base case values (used by table + spider)
  const baseValues = {
    revenue: 2.6,
    arr: 3.2,
    grossMargin: 74,
    valuation: 43.5,
    runway: 19,
    burn: 85,
    cash: 4.0,
    risk: 23,
  };

  // Current scenario values (for spider + table)
  const currentRevenue = parseKpiDisplay(kpiDisplayValues.momentum?.display || "$2.6M");
  const currentARR = parseKpiDisplay(kpiDisplayValues.momentum?.display || "$3.2M");
  const currentMargin = parseKpiDisplay(kpiDisplayValues.earningsPower?.display || "74%");
  const currentValuation = parseKpiDisplay(kpiDisplayValues.enterpriseValue?.display || "$43.5M");
  const currentRunway = parseKpiDisplay(kpiDisplayValues.runway?.display || "19 mo");
  const currentBurn = parseKpiDisplay(kpiDisplayValues.burnQuality?.display || "$85K");
  const currentCash = parseKpiDisplay(kpiDisplayValues.cashPosition?.display || "$4.0M");
  const currentRisk = parseKpiDisplay(kpiDisplayValues.riskIndex?.display || "23/100");

  const deltaData: DeltaRow[] = useMemo(() => {
    const calcDelta = (
      current: number,
      base: number,
      isInverse = false
    ): { delta: string; pct: string; type: "positive" | "negative" | "neutral" } => {
      const diff = current - base;
      if (Math.abs(diff) < 0.05) return { delta: "—", pct: "—", type: "neutral" };
      const pct = base !== 0 ? (diff / base) * 100 : 0;
      const sign = diff > 0 ? "+" : "";
      const isPos = isInverse ? diff < 0 : diff > 0;
      const type: "positive" | "negative" | "neutral" = Math.abs(diff) < 0.05 ? "neutral" : isPos ? "positive" : "negative";
      return { delta: `${sign}${diff.toFixed(1)}`, pct: `${sign}${pct.toFixed(0)}%`, type };
    };

    const revD = calcDelta(currentRevenue, baseValues.revenue);
    const arrD = calcDelta(currentARR, baseValues.arr);
    const marginD = calcDelta(currentMargin, baseValues.grossMargin);
    const valD = calcDelta(currentValuation, baseValues.valuation);
    const runD = calcDelta(currentRunway, baseValues.runway);
    const burnD = calcDelta(currentBurn, baseValues.burn, true); // Burn: lower is better
    const cashD = calcDelta(currentCash, baseValues.cash);
    const riskD = calcDelta(currentRisk, baseValues.risk, true); // Risk: lower is better

    return [
      { metric: "Revenue", base: `$${baseValues.revenue.toFixed(1)}M`, scenario: kpiDisplayValues.momentum?.display || "—", delta: revD.delta === "—" ? "—" : `${revD.delta}M`, deltaPct: revD.pct, deltaType: revD.type, commentary: getVarianceCommentary("Revenue", revD.type, revD.pct, scenario) },
      { metric: "ARR", base: `$${baseValues.arr.toFixed(1)}M`, scenario: kpiDisplayValues.momentum?.display || "—", delta: arrD.delta === "—" ? "—" : `${arrD.delta}M`, deltaPct: arrD.pct, deltaType: arrD.type, commentary: getVarianceCommentary("ARR", arrD.type, arrD.pct, scenario) },
      { metric: "Valuation", base: `$${baseValues.valuation.toFixed(1)}M`, scenario: kpiDisplayValues.enterpriseValue?.display || "—", delta: valD.delta === "—" ? "—" : `${valD.delta}M`, deltaPct: valD.pct, deltaType: valD.type, commentary: getVarianceCommentary("Valuation", valD.type, valD.pct, scenario) },
      { metric: "Gross Margin", base: `${baseValues.grossMargin}%`, scenario: kpiDisplayValues.earningsPower?.display || "—", delta: marginD.delta === "—" ? "—" : `${marginD.delta}%`, deltaPct: marginD.pct, deltaType: marginD.type, commentary: getVarianceCommentary("Gross Margin", marginD.type, marginD.pct, scenario) },
      { metric: "Burn Rate", base: `$${baseValues.burn}K/mo`, scenario: kpiDisplayValues.burnQuality?.display || "—", delta: burnD.delta === "—" ? "—" : `${burnD.delta}K`, deltaPct: burnD.pct, deltaType: burnD.type, commentary: getVarianceCommentary("Burn Rate", burnD.type, burnD.pct, scenario) },
      { metric: "Cash Balance", base: `$${baseValues.cash.toFixed(1)}M`, scenario: kpiDisplayValues.cashPosition?.display || "—", delta: cashD.delta === "—" ? "—" : `${cashD.delta}M`, deltaPct: cashD.pct, deltaType: cashD.type, commentary: getVarianceCommentary("Cash Balance", cashD.type, cashD.pct, scenario) },
      { metric: "Runway", base: `${baseValues.runway} mo`, scenario: kpiDisplayValues.runway?.display || "—", delta: runD.delta === "—" ? "—" : `${runD.delta} mo`, deltaPct: runD.pct, deltaType: runD.type, commentary: getVarianceCommentary("Runway", runD.type, runD.pct, scenario) },
      { metric: "Risk Score", base: `${baseValues.risk}/100`, scenario: kpiDisplayValues.riskIndex?.display || "—", delta: riskD.delta === "—" ? "—" : `${riskD.delta}`, deltaPct: riskD.pct, deltaType: riskD.type, commentary: getVarianceCommentary("Risk Score", riskD.type, riskD.pct, scenario) },
    ];
  }, [kpiDisplayValues, scenario, currentRevenue, currentARR, currentMargin, currentValuation, currentRunway, currentBurn, currentCash, currentRisk]);

  // Spider metrics (typed; safe defaults handled in spiderFitness)
  const baseMetrics: ScenarioMetrics = useMemo(
    () => ({
      arr: baseValues.arr,
      grossMarginPct: baseValues.grossMargin,
      burnRateMonthly: baseValues.burn * 1000,
      runwayMonths: baseValues.runway,
      riskScore: baseValues.risk,
    }),
    []
  );

  const scenarioMetrics: ScenarioMetrics = useMemo(
    () => ({
      arr: currentARR,
      grossMarginPct: currentMargin,
      burnRateMonthly: currentBurn * 1000,
      runwayMonths: currentRunway,
      riskScore: currentRisk,
    }),
    [currentARR, currentMargin, currentBurn, currentRunway, currentRisk]
  );

  const baseAxes = useMemo(() => buildSpiderAxes(baseMetrics), [baseMetrics]);
  const scenAxes = useMemo(() => buildSpiderAxes(scenarioMetrics), [scenarioMetrics]);

  const cacBand = useMemo(() => cacQualityBand(scenarioMetrics), [scenarioMetrics]);
  const riskBand = useMemo(
    () => (scenAxes.find((a) => a.key === "risk_posture")?.band ?? "amber"),
    [scenAxes]
  );
  const efficiencyBand = useMemo(
    () => (scenAxes.find((a) => a.key === "capital_efficiency")?.band ?? "amber"),
    [scenAxes]
  );

  // Delta colors (NO orange): cyan for positive, amber for negative, neutral grey.
  const getDeltaColor = (type: "positive" | "negative" | "neutral") =>
    type === "positive"
      ? "rgba(52,211,153,0.92)" // emerald
      : type === "negative"
        ? "rgba(251,191,36,0.92)" // amber
        : "rgba(130,145,165,0.55)"; // neutral

  const heroWrap: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "1.15fr 0.85fr",
    gap: 18,
    padding: "18px 0 18px 0",
    marginBottom: 6,
  };

  const bezelCard: React.CSSProperties = {
    padding: "16px 16px 14px 16px",
    background: "linear-gradient(135deg, rgba(8,10,14,0.78), rgba(16,20,28,0.62))",
    border: "1px solid rgba(56,189,248,0.22)",
    borderRadius: 10,
    boxShadow: "0 14px 36px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06)",
  };

  const explCard: React.CSSProperties = {
    padding: 16,
    background: "rgba(12,16,22,0.62)",
    border: "1px solid rgba(50,60,75,0.32)",
    borderRadius: 10,
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
  };

  return (
    <div style={{ width: "100%", marginTop: 10, marginBottom: 40, flexShrink: 0 }}>
      {/* Keep existing toggle (unchanged behavior) */}
      <button
        onClick={handleToggle}
        type="button"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          width: "100%",
          padding: "10px 14px",
          background: "rgba(25,30,40,0.6)",
          border: "1px solid rgba(50,60,75,0.35)",
          borderRadius: 5,
          cursor: "pointer",
          color: "rgba(150,165,180,0.85)",
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.02em",
        }}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }}
        >
          <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span>{isOpen ? "Hide Scenario Impact" : "Show Scenario Impact"}</span>
      </button>

      {isOpen && (
        <div
          style={{
            marginTop: 12,
            marginBottom: 30,
            padding: "24px 28px 32px 28px",
            background: "rgba(18,22,30,0.8)",
            border: "1px solid rgba(50,60,75,0.35)",
            borderRadius: 6,
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.10em", color: "rgba(56,189,248,0.9)" }}>
              SCENARIO DELTA SNAPSHOT
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ opacity: 0.7 }}>
                <path
                  d="M6 2V10M6 10L3 7M6 10L9 7"
                  stroke="rgba(56,189,248,0.7)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span style={{ fontSize: 9, fontWeight: 600, color: "rgba(56,189,248,0.6)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                Scroll for all metrics
              </span>
            </div>
          </div>

          <div style={{ marginBottom: 16, paddingBottom: 14, borderBottom: "1px solid rgba(50,60,75,0.3)" }}>
            <span style={{ fontSize: 11, fontWeight: 500, color: "rgba(120,135,155,0.70)" }}>
              {scenario === "base" ? "Base Case → Adjusted Base" : `Base Case → ${scenario.charAt(0).toUpperCase() + scenario.slice(1)}`}
            </span>
          </div>

          {/* G-D Mode hero */}
          <div style={heroWrap}>
            {/* Left: SpiderRadar bezel */}
            <div style={bezelCard}>
              <SpiderRadar title="Strategic Fitness Profile" base={baseAxes} scenario={scenAxes} note="" />

              <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <TrafficLightPill label="CAC Quality" band={cacBand} valueText={bandLabel(cacBand)} />
                <TrafficLightPill label="Risk Band" band={riskBand} valueText={bandLabel(riskBand)} />
                <TrafficLightPill label="Efficiency" band={efficiencyBand} valueText={bandLabel(efficiencyBand)} />
              </div>
            </div>

            {/* Right: Explanation card */}
            <div style={explCard}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 900,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "rgba(56,189,248,0.85)",
                  marginBottom: 10,
                }}
              >
                What it is
              </div>

              <div style={{ fontSize: 12, lineHeight: 1.65, color: "rgba(200,215,230,0.88)" }}>
                <div style={{ marginBottom: 10 }}>
                  The <b style={{ color: "rgba(255,255,255,0.92)" }}>Strategic Fitness Profile</b> compares{" "}
                  <b style={{ color: "rgba(255,255,255,0.86)" }}>Base</b> (grey) vs{" "}
                  <b style={{ color: "rgba(34,211,238,0.95)" }}>Scenario</b> (cyan) across five investor-grade dimensions.
                </div>

                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontWeight: 800, fontSize: 11, letterSpacing: "0.10em", textTransform: "uppercase", color: "rgba(210,245,255,0.78)", marginBottom: 6 }}>
                    How to read it
                  </div>
                  <div style={{ color: "rgba(175,190,210,0.85)" }}>
                    • Larger outward shape = stronger strategic fitness<br />
                    • Ring thresholds indicate posture:
                    <div style={{ marginTop: 6 }}>
                      – <b>Green</b>: investor-safe<br />
                      – <b>Amber</b>: aggressive / needs proof<br />
                      – <b>Red</b>: risk zone
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    padding: "10px 12px",
                    borderRadius: 8,
                    background: "rgba(34,211,238,0.08)",
                    border: "1px solid rgba(34,211,238,0.18)",
                    color: "rgba(210,245,255,0.86)",
                  }}
                >
                  The pills summarize the scenario posture — the table below shows the numeric deltas + CFO commentary.
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {/* Header Row */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "100px 90px 100px 80px 70px 80px 1fr",
                gap: 20,
                padding: "14px 0",
                borderBottom: "1px solid rgba(56,189,248,0.25)",
              }}
            >
              <span style={{ fontWeight: 800, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(56,189,248,0.85)" }}>Metric</span>
              <span style={{ fontWeight: 800, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(56,189,248,0.85)", textAlign: "right" }}>Base</span>
              <span style={{ fontWeight: 800, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(56,189,248,0.85)", textAlign: "right" }}>Scenario</span>
              <span style={{ fontWeight: 800, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(56,189,248,0.85)", textAlign: "right" }}>Δ</span>
              <span style={{ fontWeight: 800, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(56,189,248,0.85)", textAlign: "right" }}>Δ%</span>
              <span />
              <span style={{ fontWeight: 800, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(56,189,248,0.85)" }}>CFO Commentary</span>
            </div>

            {/* Data Rows */}
            {deltaData.map((row, idx) => (
              <div
                key={row.metric}
                style={{
                  display: "grid",
                  gridTemplateColumns: "100px 90px 100px 80px 70px 80px 1fr",
                  gap: 20,
                  padding: "16px 0",
                  borderBottom: idx === deltaData.length - 1 ? "none" : "1px solid rgba(50,60,75,0.15)",
                  alignItems: "flex-start",
                }}
              >
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: 12,
                    color: "rgba(200,215,230,0.95)",
                    fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
                  }}
                >
                  {row.metric}
                </span>

                <span
                  style={{
                    fontSize: 12,
                    color: "rgba(175,190,210,0.9)",
                    textAlign: "right",
                    fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {row.base}
                </span>

                <span
                  style={{
                    fontSize: 12,
                    color: "rgba(175,190,210,0.9)",
                    textAlign: "right",
                    fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {row.scenario}
                </span>

                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    color: getDeltaColor(row.deltaType),
                    textAlign: "right",
                    fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {row.delta}
                </span>

                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    color: getDeltaColor(row.deltaType),
                    textAlign: "right",
                    fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {row.deltaPct}
                </span>

                <span />

                <span
                  style={{
                    fontSize: 11,
                    lineHeight: 1.6,
                    fontFamily: "'Inter', -apple-system, sans-serif",
                    color: row.deltaType === "neutral" ? "rgba(130,145,165,0.55)" : "rgba(175,190,210,0.9)",
                    fontStyle: row.deltaType === "neutral" ? "italic" : "normal",
                  }}
                >
                  {row.commentary}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
