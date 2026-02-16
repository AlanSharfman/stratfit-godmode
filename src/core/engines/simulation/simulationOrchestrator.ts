// src/core/engines/simulation/simulationOrchestrator.ts
// STRATFIT — THE ONLY SIMULATION ENTRY POINT
// Phase 5 Simulation Orchestration Lock

import { readSimulationInputs } from "./readInputs";
import { seedFromInputs } from "./seed";
import { runSimCore } from "./simCore";
import { computeLiquidity } from "@/core/engines/liquidity/liquidityEngine";
import { computeValuation } from "@/core/engines/valuation/valuationEngine";
import { generateCommentary } from "@/core/engines/commentary/commentaryEngine";
import type { CanonicalSimulationOutput } from "./canonicalOutput";

import { useStratfitStore } from "@/core/store/useStratfitStore";

function now() {
    return Date.now();
}

export function runCanonicalSimulation(): CanonicalSimulationOutput {
    const inputs = readSimulationInputs();
    const seed = seedFromInputs(inputs);

    const core = runSimCore({ ...inputs, seed });

    // liquidity derives from distributions; cash/burn can later be canonical inputs
    const cashNow = useStratfitStore.getState().liquidity.cash;
    const monthlyBurn = useStratfitStore.getState().liquidity.monthlyBurn;

    const liquidity = computeLiquidity({
        cashNow,
        cashSeriesP50: core.distributions.cashP50,
        monthlyBurn,
    });

    const valuation = computeValuation({
        valuationP50: core.distributions.valuationP50,
        valuationP25: core.distributions.valuationP25,
        valuationP75: core.distributions.valuationP75,
    });

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

    // WRITE BACK to canonical store (Studio writes inputs; orchestrator writes outputs)
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

    return output;
}
