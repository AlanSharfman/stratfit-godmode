// src/hooks/useValuationIntelligence.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Phase 300: useValuationIntelligence Hook
//
// Single read point for Valuation Intelligence in UI.
// Valuation derived strictly from engineResults.timeline[].enterpriseValue.
//
// Data flow:
//   1. studioTimelineStore.engineResults  (primary — timeline + summary)
//   2. Fallback: KPI-projected timeline via buildTimelineFromKpis
//   3. phase1ScenarioStore → selectKpis → enrichment
//   4. → computeValuationIntelligence() → ValuationIntelligenceOutput
// ═══════════════════════════════════════════════════════════════════════════

import { useMemo } from "react";
import { usePhase1ScenarioStore } from "@/state/phase1ScenarioStore";
import { useBaselineStore } from "@/state/baselineStore";
import { useStudioTimelineStore } from "@/stores/studioTimelineStore";
import { selectKpis } from "@/selectors/kpiSelectors";
import type { SelectedKpis } from "@/selectors/kpiSelectors";
import {
  computeValuationIntelligence,
  type ValuationIntelligenceOutput,
  type ValuationMethod,
} from "@/engine/valuationIntelligenceEngine";
import { buildTimelineFromKpis } from "@/engine/riskIntelligenceEngine";

export interface UseValuationIntelligenceReturn {
  /** Full valuation intelligence output, or null if insufficient data */
  intelligence: ValuationIntelligenceOutput | null;
  /** Whether a simulation is complete and intelligence is available */
  ready: boolean;
  /** Update the valuation method (dcf / revenue_multiple) */
  method: ValuationMethod;
}

export function useValuationIntelligence(
  method: ValuationMethod = "revenue_multiple",
): UseValuationIntelligenceReturn {
  const activeScenarioId = usePhase1ScenarioStore((s) => s.activeScenarioId);
  const scenarios = usePhase1ScenarioStore((s) => s.scenarios);
  const baseline = useBaselineStore((s) => s.baseline);

  // ── Engine results — primary valuation source ────────────────
  const engineResults = useStudioTimelineStore((s) => s.engineResults);

  const activeScenario = useMemo(
    () => scenarios.find((s) => s.id === activeScenarioId) ?? null,
    [scenarios, activeScenarioId],
  );

  // Derive baseline KPIs for comparison
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

    // Primary: studioTimelineStore.engineResults
    let timeline = engineResults?.timeline ?? null;
    let summary = engineResults?.summary ?? null;

    // Fallback: build from KPIs if no engine timeline
    if (!timeline || timeline.length === 0) {
      timeline = buildTimelineFromKpis(simKpis, horizon);
      const peakEV = Math.max(...timeline.map((p) => p.enterpriseValue));
      const avgRisk = timeline.reduce((s, p) => s + p.riskIndex, 0) / timeline.length;
      summary = {
        peakRevenue: Math.max(...timeline.map((p) => p.revenue)),
        peakEV,
        avgRiskIndex: avgRisk,
        terminalEbitda: timeline[timeline.length - 1]?.ebitda ?? 0,
        cagr: 0,
      };
    }

    if (!summary) return null;

    // Baseline timeline for comparison (use KPI projection)
    let baselineTimeline: typeof timeline | undefined;
    if (baselineKpis) {
      const blKpis = {
        cash: baselineKpis.cashOnHand,
        monthlyBurn: baselineKpis.burnMonthly,
        revenue: baselineKpis.revenue,
        grossMargin: baselineKpis.grossMargin,
        growthRate: baselineKpis.growthRate,
        churnRate: baselineKpis.churnRate,
        headcount: baselineKpis.headcount,
        arpa: baselineKpis.arpa,
        runway: baselineKpis.runwayMonths,
      };
      baselineTimeline = buildTimelineFromKpis(blKpis as any, horizon);
    }

    return computeValuationIntelligence({
      timeline,
      summary,
      kpis: selectedKpis,
      baselineTimeline,
      method,
    });
  }, [activeScenario, baselineKpis, engineResults, method]);

  return {
    intelligence,
    ready: intelligence !== null,
    method,
  };
}
