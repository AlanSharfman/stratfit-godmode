// src/hooks/useTimelineResolutionWarning.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Input Validation for Timeline Resolution
//
// If resolution = monthly, display a warning that inputs must be
// provided in monthly resolution. Returns warning state.
// ═══════════════════════════════════════════════════════════════════════════

import { useMemo } from "react";
import { useStudioTimelineStore } from "@/stores/studioTimelineStore";
import type { TimelineResolution } from "@/core/simulation/timelineTypes";

export interface ResolutionWarning {
  active: boolean;
  message: string;
  resolution: TimelineResolution;
}

export function useTimelineResolutionWarning(): ResolutionWarning {
  const resolution = useStudioTimelineStore((s) => s.resolution);

  return useMemo(() => {
    if (resolution === "monthly") {
      return {
        active: true,
        message: "Inputs must be provided in monthly resolution.",
        resolution,
      };
    }
    return {
      active: false,
      message: "",
      resolution,
    };
  }, [resolution]);
}
