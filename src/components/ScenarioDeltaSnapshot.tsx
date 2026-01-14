// src/components/ScenarioDeltaSnapshot.tsx
// Scenario Delta Snapshot — CFO-grade Base → Scenario comparison
// Truth wired to engineResults (no demo data, no placeholders)

import { useMemo, useState } from "react";
import { useScenarioStore } from "@/state/scenarioStore";
import { SpiderRadar } from "@/components/charts/SpiderRadar";
import {
  buildSpiderAxes,
  type ScenarioMetrics,
} from "@/logic/spiderFitness";
import { TrafficLightPill } from "@/components/charts/mini/TrafficLightPill";
import { buildScenarioDeltaLedger } from "@/logic/scenarioDeltaLedger";
import type { TrafficLight } from "@/logic/spiderFitness";
import styles from "./ScenarioDeltaSnapshot.module.css";

// Convert truth selector band to TrafficLight type
function toTrafficLight(band: "green" | "yellow" | "red"): TrafficLight {
  return band === "yellow" ? "amber" : band;
}

// Quality band label mapping
function qualityBandLabel(band: "green" | "yellow" | "red"): string {
  if (band === "green") return "GREEN";
  if (band === "yellow") return "WATCH";
  return "RED";
}

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
  // riskScore (not riskIndex!) — higher riskScore = more dangerous, so lower is better
  const lowerIsBetter = new Set(["burnRate", "cac", "cacPayback", "riskScore"]);
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
        : scenario === "stress"
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
          ? `ARR contraction under ${scenarioContext}. Demand fragility detected — revenue engine at risk.`
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
    Runway: {
      positive: `Runway extended — more time to execute without financing pressure.`,
      negative:
        pctValue > 20
          ? `Runway critically compressed. Financing or cost action required.`
          : `Runway reduced. Strategic buffer narrowing.`,
    },
    "Cash Balance": {
      positive: `Liquidity strengthened. Greater optionality for investment and risk absorption.`,
      negative: `Cash reserves declining. Flexibility reduced under scenario.`,
    },
    "Risk Score": {
      positive: `Risk profile improving. System resilience increasing.`,
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

  const scenarioKey = activeScenarioId ?? "base";

  const ledger = useMemo(() => {
    return buildScenarioDeltaLedger({ engineResults, activeScenario: scenarioKey });
  }, [engineResults, scenarioKey]);

  if (!ledger) return null;

  const metricDefs = useMemo(
    () => [
      { key: "arr", label: "ARR (Run-Rate)", fmt: (v: number) => formatUsdCompact(v) },
      { key: "arrNext12", label: "ARR in 12 Months", fmt: (v: number) => formatUsdCompact(v) },
      { key: "grossMargin", label: "Gross Margin", fmt: (v: number) => formatPctCompact(v) },
      { key: "burnRate", label: "Burn Rate", fmt: (v: number) => formatUsdCompact(v) },
      { key: "runway", label: "Runway", fmt: (v: number) => fmtMo(v) },
      { key: "cashPosition", label: "Cash Balance", fmt: (v: number) => formatUsdCompact(v) },
      { key: "riskScore", label: "Risk Score", fmt: (v: number) => `${fmtInt(v)}/100` },
      { key: "enterpriseValue", label: "Valuation", fmt: (v: number) => formatUsdCompact(v) },
    ],
    []
  );

  const rows: DeltaRow[] = useMemo(() => {
    // Formatting helpers
    const fmt = {
      money: (v: number) => formatUsdCompact(v),
      percent: (v: number) => `${v.toFixed(1)}%`,
      int: (v: number) => Math.round(v).toLocaleString(),
    };
    if (!ledger) return [];

    const arr12Base = ledger.arr12.base;
    const arr12Sc = ledger.arr12.scenario;
    const arr12Delta = ledger.arr12.delta;
    const arr12Pct = ledger.arr12.deltaPct != null ? ledger.arr12.deltaPct * 100 : null;

    const riskBase = ledger.riskScore.base;
    const riskSc = ledger.riskScore.scenario;
    const riskDelta = ledger.riskScore.delta;

    const runwayBase = ledger.runwayMonths.base;
    const runwaySc = ledger.runwayMonths.scenario;
    const runwayDelta = ledger.runwayMonths.delta;

    const gBase = ledger.arrGrowthPct.base;
    const gSc = ledger.arrGrowthPct.scenario;
    const gDelta = ledger.arrGrowthPct.delta;

    const qBandBase = ledger.qualityBand.base;
    const qBandSc = ledger.qualityBand.scenario;

    const dt = (d: number): DeltaRow["deltaType"] =>
      Math.abs(d) < 1e-9 ? "neutral" : d > 0 ? "positive" : "negative";

    return [
      {
        metric: "ARR 12m",
        base: fmt.money(arr12Base),
        scenario: fmt.money(arr12Sc),
        delta: fmt.money(arr12Delta),
        deltaPct: arr12Pct == null ? "" : fmt.percent(arr12Pct),
        deltaType: dt(arr12Delta),
        commentary: "ARR impact is the primary scale driver.",
      },
      {
        metric: "ARR Growth",
        base: fmt.percent(gBase),
        scenario: fmt.percent(gSc),
        delta: fmt.percent(gDelta),
        deltaPct: "",
        deltaType: dt(gDelta),
        commentary: "Growth trajectory change.",
      },
      {
        metric: "Runway (months)",
        base: fmt.int(runwayBase),
        scenario: fmt.int(runwaySc),
        delta: fmt.int(runwayDelta),
        deltaPct: "",
        deltaType: dt(runwayDelta),
        commentary: "Runway impact reflects survival window.",
      },
      {
        metric: "RiskScore",
        base: fmt.int(riskBase),
        scenario: fmt.int(riskSc),
        delta: fmt.int(riskDelta),
        deltaPct: "",
        deltaType: dt(riskDelta),
        commentary: "RiskScore shift indicates fragility.",
      },
      {
        metric: "Quality Band",
        base: qBandBase,
        scenario: qBandSc,
        delta: qBandBase === qBandSc ? "—" : `${qBandBase} → ${qBandSc}`,
        deltaPct: "",
        deltaType: qBandBase === qBandSc ? "neutral" : "negative",
        commentary: "Structural quality change.",
      },
    ];
  }, [ledger]);

    // PATCH 3: Define topMoves after rows
    const topMoves = useMemo(() => {
      const scored = rows.map((r) => {
        const pct = Number(r.deltaPct);
        const hasPct = Number.isFinite(pct) && r.deltaPct !== "";
        const score = hasPct ? Math.abs(pct) : Math.abs(Number(r.delta) || 0);
        return { r, score };
      });

      return scored
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map(({ r }) => r);
    }, [rows]);

  return (
    <div className={styles.wrap}>
      <div className={styles.topBar}>
        <div className={styles.titleRow}>
          <div className={styles.kicker}>Scenario Delta Snapshot</div>
          <div className={styles.subKicker}>
            Base → {scenarioKey === "base" ? "Base" : scenarioKey}
          </div>
        </div>

        <button type="button" onClick={() => setOpen((v) => !v)} className={styles.toggleBtn}>
          {open ? "Hide" : "Show"}
        </button>
      </div>

      {open && (
        <>
          {/* Strategic Fitness Profile */}
          <div className={styles.card}>
            <div className={styles.cardInner}>
              <div className={styles.cardHeader}>
                <div>
                  <div className={styles.cardTitle}>Strategic Fitness Profile</div>
                  <div className={styles.cardHint}>Base posture vs active scenario posture (truth)</div>
                </div>
                <TrafficLightPill 
                  label={`QUALITY ${qualityBandLabel(ledger.qualityBand.scenario as any)}`}
                  band={toTrafficLight(ledger.qualityBand.scenario as any)}
                  valueText={qualityBandLabel(ledger.qualityBand.scenario as any)}
                />
              </div>

              <div className={styles.fitnessGrid}>
                <div className={styles.radarShell}>
                  <div className={styles.radarStage}>
                    <SpiderRadar
                      title=""
                      base={[]}
                      scenario={[]}
                      note=""
                    />
                  </div>
                </div>

                <div className={styles.briefShell}>
                  <div className={styles.briefTitle}>What changed (executive read)</div>

                  <p className={styles.briefP}>
                    This view isolates the <b>Base → Scenario</b> shift and surfaces whether changes are driven by
                    <b> unit economics</b>, <b>growth quality</b>, or <b>capital intensity</b>.
                  </p>

                  <div className={styles.briefBullets}>
                    {topMoves.length === 0 ? (
                      <div className={styles.bullet}>
                        <div className={styles.dot} />
                        <div>
                          <div className={styles.bulletStrong}>No material movement</div>
                          <div className={styles.bulletSub}>
                            Select a non-base scenario and move levers to create meaningful variances.
                          </div>
                        </div>
                      </div>
                    ) : (
                      topMoves.map((m) => (
                        <div key={m.metric} className={styles.bullet}>
                          <div className={styles.dot} />
                          <div>
                            <div className={styles.bulletStrong}>
                              {m.metric}: {m.deltaPct} ({m.delta})
                            </div>
                            <div className={styles.bulletSub}>{m.commentary}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <p className={styles.briefP} style={{ marginTop: 12, marginBottom: 0 }}>
                    {/* Quality score: <b>{Math.round(spiderData.qScore * 100)}%</b> — reflects LTV/CAC, payback, */}
                    margin, and burn discipline (canonical formula).
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Delta Table */}
          <div className={`${styles.card} ${styles.table}`}>
            <div className={styles.tableHead}>
              <div>Metric</div>
              <div>Base</div>
              <div>Scenario</div>
              <div>Δ</div>
              <div>Δ%</div>
              <div>CFO Commentary</div>
            </div>

            {rows.map((r) => {
              const deltaClass =
                r.deltaType === "positive" ? styles.deltaPos : r.deltaType === "negative" ? styles.deltaNeg : styles.deltaNeu;

              const rowTone =
                r.deltaType === "positive" ? styles.rowPos : r.deltaType === "negative" ? styles.rowNeg : "";

              return (
                <div key={r.metric} className={`${styles.row} ${rowTone}`}>
                  <div className={styles.metric}>{r.metric}</div>
                  <div className={styles.muted}>{r.base}</div>
                  <div className={styles.muted}>{r.scenario}</div>
                  <div className={deltaClass}>{r.delta}</div>
                  <div className={deltaClass}>{r.deltaPct}</div>
                  <div className={styles.commentary}>{r.commentary}</div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
