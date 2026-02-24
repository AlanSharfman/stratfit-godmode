import { useMemo } from "react";
import { useStrategicSignals } from "@/signals/useStrategicSignals";
import { deriveLavaIntensityFromSignals } from "@/signals/deriveLavaIntensityFromSignals";

/**
 * Read-only hook:
 * - derives a single 0..1 intensity from current strategic signals
 * - memoized
 * - no effects, no store writes
 */
export function useSignalDrivenLavaIntensity() {
  const signals = useStrategicSignals();

  return useMemo(() => {
    return deriveLavaIntensityFromSignals(signals);
  }, [signals]);
}
