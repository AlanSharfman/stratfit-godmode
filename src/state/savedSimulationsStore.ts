// src/state/savedSimulationsStore.ts
// STRATFIT — Saved Simulations Store
// Persists user-saved simulations for later comparison

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LeverSnapshot, SimulationSnapshot } from './scenarioStore';

// ============================================================================
// TYPES
// ============================================================================

export interface SavedSimulation {
  id: string;
  name: string;
  description?: string;
  levers: LeverSnapshot;
  summary: {
    survivalRate: number;
    survivalPercent: string;
    arrMedian: number;
    arrP10: number;
    arrP90: number;
    runwayMedian: number;
    runwayP10: number;
    runwayP90: number;
    cashMedian: number;
    cashP10: number;
    cashP90: number;
    overallScore: number;
    overallRating: string;
  };
  // For timeline comparisons
  monthlyARR?: number[];
  monthlySurvival?: number[];
  arrBands?: { month: number; p10: number; p50: number; p90: number }[];
  // Meta
  createdAt: string; // ISO string for serialization
  isBaseline: boolean;
  tags?: string[];
}

interface SavedSimulationsState {
  // Saved simulations (persisted)
  simulations: SavedSimulation[];
  maxSimulations: number;
  
  // Currently selected for comparison
  comparisonA: string | null; // ID
  comparisonB: string | null; // ID
  
  // Actions
  saveSimulation: (simulation: Omit<SavedSimulation, 'id' | 'createdAt'>) => SavedSimulation;
  deleteSimulation: (id: string) => void;
  renameSimulation: (id: string, name: string) => void;
  setAsBaseline: (id: string) => void;
  clearBaseline: () => void;
  
  // Comparison actions
  setComparisonA: (id: string | null) => void;
  setComparisonB: (id: string | null) => void;
  swapComparison: () => void;
  
  // Getters
  getSimulation: (id: string) => SavedSimulation | undefined;
  getBaseline: () => SavedSimulation | undefined;
  getSimulationsByDate: () => SavedSimulation[];
  getSimulationsByScore: () => SavedSimulation[];
}

// Generate unique ID
const generateId = () => `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// ============================================================================
// STORE
// ============================================================================

export const useSavedSimulationsStore = create<SavedSimulationsState>()(
  persist(
    (set, get) => ({
      simulations: [],
      maxSimulations: 20,
      comparisonA: null,
      comparisonB: null,
      
      saveSimulation: (simulation) => {
        const newSimulation: SavedSimulation = {
          ...simulation,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        
        set((state) => {
          // If at max, remove oldest non-baseline
          let sims = [...state.simulations];
          if (sims.length >= state.maxSimulations) {
            const oldestNonBaseline = sims
              .filter(s => !s.isBaseline)
              .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0];
            if (oldestNonBaseline) {
              sims = sims.filter(s => s.id !== oldestNonBaseline.id);
            }
          }
          
          return {
            simulations: [newSimulation, ...sims],
          };
        });
        
        return newSimulation;
      },
      
      deleteSimulation: (id) => {
        set((state) => ({
          simulations: state.simulations.filter(s => s.id !== id),
          comparisonA: state.comparisonA === id ? null : state.comparisonA,
          comparisonB: state.comparisonB === id ? null : state.comparisonB,
        }));
      },
      
      renameSimulation: (id, name) => {
        set((state) => ({
          simulations: state.simulations.map(s =>
            s.id === id ? { ...s, name } : s
          ),
        }));
      },
      
      setAsBaseline: (id) => {
        set((state) => ({
          simulations: state.simulations.map(s => ({
            ...s,
            isBaseline: s.id === id,
          })),
        }));
      },
      
      clearBaseline: () => {
        set((state) => ({
          simulations: state.simulations.map(s => ({
            ...s,
            isBaseline: false,
          })),
        }));
      },
      
      setComparisonA: (id) => set({ comparisonA: id }),
      setComparisonB: (id) => set({ comparisonB: id }),
      
      swapComparison: () => {
        set((state) => ({
          comparisonA: state.comparisonB,
          comparisonB: state.comparisonA,
        }));
      },
      
      getSimulation: (id) => {
        return get().simulations.find(s => s.id === id);
      },
      
      getBaseline: () => {
        return get().simulations.find(s => s.isBaseline);
      },
      
      getSimulationsByDate: () => {
        return [...get().simulations].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      },
      
      getSimulationsByScore: () => {
        return [...get().simulations].sort(
          (a, b) => b.summary.overallScore - a.summary.overallScore
        );
      },
    }),
    {
      name: 'stratfit-saved-simulations',
      version: 1,
    }
  )
);

// ============================================================================
// SELECTORS
// ============================================================================

export const useSavedSimulations = () => useSavedSimulationsStore((s) => s.simulations);
export const useBaseline = () => useSavedSimulationsStore((s) => s.simulations.find(sim => sim.isBaseline));
export const useComparisonIds = () => useSavedSimulationsStore((s) => ({ a: s.comparisonA, b: s.comparisonB }));

export default useSavedSimulationsStore;

