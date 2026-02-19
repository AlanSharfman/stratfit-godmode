// src/diagnostics/simEngine.ts
// Diagnostic phase-ticker — drives SimulationStatusBeacon for dev visibility.
import { useSimPhaseStore } from "@/state/simPhaseStore";

type RunArgs = {
    scenarioId?: string;
    convergenceThreshold: number; // e.g. 0.08
};

function sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
}

export async function runSimulation(args: RunArgs) {
    const store = useSimPhaseStore.getState();

    try {
        const runId = store.startRun(args.scenarioId);

        store.setPhase("MonteCarloRunning", { runId });

        for (let i = 1; i <= 10; i++) {
            await sleep(40);
            store.setProgress(i / 10);
        }

        store.setPhase("ConvergenceCheck");
        let ciWidth = 0.06;
        store.setConvergence(ciWidth);

        if (ciWidth > args.convergenceThreshold) {
            store.setPhase("MonteCarloRunning");
            for (let i = 1; i <= 5; i++) {
                await sleep(40);
                store.setProgress(i / 5);
            }
            store.setPhase("ConvergenceCheck");
            ciWidth = 0.05;
            store.setConvergence(ciWidth);
        }

        store.setPhase("ProjectionUpdate");
        await sleep(10);

        store.finishRun();
    } catch (e: any) {
        useSimPhaseStore.getState().failRun(e?.message || "Simulation failed");
    }
}
