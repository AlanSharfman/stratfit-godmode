// src/core/bootstrap/simulationRunner.ts
// STRATFIT — Single Simulation Runner (Boot + Re-Run API)
// Module 1: async wrapper + cancellation boundary checks + progress callback contract

import { runCanonicalSimulation } from "@/core/engines/simulation/simulationOrchestrator";
import { useCanonicalOutputStore } from "@/core/store/useCanonicalOutputStore";
import type { EngineStage } from "@/state/engineActivityStore";

export type RunnerProgressEvent = {
  stage: EngineStage;
  iterationsCompleted?: number;
  message?: string;
};

export type RunSimulationAndStoreArgs = {
  signal?: AbortSignal;
  onProgress?: (e: RunnerProgressEvent) => void;
};

/** Throw AbortError if cancelled */
function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) {
    const err = new Error("Aborted");
    (err as any).name = "AbortError";
    throw err;
  }
}

/** Yield to the browser to avoid UI freeze at phase boundaries */
async function yieldToMain() {
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
}

/**
 * Canonical runner contract used by simulationStore.
 * - async (so UI can render status first)
 * - cancellable at phase boundaries (true mid-run cancellation requires runSimCore support)
 * - emits progress events for mission-control UI
 */
export async function runSimulationAndStore(args: RunSimulationAndStoreArgs = {}) {
  const { signal, onProgress } = args;

  onProgress?.({ stage: "INITIALIZING", message: "Initialising simulation…" });
  throwIfAborted(signal);
  await yieldToMain();

  onProgress?.({ stage: "SAMPLING", message: "Running canonical simulation core…" });
  throwIfAborted(signal);

  // NOTE: runCanonicalSimulation is currently synchronous and may be compute-heavy.
  // True mid-run cancellation requires passing `signal` into runSimCore loops.
  const output = runCanonicalSimulation({
    signal,
    onProgress,
  });

  throwIfAborted(signal);

  onProgress?.({ stage: "FINALIZING", message: "Finalising outputs…" });
  await yieldToMain();

  useCanonicalOutputStore.getState().setOutput(output);

  onProgress?.({ stage: "COMPLETE", message: "Complete." });
  return output;
}
