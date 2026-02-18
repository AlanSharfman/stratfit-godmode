// src/state/leverStore.ts
// STRATFIT — Lever State Management Store

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LeverSnapshot } from './scenarioStore';
import { safeLocalStoragePersist } from './safePersistStorage';

// Default lever values
const DEFAULT_LEVERS: LeverSnapshot = {
  demandStrength: 50,
  pricingPower: 50,
  expansionVelocity: 50,
  costDiscipline: 50,
  hiringIntensity: 50,
  operatingDrag: 50,
  marketVolatility: 50,
  executionRisk: 50,
  fundingPressure: 50,
};

interface LeverState {
  // Current lever values
  levers: LeverSnapshot;
  
  // History for undo
  history: LeverSnapshot[];
  historyIndex: number;
  
  // Actions
  setLever: (key: keyof LeverSnapshot, value: number) => void;
  setLevers: (levers: Partial<LeverSnapshot>) => void;
  resetLevers: () => void;
  
  // Undo/Redo
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  
  // Snapshot management
  saveSnapshot: () => void;
  loadSnapshot: (snapshot: LeverSnapshot) => void;
}

export const useLeverStore = create<LeverState>()(
  persist(
    (set, get) => ({
      levers: { ...DEFAULT_LEVERS },
      history: [{ ...DEFAULT_LEVERS }],
      historyIndex: 0,
      
      setLever: (key, value) => {
        const newLevers = { ...get().levers, [key]: value };
        const history = get().history.slice(0, get().historyIndex + 1);
        set({
          levers: newLevers,
          history: [...history, newLevers],
          historyIndex: history.length,
        });
      },
      
      setLevers: (partial) => {
        const newLevers = { ...get().levers, ...partial } as LeverSnapshot;
        const history = get().history.slice(0, get().historyIndex + 1);
        set({
          levers: newLevers,
          history: [...history, newLevers],
          historyIndex: history.length,
        });
      },
      
      resetLevers: () => {
        const history = get().history.slice(0, get().historyIndex + 1);
        set({
          levers: { ...DEFAULT_LEVERS },
          history: [...history, { ...DEFAULT_LEVERS }],
          historyIndex: history.length,
        });
      },
      
      undo: () => {
        const { historyIndex, history } = get();
        if (historyIndex > 0) {
          set({
            levers: history[historyIndex - 1],
            historyIndex: historyIndex - 1,
          });
        }
      },
      
      redo: () => {
        const { historyIndex, history } = get();
        if (historyIndex < history.length - 1) {
          set({
            levers: history[historyIndex + 1],
            historyIndex: historyIndex + 1,
          });
        }
      },
      
      canUndo: () => get().historyIndex > 0,
      canRedo: () => get().historyIndex < get().history.length - 1,
      
      saveSnapshot: () => {
        const snapshot = { ...get().levers };
        const history = get().history.slice(0, get().historyIndex + 1);
        set({
          history: [...history, snapshot],
          historyIndex: history.length,
        });
      },
      
      loadSnapshot: (snapshot) => {
        const history = get().history.slice(0, get().historyIndex + 1);
        set({
          levers: { ...snapshot },
          history: [...history, snapshot],
          historyIndex: history.length,
        });
      },
    }),
    {
      name: 'stratfit-levers',
      storage: safeLocalStoragePersist(),
    }
  )
);

// Convenience selectors
export const useLevers = () => useLeverStore((s) => s.levers);
export const useLever = (key: keyof LeverSnapshot) => useLeverStore((s) => s.levers[key]);

export default useLeverStore;

