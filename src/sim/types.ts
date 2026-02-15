export type SimPhase =
    | "Idle"
    | "BaselineComputed"
    | "ScenarioMutating"
    | "MonteCarloRunning"
    | "ConvergenceCheck"
    | "ProjectionUpdate"
    | "Stable"
    | "Error";

export type SimRunMeta = {
    runId: string;
    startedAt: number;
    finishedAt?: number;
    scenarioId?: string;
    confidenceIntervalWidth?: number;
    progress?: number; // 0..1
    error?: string;
};

export type SimulationState = {
    phase: SimPhase;
    meta: SimRunMeta | null;
};
