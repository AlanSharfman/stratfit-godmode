// src/hooks/useSystemAnalysis.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — useSystemAnalysis Hook
//
// The SOLE point where stores are read for analysis consumption.
// All UI panels consume the snapshot returned by this hook.
// No other component should read simulationStore / valuationStore /
// leverStore directly for analytical data.
//
// DEPENDENCY:
//   simulationStore  ──┐
//   valuationStore   ──┼─→  useSystemAnalysis  ─→  SystemAnalysisSnapshot
//   leverStore       ──┤
//   SystemBaseline   ──┘
//
// ═══════════════════════════════════════════════════════════════════════════

import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { useSimulationStore } from "@/state/simulationStore";
import { useLeverStore } from "@/state/leverStore";
import { useSystemBaseline } from "@/system/SystemBaselineProvider";

import {
  runSystemAnalysis,
  recomputeShock,
  type SystemAnalysisResult,
  type SystemAnalysisSnapshot,
  type BaselineInputs,
  type StrategyInputs,
} from "@/logic/system/SystemAnalysisEngine";

import type { ShockResult } from "@/logic/sensitivity/SensitivityEngine";
import type { ValuationDistributionSummary } from "@/logic/valuation/summarizeValuationDistribution";

// ============================================================================
// INPUT COMPLETENESS HELPER
// ============================================================================

function computeInputCompleteness(baseline: Record<string, any> | null): number {
  if (!baseline) return 0;

  const requiredPaths: Array<(b: any) => any> = [
    (b) => b.financial?.arr,
    (b) => b.financial?.monthlyBurn,
    (b) => b.financial?.cashOnHand,
    (b) => b.financial?.grossMarginPct,
    (b) => b.financial?.growthRatePct,
    (b) => b.company?.legalName,
    (b) => b.company?.industry,
    (b) => b.operating?.churnPct,
    (b) => b.customerEngine?.cac,
    (b) => b.capital?.totalDebt,
  ];

  let filled = 0;
  for (const accessor of requiredPaths) {
    try {
      const val = accessor(baseline);
      if (val !== undefined && val !== null && val !== "" && val !== 0) {
        filled++;
      }
    } catch {
      // accessor failed — field missing
    }
  }

  return filled / requiredPaths.length;
}

// ============================================================================
// HOOK
// ============================================================================

export interface UseSystemAnalysisReturn {
  /** The computed analysis snapshot (or not-computed sentinel) */
  analysis: SystemAnalysisResult;

  /** Current shock result (reactive to slider) */
  shockResult: ShockResult | null;

  /** Whether a shock recompute is in progress */
  isComputingShock: boolean;

  /** Update shock intensity — debounced internally */
  setShockIntensity: (pct: number) => void;

  /** Current shock intensity value */
  shockIntensity: number;
}

export function useSystemAnalysis(
  valuationDistribution?: ValuationDistributionSummary | null
): UseSystemAnalysisReturn {
  // ── Store reads (SINGLE source) ──
  const fullResult = useSimulationStore((s) => s.fullResult);
  const leverSnapshot = useSimulationStore((s) => s.leverSnapshot);
  const runMeta = useSimulationStore((s) => s.runMeta);
  const currentLevers = useLeverStore((s) => s.levers);
  const { baseline } = useSystemBaseline();

  // ── Shock state ──
  const [shockIntensity, setShockIntensityRaw] = useState(0);
  const [shockResult, setShockResult] = useState<ShockResult | null>(null);
  const [isComputingShock, setIsComputingShock] = useState(false);
  const shockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Derive explicit inputs ──
  const baselineInputs: BaselineInputs | null = useMemo(() => {
    if (!baseline?.financial) return null;
    return {
      arr: baseline.financial.arr ?? 0,
      monthlyBurn: baseline.financial.monthlyBurn ?? 0,
      cashOnHand: baseline.financial.cashOnHand ?? 0,
      grossMarginPct: baseline.financial.grossMarginPct ?? 0,
      inputCompletenessScore: computeInputCompleteness(baseline),
    };
  }, [baseline]);

  const strategyInputs: StrategyInputs | null = useMemo(() => {
    const src = leverSnapshot ?? currentLevers;
    if (!src) return null;
    return {
      levers: {
        demandStrength: src.demandStrength ?? 50,
        pricingPower: src.pricingPower ?? 50,
        expansionVelocity: src.expansionVelocity ?? 50,
        costDiscipline: src.costDiscipline ?? 50,
        hiringIntensity: src.hiringIntensity ?? 50,
        operatingDrag: src.operatingDrag ?? 50,
        marketVolatility: src.marketVolatility ?? 50,
        executionRisk: src.executionRisk ?? 50,
        fundingPressure: src.fundingPressure ?? 50,
      },
      horizonMonths: fullResult?.timeHorizonMonths ?? 36,
    };
  }, [leverSnapshot, currentLevers, fullResult]);

  // ── Compute snapshot ──
  const analysis: SystemAnalysisResult = useMemo(() => {
    return runSystemAnalysis({
      monteCarloResult: fullResult,
      baselineInputs,
      strategyInputs,
      valuationDistribution: valuationDistribution ?? null,
      runId: runMeta?.runId,
    });
  }, [fullResult, baselineInputs, strategyInputs, valuationDistribution, runMeta]);

  // ── Shock: debounced recompute ──
  const setShockIntensity = useCallback(
    (pct: number) => {
      setShockIntensityRaw(pct);
      if (shockTimerRef.current) clearTimeout(shockTimerRef.current);
      if (!strategyInputs || !baselineInputs) return;

      setIsComputingShock(true);
      shockTimerRef.current = setTimeout(() => {
        const result = recomputeShock({
          levers: strategyInputs.levers,
          baselineInputs,
          horizonMonths: strategyInputs.horizonMonths,
          shockIntensityPct: pct,
          runs: 200,
        });
        setShockResult(result);
        setIsComputingShock(false);
      }, 300);
    },
    [strategyInputs, baselineInputs]
  );

  // ── Initial shock at 0 ──
  useEffect(() => {
    if (strategyInputs && baselineInputs && !shockResult && analysis.computed) {
      // Use the snapshot's shock state as default
      setShockResult(analysis.shockState);
    }
  }, [strategyInputs, baselineInputs, analysis]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    analysis,
    shockResult,
    isComputingShock,
    setShockIntensity,
    shockIntensity,
  };
}

export default useSystemAnalysis;



