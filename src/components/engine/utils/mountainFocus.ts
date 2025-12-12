/**
 * KPI to Mountain Focus Band Mapping
 */

export interface FocusBand {
    x0: number;
    x1: number;
    strength: number;
  }
  
  const DEFAULT_NUM_KPIS = 7;
  const BAND_WIDTH = 0.20;
  
  export function kpiIndexToFocus(
    index: number,
    numKPIs: number = DEFAULT_NUM_KPIS
  ): FocusBand {
    const center = (index + 0.5) / numKPIs;
    return {
      x0: Math.max(0, center - BAND_WIDTH / 2),
      x1: Math.min(1, center + BAND_WIDTH / 2),
      strength: 1.0,
    };
  }
  
  export function sliderIdToFocus(sliderId: string): FocusBand | null {
    const SLIDER_MAPPINGS: Record<string, FocusBand> = {
      revenueGrowth: { x0: 0.0, x1: 0.25, strength: 0.8 },
      operatingExpenses: { x0: 0.2, x1: 0.45, strength: 0.8 },
      hiringRate: { x0: 0.4, x1: 0.65, strength: 0.8 },
      wageIncrease: { x0: 0.55, x1: 0.80, strength: 0.8 },
      burnRate: { x0: 0.75, x1: 1.0, strength: 0.8 },
    };
    return SLIDER_MAPPINGS[sliderId] ?? null;
  }
  
  export const KPI_TO_SLIDERS: Record<number, string[]> = {
    0: ["burnRate"],
    1: ["burnRate", "revenueGrowth"],
    2: ["revenueGrowth"],
    3: ["revenueGrowth", "operatingExpenses"],
    4: ["burnRate", "operatingExpenses", "hiringRate"],
    5: ["burnRate", "hiringRate", "wageIncrease"],
    6: ["revenueGrowth", "operatingExpenses"],
  };
  
  export function getSlidersForKPI(kpiIndex: number): string[] {
    return KPI_TO_SLIDERS[kpiIndex] ?? [];
  }