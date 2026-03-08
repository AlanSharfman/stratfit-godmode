// src/hooks/useTimelineTerrainMetrics.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Timeline → Terrain Metrics Hook
//
// Returns a MetricsAtX function that maps normalised X (0..1) to
// interpolated TerrainMetrics derived from the engine timeline.
// When no timeline exists, returns undefined (callers fall back to
// baseline-derived static metrics).
// ═══════════════════════════════════════════════════════════════════════════

import { useMemo } from "react";
import { useStudioTimelineStore } from "@/stores/studioTimelineStore";
import { buildTimeSeriesMetricsFn, type MetricsAtX } from "@/terrain/timeSeriesTerrainMetrics";

/**
 * Returns a stable `MetricsAtX` function when engine results exist,
 * or `undefined` when no timeline is available.
 */
export function useTimelineTerrainMetrics(): MetricsAtX | undefined {
  const engineResults = useStudioTimelineStore((s) => s.engineResults);

  return useMemo(() => {
    if (!engineResults || engineResults.timeline.length === 0) return undefined;
    return buildTimeSeriesMetricsFn(engineResults.timeline, engineResults.summary);
  }, [engineResults]);
}
