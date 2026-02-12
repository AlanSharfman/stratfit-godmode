/// <reference lib="webworker" />

import { runSimulation } from "@/engine/runSimulation";

self.onmessage = async (event: MessageEvent) => {
  const { runId, levers, baseline } = (event as any).data ?? {};

  try {
    const start = performance.now();
    const result = runSimulation(levers, baseline);
    const duration = performance.now() - start;

    // Keep engine pure; attach measured duration here.
    if (result?.result) {
      (result.result as any).executionTimeMs = duration;
    }

    self.postMessage({ runId, result, duration });
  } catch (err) {
    self.postMessage({
      runId,
      error: err instanceof Error ? err.message : String(err),
    });
  }
};
