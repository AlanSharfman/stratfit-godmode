// src/components/compound/impact/ImpactView.tsx
import { useMemo } from "react";
import RiskBreakdownPanel from "@/components/center/RiskBreakdownPanel";
import { useScenarioStore } from "@/state/scenarioStore";
import { useShallow } from "zustand/react/shallow";
import { buildScenarioDeltaLedger, type ScenarioDeltaLedger } from "@/logic/scenarioDeltaLedger";
import styles from "./ImpactView.module.css";

type Tone = "pos" | "neg" | "neutral";

function lnNumber(x: unknown): number | null {
  if (typeof x === "number" && Number.isFinite(x)) return x;
  if (typeof x === "string") {
    const n = Number(x);
    return Number.isFinite(n) ? n : null;
  }
  if (x && typeof x === "object" && "value" in (x as any)) {
    const v = (x as any).value;
    return typeof v === "number" && Number.isFinite(v) ? v : null;
  }
  return null;
}

function fmt1(n: number | null): string {
  if (n === null) return "—";
  return n.toFixed(1);
}
function fmtInt(n: number | null): string {
  if (n === null) return "—";
  return Math.round(n).toString();
}
function fmtPct1(n: number | null): string {
  if (n === null) return "—";
  return `${n.toFixed(1)}%`;
}
function fmtMoneyCompact(n: number | null): string {
  if (n === null) return "—";
  return new Intl.NumberFormat("en-AU", {
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 1,
  }).format(n);
}

function deltaNumber(deltaField: any): number | null {
  const n = lnNumber(deltaField?.delta ?? deltaField);
  return n === null ? null : n;
}

function toneFromDelta(delta: number | null, invertGood = false): Tone {
  const d = delta ?? 0;
  if (!Number.isFinite(d) || Math.abs(d) <= 1e-9) return "neutral";
  const sign = invertGood ? -d : d;
  return sign > 0 ? "pos" : "neg";
}

function severityLabel(ledger: ScenarioDeltaLedger | null): string {
  if (!ledger) return "UNKNOWN";

  // presentation-only: combine normalized "badness" from key stress metrics
  const rRun = Math.min(1, Math.abs(deltaNumber((ledger as any).runwayMonths?.delta) ?? 0) / 6);
  const rArr = Math.min(1, Math.abs(deltaNumber((ledger as any).arr12?.delta) ?? 0) / 500_000);
  const rGro = Math.min(1, Math.abs(deltaNumber((ledger as any).arrGrowthPct?.delta) ?? 0) / 10);
  const rRisk = Math.min(1, Math.abs(deltaNumber((ledger as any).riskScore?.delta) ?? 0) / 20);
  const rQual = Math.min(1, Math.abs(deltaNumber((ledger as any).qualityScore?.delta) ?? 0) / 20);

  // invertGood already handled in row tones; for severity we just measure magnitude
  const score = (rRun * 1.2 + rRisk * 1.2 + rArr + rGro + rQual) / 5.4;

  if (score >= 0.75) return "CRITICAL";
  if (score >= 0.45) return "FRAGILE";
  return "STABLE";
}

function deltaBadgeClass(tone: Tone): string {
  if (tone === "pos") return `${styles.kpiDelta} ${styles.kpiDeltaPos}`;
  if (tone === "neg") return `${styles.kpiDelta} ${styles.kpiDeltaNeg}`;
  return styles.kpiDelta;
}

export default function ImpactView() {
  const { engineResults, activeScenarioId } = useScenarioStore(
    useShallow((s) => ({
      engineResults: s.engineResults,
      activeScenarioId: s.activeScenarioId,
    }))
  );

  const hasEngine = !!engineResults && Object.keys(engineResults).length > 0;

  const ledger = useMemo(() => {
    if (!engineResults) return null;
    return buildScenarioDeltaLedger({ engineResults, activeScenario: activeScenarioId });
  }, [engineResults, activeScenarioId]);

  const scenarioLabel = String(activeScenarioId || "scenario").toUpperCase();
  const sev = severityLabel(ledger);

  // Headline chips (ledger-only)
  const runwaySc = lnNumber((ledger as any)?.runwayMonths?.scenario);
  const runwayDelta = deltaNumber((ledger as any)?.runwayMonths?.delta);
  const runwayTone = toneFromDelta(runwayDelta, false);

  const riskSc = lnNumber((ledger as any)?.riskScore?.scenario);
  const riskDelta = deltaNumber((ledger as any)?.riskScore?.delta);
  const riskTone = toneFromDelta(riskDelta, true); // invertGood: higher risk is bad

  const arrSc = lnNumber((ledger as any)?.arr12?.scenario);
  const arrDelta = deltaNumber((ledger as any)?.arr12?.delta);
  const arrTone = toneFromDelta(arrDelta, false);

  const drivers = useMemo(() => {
    const items: Array<{
      key: string;
      label: string;
      tone: Tone;
      scenarioText: string;
      deltaText: string;
      score: number;
    }> = [];

    const push = (key: string, label: string, scenarioText: string, delta: any, invertGood = false, scale = 1) => {
      const d = deltaNumber(delta);
      const tone = toneFromDelta(d, invertGood);
      const score = Math.abs(d ?? 0) * scale;
      const sign = (d ?? 0) > 0 ? "+" : (d ?? 0) < 0 ? "−" : "";
      const dTxt = d == null ? "—" : `${sign}${Math.abs(d).toFixed(Math.abs(d) >= 100 ? 0 : 1)}`;
      items.push({ key, label, tone, scenarioText, deltaText: dTxt, score });
    };

    // scale weights are presentation-only: bring $ and % onto roughly comparable ranking
    if (ledger) {
      push("runwayMonths", "Runway", `${fmt1(runwaySc)} mo`, (ledger as any).runwayMonths?.delta, false, 1);
      push("riskScore", "Risk", fmtInt(riskSc), (ledger as any).riskScore?.delta, true, 1);
      push("arr12", "ARR", `$${fmtMoneyCompact(arrSc)}`, (ledger as any).arr12?.delta, false, 1 / 100_000);
      push("arrGrowthPct", "ARR Growth", fmtPct1(lnNumber((ledger as any).arrGrowthPct?.scenario)), (ledger as any).arrGrowthPct?.delta, false, 1);
      push("qualityScore", "Quality", fmtInt(lnNumber((ledger as any).qualityScore?.scenario)), (ledger as any).qualityScore?.delta, false, 1);
    }

    // "worst 3" = negative tone first, then by score
    return items
      .sort((a, b) => {
        const an = a.tone === "neg" ? 0 : a.tone === "neutral" ? 1 : 2;
        const bn = b.tone === "neg" ? 0 : b.tone === "neutral" ? 1 : 2;
        if (an !== bn) return an - bn;
        return b.score - a.score;
      })
      .slice(0, 3);
  }, [ledger, runwaySc, riskSc, arrSc]);

  if (!hasEngine) {
    return (
      <div style={{ padding: 18, color: "rgba(200,235,255,0.7)" }}>
        <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase" }}>
          Impact
        </div>
        <div style={{ marginTop: 6, fontSize: 12, opacity: 0.8 }}>Waiting for scenario engine results…</div>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      {/* HEADER */}
      <div className={styles.header}>
        <div className={styles.hLeft}>
          <div className={styles.hTitle}>Impact Map</div>
          <div className={styles.hScenario}>
            <div className={styles.hScenarioName}>{scenarioLabel}</div>
            <div className={styles.hSeverity}>{sev}</div>
          </div>
          <div className={styles.hSub}>
            Base → {scenarioLabel}. This view shows how this future shifts survival, revenue momentum, and risk — ledger-driven.
          </div>
        </div>

        <div className={styles.kpiStrip}>
          <div className={styles.kpiChip}>
            <div className={styles.kpiLabel}>Runway</div>
            <div className={styles.kpiValueRow}>
              <div className={styles.kpiMain}>{fmt1(runwaySc)} mo</div>
              <div className={deltaBadgeClass(runwayTone)}>
                {runwayDelta == null ? "—" : `${runwayDelta > 0 ? "+" : runwayDelta < 0 ? "−" : ""}${Math.abs(runwayDelta).toFixed(1)} mo`}
              </div>
            </div>
          </div>

          <div className={styles.kpiChip}>
            <div className={styles.kpiLabel}>Risk</div>
            <div className={styles.kpiValueRow}>
              <div className={styles.kpiMain}>{fmtInt(riskSc)}</div>
              <div className={deltaBadgeClass(riskTone)}>
                {riskDelta == null ? "—" : `${riskDelta > 0 ? "+" : riskDelta < 0 ? "−" : ""}${Math.abs(riskDelta).toFixed(1)}`}
              </div>
            </div>
          </div>

          <div className={styles.kpiChip}>
            <div className={styles.kpiLabel}>ARR</div>
            <div className={styles.kpiValueRow}>
              <div className={styles.kpiMain}>${fmtMoneyCompact(arrSc)}</div>
              <div className={deltaBadgeClass(arrTone)}>
                {arrDelta == null ? "—" : `${arrDelta > 0 ? "+" : arrDelta < 0 ? "−" : ""}${fmtMoneyCompact(Math.abs(arrDelta))}`}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BODY (scroll) */}
      <div className={styles.body}>
        <RiskBreakdownPanel ledger={ledger} />
      </div>

      {/* BOTTOM DRIVERS */}
      <div className={styles.bottom}>
        <div className={styles.bottomTitle}>Top Impact Drivers</div>
        <div className={styles.driverGrid}>
          {drivers.map((d) => (
            <div key={d.key} className={styles.driverCard}>
              <div className={styles.driverTop}>
                <div className={styles.driverName}>{d.label}</div>
                <div className={deltaBadgeClass(d.tone)}>{d.deltaText}</div>
              </div>
              <div className={styles.driverVal}>Scenario: {d.scenarioText}</div>
              <div className={styles.driverVal}>
                Interpretation: {d.tone === "neg" ? "Deteriorating vs base" : d.tone === "pos" ? "Improving vs base" : "No material shift"}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
