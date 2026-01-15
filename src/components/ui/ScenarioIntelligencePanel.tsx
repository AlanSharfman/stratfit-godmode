

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

function getLedgerNumber(ln: any): number | null {
  if (!ln) return null;
  if (typeof ln === "number") return ln;
  if (typeof ln === "object") {
    if (typeof ln.value === "number") return ln.value;
    if (typeof ln.scenario === "number") return ln.scenario;
    if (typeof ln.delta === "number") return ln.delta;
  }
  return null;
}

function formatLedgerNumber(ln: any, decimals = 0, suffix = ""): string {
  const n = getLedgerNumber(ln);
  if (n == null || isNaN(n)) return "—";
  return n.toLocaleString(undefined, { maximumFractionDigits: decimals, minimumFractionDigits: decimals }) + suffix;
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
      runway: formatLedgerNumber(ledger.runwayMonths, 0, " mo"),
      growth: formatLedgerNumber(ledger.arrGrowthPct, 1, "%"),
      arr: formatLedgerNumber(ledger.arr12, 0, ""),
      risk: formatLedgerNumber(ledger.riskScore, 0, ""),
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
    const runwayMonths = getLedgerNumber(ledger.runwayMonths);
    const growthPct = getLedgerNumber(ledger.arrGrowthPct);
    const riskScore = getLedgerNumber(ledger.riskScore);

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


