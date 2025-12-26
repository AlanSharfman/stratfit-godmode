import { KPI_META, KPIKey } from "@/config/kpiMeta";
import { EngineResult } from "@/state/scenarioStore";

export type KPIVariance = {
  key: KPIKey;
  base: number;
  active: number;
  deltaAbs: number;
  deltaPct: number | null;
  improved: boolean;
};

export function getVariances(
  active: EngineResult,
  base: EngineResult
): KPIVariance[] {
  return (Object.keys(KPI_META) as KPIKey[]).map((key) => {
    const a = active.kpis[key]?.value ?? 0;
    const b = base.kpis[key]?.value ?? 0;

    const deltaAbs = a - b;
    const deltaPct = b !== 0 ? deltaAbs / b : null;

    const improved = KPI_META[key].higherIsBetter
      ? deltaAbs > 0
      : deltaAbs < 0;

    return {
      key,
      base: b,
      active: a,
      deltaAbs,
      deltaPct,
      improved,
    };
  });
}
