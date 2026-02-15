import { create } from "zustand";
import type { StrategicInputs } from "./silContracts";
import { DEFAULT_STRATEGIC_INPUTS } from "./silContracts";

/**
 * Single source of truth for all strategic inputs.
 *
 * Zustand store — deterministic, synchronous, no side effects.
 * UI components write here; the simulation bridge reads from here.
 * No shader mutation happens in this store — it's purely data.
 *
 * Flow: input → store → simulation bridge → morph targets → render
 */
interface StrategicInputStore {
    inputs: StrategicInputs;

    /** Set a single input field */
    setInput: <K extends keyof StrategicInputs>(key: K, value: StrategicInputs[K]) => void;

    /** Batch update multiple inputs */
    setInputs: (partial: Partial<StrategicInputs>) => void;

    /** Reset all inputs to baseline defaults */
    reset: () => void;
}

export const useStrategicInputStore = create<StrategicInputStore>((set) => ({
    inputs: { ...DEFAULT_STRATEGIC_INPUTS },

    setInput: (key, value) =>
        set((state) => ({
            inputs: { ...state.inputs, [key]: value },
        })),

    setInputs: (partial) =>
        set((state) => ({
            inputs: { ...state.inputs, ...partial },
        })),

    reset: () =>
        set({ inputs: { ...DEFAULT_STRATEGIC_INPUTS } }),
}));

/**
 * Non-reactive getter for reading current inputs outside React.
 */
export function getStrategicInputs(): StrategicInputs {
    return useStrategicInputStore.getState().inputs;
}
