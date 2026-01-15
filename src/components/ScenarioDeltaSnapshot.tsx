import { buildDeltaRowsFromLedger, scoreTopMoves } from "@/logic/deltaMoves";
// --- Spider fallback (ledger-only, deterministic) ---------------------------
type SpiderAxis = { metric: string; label: string; value: number };

function clamp100(n: number) {
  return Math.max(0, Math.min(100, n));
}

function scoreLinear(v: number | null, min: number, max: number) {
  if (v === null || !Number.isFinite(v) || max === min) return 50;
  const t = (v - min) / (max - min);
  return clamp100(t * 100);
}

/**
 * Build a stable 5-axis spider from the canonical ScenarioDeltaLedger.
 * This guarantees spokes + polygon always render (even if some values are missing).
 */
function axesFromLedger(ledger: {
  runwayMonths?: { value: number | null };
  arrGrowthPct?: { value: number | null }; // percent units
  riskScore?: { value: number | null };    // higher = more risk
  qualityScore?: { value: number | null };
  arr12?: { value: number | null };
}): SpiderAxis[] {
  const runway = ledger.runwayMonths?.value ?? null;     // months
  const growth = ledger.arrGrowthPct?.value ?? null;     // %
  const risk = ledger.riskScore?.value ?? null;          // 0..100 (risk)
  const quality = ledger.qualityScore?.value ?? null;    // 0..100
  const arr12 = ledger.arr12?.value ?? null;             // currency

  return [
    { metric: "runway",  label: "Runway",  value: scoreLinear(runway, 6, 24) },
    { metric: "growth",  label: "Growth",  value: scoreLinear(growth, -10, 30) },
    // RiskScore is "risk"; spider fitness wants "health", so invert
    { metric: "health",  label: "Health",  value: clamp100(100 - (risk ?? 50)) },
    { metric: "quality", label: "Quality", value: clamp100(quality ?? 50) },
    // ARR12 scale: tune min/max later; this is safe and stable for now
    { metric: "scale",   label: "Scale",   value: scoreLinear(arr12, 1_000_000, 10_000_000) },
  ];
}
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

  // Accepts any LedgerNumber-ish shape and returns a safe number.
  function lnValue(x: unknown): number {
    if (typeof x === "number" && Number.isFinite(x)) return x;
    // common shapes: { value }, { n }, { raw }, etc
    const v =
      (x as any)?.value ??
      (x as any)?.n ??
      (x as any)?.raw ??
      (x as any)?.num ??
      null;
    return typeof v === "number" && Number.isFinite(v) ? v : 0;
  }

  const scenarioKey = useScenarioStore((s) => s.activeScenarioId ?? "base");
  const [isOpen, setIsOpen] = useState<boolean>(true);

  // Phase IG: subscribe to the canonical KPI primitives the ledger uses
  const ledgerInputSig = useScenarioStore((s) => {
    const base = s.engineResults?.base?.kpis;
    const sc = s.engineResults?.[scenarioKey]?.kpis;

    const baseRisk = (base?.riskScore?.value ?? base?.riskScore ?? 0) as number;
    const scRisk = (sc?.riskScore?.value ?? sc?.riskScore ?? 0) as number;

    const baseArr12 = (base?.arrNext12?.value ?? (base as any)?.arr12?.value ?? base?.arrNext12 ?? 0) as number;
    const scArr12 = (sc?.arrNext12?.value ?? (sc as any)?.arr12?.value ?? sc?.arrNext12 ?? 0) as number;

    const baseGrowth = (base?.arrGrowthPct?.value ?? base?.arrGrowthPct ?? 0) as number;
    const scGrowth = (sc?.arrGrowthPct?.value ?? sc?.arrGrowthPct ?? 0) as number;

    const baseRunway = (base?.runway?.value ?? (base as any)?.runwayMonths?.value ?? base?.runway ?? 0) as number;
    const scRunway = (sc?.runway?.value ?? (sc as any)?.runwayMonths?.value ?? sc?.runway ?? 0) as number;

    const baseQual = ((base as any)?.qualityScore?.value ?? 0) as number;
    const scQual = ((sc as any)?.qualityScore?.value ?? 0) as number;

    return [
      scenarioKey,
      baseRisk, scRisk,
      baseArr12, scArr12,
      baseGrowth, scGrowth,
      baseRunway, scRunway,
      baseQual, scQual,
      Boolean(base), Boolean(sc),
    ].join("|");
  });

  const baseResult = useScenarioStore((s) => s.engineResults?.base);

  const engineResultForScenario = useScenarioStore((s) => s.engineResults?.[scenarioKey]);

  const ledger = useMemo(() => {
    if (!baseResult?.kpis || !engineResultForScenario?.kpis) return null;
    return buildScenarioDeltaLedger({
      engineResults: { base: baseResult, [scenarioKey]: engineResultForScenario },
      activeScenario: scenarioKey,
    });
  }, [baseResult, engineResultForScenario, scenarioKey]);

  const spiderBaseAxes = useMemo(() => {
    if (!ledger) return [];
    return buildSpiderAxes({
      runwayMonths: { value: lnValue(ledger.runwayMonths?.base) },
      arrGrowthPct: { value: lnValue(ledger.arrGrowthPct?.base) },
      riskScore: { value: lnValue(ledger.riskScore?.base) },
      qualityScore: { value: lnValue(ledger.qualityScore?.base) },
      arr12: { value: lnValue(ledger.arr12?.base) },
    } as any);
  }, [ledger]);

  const spiderScenarioAxes = useMemo(() => {
    if (!ledger) return [];
    return buildSpiderAxes({
      runwayMonths: { value: lnValue(ledger.runwayMonths?.scenario) },
      arrGrowthPct: { value: lnValue(ledger.arrGrowthPct?.scenario) },
      riskScore: { value: lnValue(ledger.riskScore?.scenario) },
      qualityScore: { value: lnValue(ledger.qualityScore?.scenario) },
      arr12: { value: lnValue(ledger.arr12?.scenario) },
    } as any);
  }, [ledger]);

  // Zero-risk radar signature log
  const radarSig = useMemo(() => {
    const b = spiderBaseAxes.map((a: any) => Number(a.v01 ?? a.value01 ?? a.value ?? 0).toFixed(3)).join(",");
    const s = spiderScenarioAxes.map((a: any) => Number(a.v01 ?? a.value01 ?? a.value ?? 0).toFixed(3)).join(",");
    const sig = `${scenarioKey} | B[${b}] S[${s}]`;
    console.log("[IG][VAR_RADAR_SIG]", sig);
    return sig;
  }, [spiderBaseAxes, spiderScenarioAxes, scenarioKey]);

  const rows: (DeltaRow & { deltaRaw?: number; deltaPctRaw?: number | null })[] = useMemo(() => {
    return buildDeltaRowsFromLedger(ledger as any);
  }, [ledger]);

  const topMoves = useMemo(() => {
    return scoreTopMoves(rows, 3);
  }, [rows]);


  if (!ledger) {
    const hasBase = !!useScenarioStore.getState().engineResults?.base?.kpis;
    const hasActive = !!useScenarioStore.getState().engineResults?.[scenarioKey]?.kpis;

    return (
      <div className={styles.wrap}>
        <div className={styles.card}>
          <div className={styles.cardInner}>
            <div className={styles.cardHeader}>
              <div>
                <div className={styles.cardTitle}>Scenario Delta Snapshot</div>
                <div className={styles.cardHint}>Truth block — missing canonical inputs</div>
              </div>
            </div>

            <div style={{ fontSize: 12, lineHeight: 1.5, opacity: 0.9 }}>
              <div><b>Required:</b> engineResults.base.kpis AND engineResults[{scenarioKey}].kpis</div>
              <div><b>base present:</b> {String(hasBase)}</div>
              <div><b>active present:</b> {String(hasActive)}</div>
              <div style={{ marginTop: 8, opacity: 0.85 }}>
                If active is false when switching scenarios, your scenario ID key does not match the populated engineResults keys,
                or population is not running for that scenario.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className={styles.wrap}>
      <div className={styles.topBar}>
        <div className={styles.titleRow}>
          <div className={styles.kicker}>Scenario Delta Snapshot</div>
          <div className={styles.subKicker}>
            Base → {scenarioKey === "base" ? "Base" : scenarioKey}
          </div>
        </div>

        <button type="button" onClick={() => setIsOpen((v: boolean) => !v)} className={styles.toggleBtn}>
          {isOpen ? "Hide" : "Show"}
        </button>
      </div>

      {isOpen && (
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
                      base={spiderBaseAxes}
                      scenario={spiderScenarioAxes}
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

