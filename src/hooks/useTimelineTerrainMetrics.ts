// src/hooks/useTimelineTerrainMetrics.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Timeline → Terrain Metrics Hook
//
// Derives terrain metrics from the engine timeline at the current step.
// Applies eased interpolation for smooth terrain morphing (400ms).
// ═══════════════════════════════════════════════════════════════════════════

import { useRef, useMemo, useEffect, useState, useCallback } from "react";
import { useStudioTimelineStore } from "@/stores/studioTimelineStore";
import {
  selectTimelineTerrainMetrics,
  lerpTerrainMetrics,
} from "@/selectors/timelineTerrainSelectors";
import type { TerrainMetrics } from "@/terrain/terrainFromBaseline";

// ────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ────────────────────────────────────────────────────────────────────────────

const MORPH_DURATION_MS = 400;
const FRAME_INTERVAL_MS = 16; // ~60fps

// ────────────────────────────────────────────────────────────────────────────
// EASE FUNCTION
// ────────────────────────────────────────────────────────────────────────────

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

// ────────────────────────────────────────────────────────────────────────────
// HOOK
// ────────────────────────────────────────────────────────────────────────────

export function useTimelineTerrainMetrics(): TerrainMetrics | undefined {
  const engineResults = useStudioTimelineStore((s) => s.engineResults);
  const currentStep = useStudioTimelineStore((s) => s.currentStep);

  const peakEV = engineResults?.summary.peakEV ?? 1;
  const peakRevenue = engineResults?.summary.peakRevenue ?? 1;

  // Current step's raw metrics
  const targetMetrics = useMemo(() => {
    if (!engineResults) return undefined;
    const point = engineResults.timeline[currentStep] ?? null;
    return selectTimelineTerrainMetrics(point, peakEV, peakRevenue);
  }, [engineResults, currentStep, peakEV, peakRevenue]);

  // Smoothed metrics with interpolation
  const [smoothedMetrics, setSmoothedMetrics] = useState<TerrainMetrics | undefined>(targetMetrics);
  const prevMetricsRef = useRef<TerrainMetrics | undefined>(undefined);
  const animationRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);

  const stopAnimation = useCallback(() => {
    if (animationRef.current !== null) {
      clearInterval(animationRef.current);
      animationRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!targetMetrics) {
      setSmoothedMetrics(undefined);
      prevMetricsRef.current = undefined;
      return;
    }

    const from = prevMetricsRef.current ?? targetMetrics;
    startTimeRef.current = performance.now();

    stopAnimation();

    animationRef.current = setInterval(() => {
      const elapsed = performance.now() - startTimeRef.current;
      const t = Math.min(1, elapsed / MORPH_DURATION_MS);
      const eased = easeOutCubic(t);

      const interpolated = lerpTerrainMetrics(from, targetMetrics, eased);
      setSmoothedMetrics(interpolated);

      if (t >= 1) {
        stopAnimation();
        prevMetricsRef.current = targetMetrics;
      }
    }, FRAME_INTERVAL_MS);

    return () => { stopAnimation(); };
  }, [targetMetrics, stopAnimation]);

  return smoothedMetrics;
}
