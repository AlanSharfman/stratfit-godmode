// src/core/engines/simulation/simulationOrchestrator.ts
// STRATFIT — THE ONLY SIMULATION ENTRY POINT
// Phase 5 Simulation Orchestration Lock
// Module 1: accept optional AbortSignal + progress callbacks (phase boundary cancellation)

import { readSimulationInputs } from "./readInputs";
import { seedFromInputs } from "./seed";
import { runSimCore } from "./simCore";
import { computeLiquidity } from "@/core/engines/liquidity/liquidityEngine";
import { computeValuation } from "@/core/engines/valuation/valuationEngine";
import { generateCommentary } from "@/core/engines/commentary/commentaryEngine";
import type { CanonicalSimulationOutput } from "./canonicalOutput";
import { useStratfitStore } from "@/core/store/useStratfitStore";
import type { EngineStage } from "@/state/engineActivityStore";

type ProgressEvent = {
  stage: EngineStage;
  message?: string;
  iterationsCompleted?: number;
};

export type RunCanonicalSimulationArgs = {
  signal?: AbortSignal;
  onProgress?: (e: ProgressEvent) => void;
};

function now() {
  return Date.now();
}

function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) {
    const err = new Error("Aborted");
    (err as any).name = "AbortError";
    throw err;
  }
}

export function runCanonicalSimulation(args: RunCanonicalSimulationArgs = {}): CanonicalSimulationOutput {
  const { signal, onProgress } = args;

  onProgress?.({ stage: "INITIALIZING", message: "Reading inputs…" });
  throwIfAborted(signal);
  const inputs = readSimulationInputs();

  onProgress?.({ stage: "INITIALIZING", message: "Seeding deterministic run…" });
  const seed = seedFromInputs(inputs);
  throwIfAborted(signal);

  // ─────────────────────────────────────────────────────────────
  // CORE SIMULATION
  // ─────────────────────────────────────────────────────────────
  onProgress?.({ stage: "SAMPLING", message: "Running sim core…" });
  throwIfAborted(signal);

  // IMPORTANT: pass signal through so runSimCore can check it internally (Phase 1.1)
  const core = runSimCore({ ...inputs, seed, signal, onProgress } as any);

  throwIfAborted(signal);

  // ─────────────────────────────────────────────────────────────
  // DERIVED ENGINES
  // ─────────────────────────────────────────────────────────────
  onProgress?.({ stage: "AGGREGATING", message: "Computing liquidity…" });

  const cashNow = useStratfitStore.getState().liquidity.cash;
  const monthlyBurn = useStratfitStore.getState().liquidity.monthlyBurn;

  const liquidity = computeLiquidity({
    cashNow,
    cashSeriesP50: core.distributions.cashP50,
    monthlyBurn,
  });

  throwIfAborted(signal);

  onProgress?.({ stage: "AGGREGATING", message: "Computing valuation…" });

  const valuation = computeValuation({
    valuationP50: core.distributions.valuationP50,
    valuationP25: core.distributions.valuationP25,
    valuationP75: core.distributions.valuationP75,
  });

  throwIfAborted(signal);

  onProgress?.({ stage: "FINALIZING", message: "Generating commentary…" });

  const commentary = generateCommentary({
    survivalProbability: core.survivalProbability,
    runwayMonths: liquidity.runwayMonths,
    confidenceIndex: core.confidenceIndex,
  });

  const output: CanonicalSimulationOutput = {
    runId: `run_${seed.toString(16)}`,
    version: "v1",
    inputs,
    simulation: {
      survivalProbability: core.survivalProbability,
      confidenceIndex: core.confidenceIndex,
      volatility: core.volatility,
      distributions: core.distributions,
    },
    liquidity,
    valuation,
    commentary,
    meta: {
      createdAt: now(),
      deterministicSeed: seed,
    },
  };

  // ─────────────────────────────────────────────────────────────
  // WRITE BACK to canonical store (Studio writes inputs; orchestrator writes outputs)
  // ─────────────────────────────────────────────────────────────
  onProgress?.({ stage: "FINALIZING", message: "Writing outputs to canonical store…" });

  const { setLiquidity, setValuation, setSimulation } = useStratfitStore.getState();

  setSimulation({
    survivalProbability: output.simulation.survivalProbability,
    confidenceIndex: output.simulation.confidenceIndex,
    volatility: output.simulation.volatility,
  });

  setLiquidity({
    runwayMonths: output.liquidity.runwayMonths,
    cashDistribution: output.liquidity.cashDistribution,
  });

  setValuation({
    baseValue: output.valuation.baseValue,
    probabilityBandLow: output.valuation.probabilityBandLow,
    probabilityBandHigh: output.valuation.probabilityBandHigh,
  });

  onProgress?.({ stage: "COMPLETE", message: "Canonical simulation complete." });
  return output;
}
