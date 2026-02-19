// src/state/simPhaseStore.ts
// Diagnostic phase-simulation shard — drives SimulationStatusBeacon + DiagnosticsOverlay.
// Distinct from the canonical simulationStore (Monte Carlo results).
import { create } from "zustand";
import { diag } from "@/diagnostics/DiagnosticsStore";

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

export type SimulationPhaseState = {
    phase: SimPhase;
    meta: SimRunMeta | null;
};

type Actions = {
    setPhase: (phase: SimPhase, meta?: Partial<SimRunMeta>) => void;
    startRun: (scenarioId?: string) => string;
    setProgress: (progress: number) => void;
    setConvergence: (confidenceIntervalWidth: number) => void;
    finishRun: () => void;
    failRun: (error: string) => void;
};

function newRunId() {
    return `run_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export const useSimPhaseStore = create<SimulationPhaseState & Actions>((set, get) => ({
    phase: "Idle",
    meta: null,

    setPhase: (phase, meta) =>
        set((s) => {
            const nextMeta = s.meta ? { ...s.meta, ...(meta || {}) } : (meta ? (meta as SimRunMeta) : null);
            diag("info", "sim:phase", `phase=${phase}`, { meta: nextMeta });
            return { phase, meta: nextMeta };
        }),

    startRun: (scenarioId) => {
        const runId = newRunId();
        const meta: SimRunMeta = { runId, startedAt: Date.now(), scenarioId, progress: 0 };
        diag("info", "sim:run", "startRun", meta);
        set({ phase: "ScenarioMutating", meta });
        return runId;
    },

    setProgress: (progress) =>
        set((s) => {
            if (!s.meta) return s;
            const p = Math.max(0, Math.min(1, progress));
            const meta = { ...s.meta, progress: p };
            return { meta };
        }),

    setConvergence: (confidenceIntervalWidth) =>
        set((s) => {
            if (!s.meta) return s;
            const meta = { ...s.meta, confidenceIntervalWidth };
            return { meta };
        }),

    finishRun: () =>
        set((s) => {
            if (!s.meta) return { phase: "Stable" as SimPhase, meta: null };
            const meta = { ...s.meta, finishedAt: Date.now(), progress: 1 };
            diag("info", "sim:run", "finishRun", meta);
            return { phase: "Stable" as SimPhase, meta };
        }),

    failRun: (error) =>
        set((s) => {
            const meta = s.meta
                ? { ...s.meta, finishedAt: Date.now(), error }
                : { runId: newRunId(), startedAt: Date.now(), finishedAt: Date.now(), error };
            diag("error", "sim:run", "failRun", meta);
            return { phase: "Error" as SimPhase, meta };
        })
}));
