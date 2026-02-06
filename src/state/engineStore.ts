// src/state/engineStore.ts
// STRATFIT — Single source of truth for engine / simulation state (Zustand)
// Readers: EngineStateStrip, BaselineRightPanel (System State)
// Mutator:  SimulationControlModule (in Baseline left column)

import { create } from "zustand";

// ─── Types ──────────────────────────────────────────────────────────────────
export type EngineStatus = "Idle" | "Running" | "Complete" | "Error";
export type SimMode = "Deterministic" | "Probabilistic" | "Multi-run";

// ─── Interface ──────────────────────────────────────────────────────────────
interface EngineState {
  // Core state
  status: EngineStatus;
  mode: SimMode;
  lastRunAt: number | null;
  lastRunLabel: string;
  confidencePct: number | null;

  // Dirty detection (Step 10)
  lastSimulatedHash: string | null;

  // Actions
  setMode: (mode: SimMode) => void;
  startRun: () => void;
  completeRun: (confidencePct: number, hash?: string) => void;
  failRun: () => void;
  setLastSimulatedHash: (hash: string) => void;
}

// ─── Helpers ────────────────────────────────────────────────────────────────
function deriveLastRunLabel(ts: number | null): string {
  if (ts == null) return "—";
  const delta = Math.round((Date.now() - ts) / 1000);
  if (delta < 5) return "just now";
  if (delta < 60) return `${delta}s ago`;
  if (delta < 3600) return `${Math.round(delta / 60)}m ago`;
  return `${Math.round(delta / 3600)}h ago`;
}

// ─── Store ──────────────────────────────────────────────────────────────────
export const useEngineStore = create<EngineState>((set) => ({
  status: "Idle",
  mode: "Deterministic",
  lastRunAt: null,
  lastRunLabel: "—",
  confidencePct: null,
  lastSimulatedHash: null,

  setMode: (mode) => set({ mode }),

  startRun: () =>
    set({
      status: "Running",
    }),

  completeRun: (confidencePct, hash) => {
    const now = Date.now();
    set({
      status: "Complete",
      lastRunAt: now,
      lastRunLabel: deriveLastRunLabel(now),
      confidencePct,
      ...(hash != null ? { lastSimulatedHash: hash } : {}),
    });
  },

  failRun: () => {
    const now = Date.now();
    set({
      status: "Error",
      lastRunAt: now,
      lastRunLabel: deriveLastRunLabel(now),
    });
  },

  setLastSimulatedHash: (hash) => set({ lastSimulatedHash: hash }),
}));
