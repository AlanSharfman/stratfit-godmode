// ============================================================================
// SPLINE DATA GENERATOR
// ============================================================================

import { useMemo } from 'react';
import type { Scenario } from './useScenarioColors';

export type TimePeriod = 'monthly' | 'quarterly' | 'yearly';

export const TIMELINE_LABELS: Record<TimePeriod, string[]> = {
  monthly: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  quarterly: ['Q1', 'Q2', 'Q3', 'Q4'],
  yearly: ['Y1', 'Y2', 'Y3', 'Y4', 'Y5'],
};

interface UseSplineDataParams {
  timePeriod: TimePeriod;
  scenario: Scenario;
  revenueGrowth: number;
  opex: number;
  burnRate: number;
  hiringRate: number;
  wageInflation: number;
}

export function useSplineData({
  timePeriod,
  scenario,
  revenueGrowth,
  opex,
  burnRate,
  hiringRate,
  wageInflation,
}: UseSplineDataParams) {
  const dataPoints = useMemo(() => {
    const count = { monthly: 12, quarterly: 4, yearly: 5 }[timePeriod];
    const mult = { base: 1, upside: 1.35, downside: 0.7, extreme: 1.8 }[scenario];

    return Array.from({ length: count }, (_, i) => {
      const growth = Math.pow(1 + (revenueGrowth / 100) * 0.1, i);
      const season = 1 + Math.sin((i / count) * Math.PI * 2) * 0.12;
      const costs = (opex / 100) * 10 + (burnRate / 200) * 8 + (wageInflation / 20) * 5;
      const boost = (hiringRate / 50) * 3;
      const base = 32 + i * 5;
      return Math.max(18, Math.min(92, base * growth * season * mult - costs + boost));
    });
  }, [timePeriod, scenario, revenueGrowth, opex, burnRate, hiringRate, wageInflation]);

  const labels = TIMELINE_LABELS[timePeriod];

  return { dataPoints, labels };
}

