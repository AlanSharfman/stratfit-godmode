// src/core/store/useCanonicalOutputStore.ts
// STRATFIT — Canonical Output Store (Cross-Module Identical Rendering)
// Phase 5 Simulation Orchestration Lock

import { create } from "zustand";
import type { CanonicalSimulationOutput } from "@/core/engines/simulation/canonicalOutput";

interface CanonicalOutputStore {
    output: CanonicalSimulationOutput | null;
    setOutput: (output: CanonicalSimulationOutput) => void;
}

export const useCanonicalOutputStore = create<CanonicalOutputStore>((set) => ({
    output: null,
    setOutput: (output) => set({ output }),
}));
