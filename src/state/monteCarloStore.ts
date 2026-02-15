import { create } from "zustand";
import type {
  MonteCarloConfig,
  MonteCarloResult,
  MonteCarloParticle,
} from "@/types/simulation";

// ============================================================================
// MONTE CARLO STORE
// ============================================================================

type MonteCarloState = {
  // Configuration
  config: MonteCarloConfig;
  setConfig: (config: Partial<MonteCarloConfig>) => void;

  // Simulation state
  isRunning: boolean;
  progress: number; // 0-1
  particles: MonteCarloParticle[];

  // Results
  result: MonteCarloResult | null;
  history: MonteCarloResult[];

  // Actions
  startSimulation: () => void;
  stopSimulation: () => void;
  setParticles: (particles: MonteCarloParticle[]) => void;
  setResult: (result: MonteCarloResult) => void;
  setProgress: (progress: number) => void;
  clearHistory: () => void;
};

export const useMonteCarloStore = create<MonteCarloState>((set, get) => ({
  // Default configuration
  config: {
    particleCount: 500,
    simulationRuns: 1000,
    confidenceInterval: 0.95,
    volatilityFactor: 0.15,
  },

  setConfig: (config) =>
    set((state) => ({
      config: { ...state.config, ...config },
    })),

  // State
  isRunning: false,
  progress: 0,
  particles: [],
  result: null,
  history: [],

  // Actions
  startSimulation: () => set({ isRunning: true, progress: 0 }),
  stopSimulation: () => set({ isRunning: false }),

  setParticles: (particles) => set({ particles }),

  setResult: (result) =>
    set((state) => ({
      result,
      history: [...state.history.slice(-9), result], // Keep last 10
      isRunning: false,
      progress: 1,
    })),

  setProgress: (progress) => set({ progress }),

  clearHistory: () => set({ history: [], result: null }),
}));
