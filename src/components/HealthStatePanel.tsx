// src/components/HealthStatePanel.tsx
// STRATFIT — Scenario Health Tab View (Board-Grade State Assessment)

import { useMemo } from 'react';
import { useLevers, useScenario } from '@/state/scenarioStore';
import ScenarioHealthAnimated from "@/components/ScenarioHealthAnimated";
import { calculateScenarioHealth, type LeverValues } from '@/logic/calculateScenarioHealth';

export default function HealthStatePanel() {
  // Derive lever values from dataPoints (normalized 0-100)
  const levers = useLevers();
  const leverValues: LeverValues = useMemo(() => {
    const normalize = (v: number) => Math.max(0, Math.min(100, v));
    return {
      revenueGrowth: normalize(levers.revenueGrowth ?? 50),
      pricingAdjustment: normalize(levers.pricingAdjustment ?? 50),
      marketingSpend: normalize(levers.marketingSpend ?? 50),
      operatingExpenses: normalize(levers.operatingExpenses ?? 50),
      headcount: normalize(levers.headcount ?? 50),
      cashSensitivity: normalize(levers.cashSensitivity ?? 50),
      churnSensitivity: normalize(levers.churnSensitivity ?? 50),
      fundingInjection: normalize(levers.fundingInjection ?? 50),
    };
  }, [levers]);
  const metrics = useMemo(() => calculateScenarioHealth(leverValues), [leverValues]);
  const { health, trend } = metrics;
  const scenario = useScenario();
  // Map scenario to supported values
  const scenarioId = scenario === "upside" || scenario === "downside" ? scenario : "base";
  return (
    <ScenarioHealthAnimated
      health={health}
      scenario={scenarioId}
      trend={trend}
      vsBase={0}
    />
  );
}