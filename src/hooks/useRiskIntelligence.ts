// src/hooks/useRiskIntelligence.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Phase 300: useRiskIntelligence Hook
//
// Single read point for Risk Intelligence in UI.
// Risk derived strictly from engineResults.timeline[].riskIndex.
//
// Data flow:
//   1. studioTimelineStore.engineResults.timeline  (primary)
//   2. Fallback: KPI-projected timeline via buildTimelineFromKpis
//   3. phase1ScenarioStore → selectKpis → qualitative intelligence
// ═══════════════════════════════════════════════════════════════════════════

import { useMemo } from "react";
import { usePhase1ScenarioStore } from "@/state/phase1ScenarioStore";
import { useBaselineStore } from "@/state/baselineStore";
import { useStudioTimelineStore } from "@/stores/studioTimelineStore";
import { selectKpis } from "@/selectors/kpiSelectors";
import type { SelectedKpis } from "@/selectors/kpiSelectors";
import {
  computeRiskIntelligence,
  type RiskIntelligenceOutput,
} from "@/engine/riskIntelligenceEngine";

export interface UseRiskIntelligenceReturn {
  /** Full risk intelligence output, or null if insufficient data */
  intelligence: RiskIntelligenceOutput | null;
  /** Whether a simulation is complete and intelligence is available */
  ready: boolean;
  /** Baseline risk delta (scenario score − baseline heuristic). + = riskier. */
  baselineDelta: number | null;
}

export function useRiskIntelligence(): UseRiskIntelligenceReturn {
  const activeScenarioId = usePhase1ScenarioStore((s) => s.activeScenarioId);
  const scenarios = usePhase1ScenarioStore((s) => s.scenarios);
  const baseline = useBaselineStore((s) => s.baseline);

  // ── Engine timeline — primary risk source ────────────────────
  const engineResults = useStudioTimelineStore((s) => s.engineResults);

  const activeScenario = useMemo(
    () => scenarios.find((s) => s.id === activeScenarioId) ?? null,
    [scenarios, activeScenarioId],
  );

  // Derive baseline KPIs for delta comparison
  const baselineKpis: SelectedKpis | null = useMemo(() => {
    if (!baseline) return null;
    const b = baseline as Record<string, unknown>;
    const revenue = Number(b.revenue) || 0;
    const burn = Number(b.monthlyBurn) || 0;
    const cash = Number(b.cash) || 0;
    return {
      arr: revenue * 12,
      revenue,
      runwayMonths: burn > 0 ? cash / burn : null,
      burnMonthly: burn,
      grossMargin: Number(b.grossMargin) || 0,
      valuation: null,
      cashOnHand: cash,
      growthRate: Number(b.growthRate) || 0,
      churnRate: Number(b.churnRate) || 0,
      headcount: Number(b.headcount) || 0,
      arpa: Number(b.arpa) || 0,
    };
  }, [baseline]);

  const intelligence = useMemo(() => {
    if (!activeScenario?.simulationResults) return null;
    if (activeScenario.status !== "complete") return null;

    const simKpis = activeScenario.simulationResults.kpis;
    const selectedKpis = selectKpis(simKpis);
    const horizon = activeScenario.simulationResults.horizonMonths ?? 24;

    // Strict: use engineResults.timeline[].riskIndex when available
    const timeline = engineResults?.timeline ?? null;

    return computeRiskIntelligence({
      simulationKpis: simKpis,
      selectedKpis,
      timeline,
      horizonMonths: horizon,
      baselineKpis: baselineKpis ?? selectedKpis,
    });
  }, [activeScenario, baselineKpis, engineResults]);

  // Compute baseline delta: how much riskier is scenario vs baseline?
  const baselineDelta = useMemo(() => {
    if (!intelligence || !baselineKpis) return null;
    // Baseline heuristic score (simple runway-based)
    const blRunway = baselineKpis.runwayMonths ?? 24;
    const blScore = blRunway >= 24 ? 12 : blRunway >= 18 ? 25 : blRunway >= 12 ? 42 : blRunway >= 6 ? 52 : 70;
    return intelligence.overallScore - blScore;
  }, [intelligence, baselineKpis]);

  return {
    intelligence,
    ready: intelligence !== null,
    baselineDelta,
  };
}
