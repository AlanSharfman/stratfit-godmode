import { create } from "zustand";
import type { SimulationState, SimPhase, SimRunMeta } from "./types";

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

export const useSimulationStore = create<SimulationState & Actions>((set, get) => ({
    phase: "Idle",
    meta: null,

    setPhase: (phase, meta) =>
        set((s) => ({
            phase,
            meta: s.meta ? { ...s.meta, ...(meta || {}) } : (meta ? (meta as SimRunMeta) : null)
        })),

    startRun: (scenarioId) => {
        const runId = newRunId();
        set({
            phase: "ScenarioMutating",
            meta: { runId, startedAt: Date.now(), scenarioId, progress: 0 }
        });
        return runId;
    },

    setProgress: (progress) =>
        set((s) => ({
            meta: s.meta ? { ...s.meta, progress: Math.max(0, Math.min(1, progress)) } : s.meta
        })),

    setConvergence: (confidenceIntervalWidth) =>
        set((s) => ({
            meta: s.meta ? { ...s.meta, confidenceIntervalWidth } : s.meta
        })),

    finishRun: () =>
        set((s) => ({
            phase: "Stable",
            meta: s.meta ? { ...s.meta, finishedAt: Date.now(), progress: 1 } : s.meta
        })),

    failRun: (error) =>
        set((s) => ({
            phase: "Error",
            meta: s.meta ? { ...s.meta, finishedAt: Date.now(), error } : { runId: newRunId(), startedAt: Date.now(), finishedAt: Date.now(), error }
        }))
}));
