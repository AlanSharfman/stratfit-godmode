import { create } from "zustand";
import type { ShlWeights, SemanticLayerKey } from "./shlContracts";
import { DEFAULT_SHL_WEIGHTS } from "./shlContracts";

/**
 * Global semantic balance store.
 *
 * Single source of truth for all semantic layer intensity weights.
 * Each shader injection reads its weight from here and multiplies
 * its intensity uniform accordingly.
 *
 * Adjusting a weight here alters the visual intensity of that layer
 * across the entire terrain in real-time (no shader recompile needed).
 */
interface SemanticBalanceState {
    weights: ShlWeights;
    setWeight: (key: SemanticLayerKey, value: number) => void;
    setWeights: (partial: Partial<ShlWeights>) => void;
    resetWeights: () => void;
}

export const useSemanticBalance = create<SemanticBalanceState>((set) => ({
    weights: { ...DEFAULT_SHL_WEIGHTS },

    setWeight: (key, value) =>
        set((state) => ({
            weights: { ...state.weights, [key]: Math.max(0, Math.min(2, value)) },
        })),

    setWeights: (partial) =>
        set((state) => ({
            weights: { ...state.weights, ...partial },
        })),

    resetWeights: () =>
        set({ weights: { ...DEFAULT_SHL_WEIGHTS } }),
}));

/**
 * Get the current weight for a semantic layer.
 * Use inside R3F useFrame or useEffect for real-time modulation.
 */
export function getSemanticWeight(key: SemanticLayerKey): number {
    return useSemanticBalance.getState().weights[key];
}
