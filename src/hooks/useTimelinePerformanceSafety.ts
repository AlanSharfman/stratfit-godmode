// src/hooks/useTimelinePerformanceSafety.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Performance Safety for Timeline-Driven Terrain
//
// If timeline steps > 120, returns reduced terrain mesh density
// parameters to avoid GPU overload.
// ═══════════════════════════════════════════════════════════════════════════

import { useMemo } from "react";
import { useStudioTimelineStore } from "@/stores/studioTimelineStore";

// ────────────────────────────────────────────────────────────────────────────
// THRESHOLDS
// ────────────────────────────────────────────────────────────────────────────

const HIGH_STEP_THRESHOLD = 120;
const REDUCED_SEGMENTS = 80;
const NORMAL_SEGMENTS = 120;

// ────────────────────────────────────────────────────────────────────────────
// TYPES
// ────────────────────────────────────────────────────────────────────────────

export interface PerformanceSafetyConfig {
  /** Whether performance reduction is active */
  reduced: boolean;
  /** Terrain mesh segment count (width) */
  segments: number;
  /** Warning message (empty if no reduction) */
  warning: string;
  /** Total timeline steps */
  totalSteps: number;
}

// ────────────────────────────────────────────────────────────────────────────
// HOOK
// ────────────────────────────────────────────────────────────────────────────

export function useTimelinePerformanceSafety(): PerformanceSafetyConfig {
  const timeline = useStudioTimelineStore((s) => s.timeline);

  return useMemo(() => {
    const totalSteps = timeline.length;
    const reduced = totalSteps > HIGH_STEP_THRESHOLD;

    return {
      reduced,
      segments: reduced ? REDUCED_SEGMENTS : NORMAL_SEGMENTS,
      warning: reduced
        ? `High step count (${totalSteps}). Terrain mesh density reduced for performance.`
        : "",
      totalSteps,
    };
  }, [timeline.length]);
}
