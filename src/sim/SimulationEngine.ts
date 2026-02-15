import { useSimulationStore } from "./SimulationStore";

type RunArgs = {
    scenarioId?: string;
    convergenceThreshold: number; // e.g. 0.08
};

function sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
}

export async function runSimulation(args: RunArgs) {
    const store = useSimulationStore.getState();

    try {
        const runId = store.startRun(args.scenarioId);

        store.setPhase("MonteCarloRunning", { runId });
        for (let i = 1; i <= 10; i++) {
            await sleep(40);
            store.setProgress(i / 10);
        }

        store.setPhase("ConvergenceCheck");
        // deterministic placeholder CI width (later derived from results)
        const ciWidth = 0.06; // stable by default in Phase 2 stub
        store.setConvergence(ciWidth);

        if (ciWidth > args.convergenceThreshold) {
            // If not converged, do one more deterministic pass (still stub)
            store.setPhase("MonteCarloRunning");
            for (let i = 1; i <= 5; i++) {
                await sleep(40);
                store.setProgress(i / 5);
            }
            store.setPhase("ConvergenceCheck");
            store.setConvergence(0.05);
        }

        store.setPhase("ProjectionUpdate");
        // Projection engine will be pure + derived in Step 4
        await sleep(10);

        store.finishRun();
    } catch (e: any) {
        useSimulationStore.getState().failRun(e?.message || "Simulation failed");
    }
}
