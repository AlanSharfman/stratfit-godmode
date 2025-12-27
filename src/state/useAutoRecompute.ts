// src/state/useAutoRecompute.ts
import { useEffect, useRef } from "react";
import { useMetricsStore } from "./metricsStore";

export function useAutoRecompute() {
  const scenario = useMetricsStore((s) => s.scenario);
  const levers = useMetricsStore((s) => s.levers);
  const recompute = useMetricsStore((s) => s.recompute);

  const didInit = useRef(false);

  useEffect(() => {
    if (!didInit.current) {
      didInit.current = true;
      recompute();
      return;
    }
    recompute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenario, levers]);
}
