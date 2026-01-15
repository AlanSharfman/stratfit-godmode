// src/components/center/RiskBreakdownPanel.tsx
// Option A: Expandable "Risk Breakdown" (heatmap-style) under Mountain
// Canonical source: buildScenarioDeltaLedger(engineResults, activeScenario)

import React, { useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useScenarioStore } from "@/state/scenarioStore";
import { buildScenarioDeltaLedger } from "@/logic/scenarioDeltaLedger";
import styles from "./RiskBreakdownPanel.module.css";

type Tone = "pos" | "neg" | "neutral";

function lnNumber(x: any): number | null {
  const v =
    x?.value ??
    x?.scenario?.value ??
    x?.base?.value ??
    x ??
    null;
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function displayDelta(delta: any, suffix = ""): string {
  const d =
    delta?.display ??
    delta?.delta?.display ??
    null;
  if (typeof d === "string" && d.trim()) return `${d}${suffix}`;
  const n = lnNumber(delta?.delta ?? delta);
  if (n === null) return "—";
  const fixed = Math.abs(n) >= 100 ? Math.round(n).toString() : n.toFixed(1);
  return `${fixed}${suffix}`;
}

function toneFromDelta(deltaRaw: number | null, invert = false): Tone {
  if (deltaRaw === null) return "neutral";
  const x = invert ? -deltaRaw : deltaRaw;
  if (Math.abs(x) < 1e-9) return "neutral";
  return x > 0 ? "pos" : "neg";
}

export default function RiskBreakdownPanel() {
  const [open, setOpen] = useState(false);

  const { engineResults, activeScenarioId, scenarioFallback } = useScenarioStore(
    useShallow((s) => ({
      engineResults: s.engineResults,
      activeScenarioId: (s as any).activeScenarioId ?? null,
      scenarioFallback: (s as any).scenario ?? "base",
    }))
  );

  const scenarioKey = (activeScenarioId ?? scenarioFallback ?? "base") as any;

  const ledger = useMemo(() => {
    if (!engineResults) return null;
    return buildScenarioDeltaLedger({ engineResults, activeScenario: scenarioKey });
  }, [engineResults, scenarioKey]);

  // Heatmap rows (ledger-only). Invert means "down is good" logic.
  // For Risk Score: lower is better => invert=true.
  const rows = useMemo(() => {
    if (!ledger) return [];

    const runwayDelta = lnNumber(ledger.runwayMonths?.delta ?? null);
    const arr12Delta = lnNumber(ledger.arr12?.delta ?? null);
    const growthDelta = lnNumber(ledger.arrGrowthPct?.delta ?? null);
    const riskDelta = lnNumber(ledger.riskScore?.delta ?? null);
    const qualityDelta = lnNumber(ledger.qualityScore?.delta ?? null);

    return [
      {
        key: "runway",
        label: "Runway",
        base: lnNumber(ledger.runwayMonths?.base) ?? "—",
        scenario: lnNumber(ledger.runwayMonths?.scenario) ?? "—",
        delta: displayDelta(ledger.runwayMonths?.delta, " mo"),
        tone: toneFromDelta(runwayDelta, false),
      },
      {
        key: "arr12",
        label: "ARR (Next 12)",
        base: lnNumber(ledger.arr12?.base) ?? "—",
        scenario: lnNumber(ledger.arr12?.scenario) ?? "—",
        delta: displayDelta(ledger.arr12?.delta, ""),
        tone: toneFromDelta(arr12Delta, false),
      },
      {
        key: "growth",
        label: "ARR Growth",
        base: lnNumber(ledger.arrGrowthPct?.base) ?? "—",
        scenario: lnNumber(ledger.arrGrowthPct?.scenario) ?? "—",
        delta: displayDelta(ledger.arrGrowthPct?.delta, "%"),
        tone: toneFromDelta(growthDelta, false),
      },
      {
        key: "risk",
        label: "Risk Score",
        base: lnNumber(ledger.riskScore?.base) ?? "—",
        scenario: lnNumber(ledger.riskScore?.scenario) ?? "—",
        delta: displayDelta(ledger.riskScore?.delta, ""),
        tone: toneFromDelta(riskDelta, true), // invert: lower risk is "pos"
      },
      {
        key: "quality",
        label: "Quality",
        base: lnNumber(ledger.qualityScore?.base) ?? "—",
        scenario: lnNumber(ledger.qualityScore?.scenario) ?? "—",
        delta: displayDelta(ledger.qualityScore?.delta, ""),
        tone: toneFromDelta(qualityDelta, false),
      },
    ];
  }, [ledger]);

  const headerLabel = ledger?.activeScenario ? String(ledger.activeScenario) : String(scenarioKey);

  return (
    <div className={styles.wrap}>
      <button
        type="button"
        className={styles.toggle}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className={styles.toggleLeft}>
          <span className={styles.kicker}>Risk Breakdown</span>
          <span className={styles.sub}>Base vs {headerLabel}</span>
        </span>
        <span className={styles.chev}>{open ? "▾" : "▸"}</span>
      </button>

      {open ? (
        <div className={styles.panel}>
          {!ledger ? (
            <div className={styles.empty}>
              <div className={styles.emptyTitle}>Truth block — missing canonical inputs</div>
              <div className={styles.emptyHint}>Engine results not available yet.</div>
            </div>
          ) : (
            <div className={styles.grid}>
              {rows.map((r) => (
                <div key={r.key} className={styles.row}>
                  <div className={styles.metric}>{r.label}</div>
                  <div className={styles.vals}>
                    <div className={styles.base}>{r.base}</div>
                    <div className={styles.arrow}>→</div>
                    <div className={styles.scenario}>{r.scenario}</div>
                  </div>
                  <div className={`${styles.delta} ${styles[r.tone]}`}>{r.delta}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
