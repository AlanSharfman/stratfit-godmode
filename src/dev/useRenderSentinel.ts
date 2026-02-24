// src/dev/useRenderSentinel.ts
// STRATFIT — Module 0 Instrumentation
// Purpose: deterministically detect "render storms" / infinite update loops.
// This does NOT fix the loop. It identifies the first component that is re-rendering too frequently.
// Safe: dev-only usage; no Zustand writes; no side effects except console logging.

import { useEffect, useRef } from "react";

export function useRenderSentinel(name: string, limit = 80) {
  const renders = useRef(0);
  renders.current += 1;

  useEffect(() => {
    // If we render more than 'limit' times in a short span, we flag it.
    // This strongly correlates with "Maximum update depth exceeded" or a render loop.
    if (renders.current === limit) {
      console.error(
        `[RenderSentinel] ${name} hit ${limit} renders. Likely render loop / unstable selector / effect dependency.`,
      );
    }
  });
}
