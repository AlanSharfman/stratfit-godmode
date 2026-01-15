

import React, { useMemo } from "react";
import styles from "./ScenarioIntelligencePanel.module.css";
import { useShallow } from "zustand/react/shallow";
import { useScenarioStore } from "@/state/scenarioStore";
import { buildScenarioDeltaLedger } from "@/logic/scenarioDeltaLedger";

// --- Helpers ---
function titleScenario(id: string | null | undefined): string {
  const s = (id || "").trim();
  if (!s) return "—";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function ledgerScenarioNumber(ln: any): number | null {
  const v =
    ln?.scenario?.value ??
    ln?.scenario ??
    ln?.value ??
    null;
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function ledgerScenarioDisplay(ln: any, fallbackDecimals = 0, suffix = ""): string {
  const d =
    ln?.scenario?.display ??
    ln?.display ??
    null;
  if (typeof d === "string" && d.trim()) return d;
  const n = ledgerScenarioNumber(ln);
  if (n === null) return "—";
  const fixed = Number.isInteger(n) ? String(n) : n.toFixed(fallbackDecimals);
  return `${fixed}${suffix}`;
}

export default function ScenarioIntelligencePanel() {

  const { activeScenarioId, engineResults, activeLeverId } = useScenarioStore(
    useShallow((s) => ({
      activeScenarioId: s.activeScenarioId,
      engineResults: s.engineResults,
      activeLeverId: (s as any).activeLeverId ?? null,
    }))
  );

  const ledger = useMemo(() => {
    if (!engineResults) return null;
    return buildScenarioDeltaLedger({ engineResults, activeScenario: activeScenarioId });
  }, [engineResults, activeScenarioId]);

  // ---- CANONICAL TILES (ledger-only) ----
  const tiles = useMemo(() => {
    if (!ledger) {
      return {
        scenarioLabel: "—",
        runway: "—",
        growth: "—",
        arr: "—",
        risk: "—",
        quality: "—",
      };
    }
    return {
      scenarioLabel: titleScenario(ledger.activeScenario),
      runway: ledgerScenarioDisplay(ledger.runwayMonths, 0, " mo"),
      growth: ledgerScenarioDisplay(ledger.arrGrowthPct, 1, "%"),
      arr: ledgerScenarioDisplay(ledger.arr12, 0, ""),
      risk: ledgerScenarioDisplay(ledger.riskScore, 0, ""),
      quality: ledger?.qualityBand?.scenario ? String(ledger.qualityBand.scenario) : "—",
    };
  }, [ledger]);

  // ---- CANONICAL BANDS (computed ONLY from ledger scenario values) ----
  const bands = useMemo(() => {
    if (!ledger) {
      return {
        runway: "—" as const,
        growth: "—" as const,
        risk: "—" as const,
      };
    }
    const runwayMonths = ledgerScenarioNumber(ledger.runwayMonths);
    const growthPct = ledgerScenarioNumber(ledger.arrGrowthPct);
    const riskScore = ledgerScenarioNumber(ledger.riskScore);

    const runwayBand =
      runwayMonths === null ? "—" :
      runwayMonths < 9 ? "CRITICAL" :
      runwayMonths < 12 ? "TIGHT" :
      runwayMonths < 18 ? "ADEQUATE" :
      "STRONG";

    const growthBand =
      growthPct === null ? "—" :
      growthPct < 0 ? "CONTRACTING" :
      growthPct < 10 ? "MUTED" :
      growthPct < 25 ? "SOLID" :
      "STRONG";

    const riskBand =
      riskScore === null ? "—" :
      riskScore >= 80 ? "CRIT" :
      riskScore >= 65 ? "HIGH" :
      riskScore >= 45 ? "MED" :
      "LOW";

    return {
      runway: runwayBand,
      growth: growthBand,
      risk: riskBand,
    };
  }, [ledger]);


  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <strong>{tiles.scenarioLabel}</strong>
        <span>{activeLeverId ? "LIVE" : "SYNCED"}</span>
      </div>

      <div className={styles.tiles}>
        <div>Runway: {tiles.runway}</div>
        <div>Growth: {tiles.growth}</div>
        <div>ARR: {tiles.arr}</div>
        <div>Risk: {tiles.risk}</div>
        <div>Quality: {tiles.quality}</div>
      </div>

      <div className={styles.bands}>
        <div>Runway band: {bands.runway}</div>
        <div>Growth band: {bands.growth}</div>
        <div>Risk band: {bands.risk}</div>
      </div>
    </div>
  );
}


