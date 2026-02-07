// src/state/uiStore.ts
// STRATFIT — Holographic Activation + Oracle Protocol + Orbital Drop System
// Tracks activeGroup, isDragging, riskLevel, focusedLever, and hasInteracted

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type SliderGroup = 'growth' | 'efficiency' | 'risk' | null;

// Oracle Protocol: Lever IDs for contextual intelligence
export type LeverFocusId = 
  | 'revenueGrowth' | 'pricingAdjustment' | 'marketingSpend'
  | 'operatingExpenses' | 'headcount' | 'cashSensitivity'
  | 'churnSensitivity' | 'fundingInjection'
  | null;

export type MountainRenderer = "3d" | "25d";
export type MountainMode = "auto" | "3d" | "locked" | "safe";

interface UIState {
  // Which slider group is currently active (stays lit for 10s after release)
  activeGroup: SliderGroup;
  // Is the user currently holding/dragging a slider?
  isDragging: boolean;
  // Timer ID for the 10-second fade
  fadeTimerId: number | null;
  // Risk level (0-100) for mountain seismic distortion
  riskLevel: number;
  // Has the user ever interacted with controls? (Triggers Orbital Drop)
  hasInteracted: boolean;
  
  // ORACLE PROTOCOL: Which lever is currently hovered (for contextual intelligence)
  focusedLever: LeverFocusId;
  
  // VOICE MODE: AI reads out intelligence when hovering sliders
  isVoiceEnabled: boolean;
  
  // NEURAL BOOT: Signals mountain to pulse when KPI boot completes
  neuralBootComplete: boolean;
  bootPhase: 'idle' | 'chassis' | 'resilience' | 'momentum' | 'stability' | 'complete';

  // MOUNTAIN RENDERER: allow 3D (WebGL) or 2.5D (canvas) modes
  mountainRenderer: MountainRenderer;
  // User-facing policy
  mountainMode: MountainMode;
  // Auto-quality controls for WebGL protection
  mountainDprCap: 2 | 1.5 | 1;
  lastMountainFallbackReason?: "fps" | "context_lost" | "manual";
  
  // Actions
  setActiveGroup: (group: SliderGroup) => void;
  setDragging: (dragging: boolean) => void;
  setRiskLevel: (level: number) => void;
  setInteracted: () => void;
  setFocusedLever: (id: LeverFocusId) => void;
  toggleVoice: () => void;
  setNeuralBootComplete: (complete: boolean) => void;
  setBootPhase: (phase: UIState['bootPhase']) => void;
  setMountainRenderer: (renderer: MountainRenderer) => void;
  setMountainMode: (mode: MountainMode) => void;
  setMountainDprCap: (cap: 2 | 1.5 | 1) => void;
  setMountainFallback: (reason: UIState["lastMountainFallbackReason"]) => void;
  retryMountain3d: () => void;
  
  // Combined action for slider start (clears timer, sets group, sets dragging, marks interaction)
  startSlider: (group: SliderGroup) => void;
  // Combined action for slider end (clears dragging, starts 10s timer)
  endSlider: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
  activeGroup: null,
  isDragging: false,
  fadeTimerId: null,
  riskLevel: 30, // Default stable
  hasInteracted: false,
  focusedLever: null,
  isVoiceEnabled: false, // Voice Mode OFF by default
  neuralBootComplete: false,
  bootPhase: 'complete', // GOD MODE: Start complete - widgets always visible immediately
  // Default: match the canonical 3D mountain (5181 look),
  // but allow Auto to protect weaker devices.
  mountainRenderer: "3d",
  mountainMode: "auto",
  mountainDprCap: 2,
  lastMountainFallbackReason: undefined,
  
  setActiveGroup: (group) => set({ activeGroup: group }),
  setDragging: (dragging) => set({ isDragging: dragging }),
  setRiskLevel: (level) => set({ riskLevel: Math.max(0, Math.min(100, level)) }),
  setInteracted: () => set({ hasInteracted: true }),
  setFocusedLever: (id) => set({ focusedLever: id }),
  toggleVoice: () => set((state) => ({ isVoiceEnabled: !state.isVoiceEnabled })),
  setNeuralBootComplete: (complete) => set({ neuralBootComplete: complete }),
  setBootPhase: (phase) => set({ bootPhase: phase }),
  setMountainRenderer: (renderer) => set({ mountainRenderer: renderer }),
  setMountainMode: (mode) => {
    // Mode selection also sets the renderer deterministically.
    if (mode === "safe") {
      set({ mountainMode: mode, mountainRenderer: "25d", lastMountainFallbackReason: "manual" });
      return;
    }
    if (mode === "3d") {
      set({ mountainMode: mode, mountainRenderer: "3d", mountainDprCap: 2, lastMountainFallbackReason: "manual" });
      return;
    }
    if (mode === "locked") {
      // Locked WebGL: keep 3D renderer but cap DPR to reduce load and disable interactive orbit.
      set({ mountainMode: mode, mountainRenderer: "3d", mountainDprCap: 1.5, lastMountainFallbackReason: "manual" });
      return;
    }
    // auto
    set({ mountainMode: mode, mountainRenderer: "3d", mountainDprCap: 2, lastMountainFallbackReason: undefined });
  },
  setMountainDprCap: (cap) => set({ mountainDprCap: cap }),
  setMountainFallback: (reason) => set({ mountainRenderer: "25d", lastMountainFallbackReason: reason }),
  retryMountain3d: () => {
    const { mountainMode } = get();
    if (mountainMode !== "auto" && mountainMode !== "locked") return;
    set({
      mountainRenderer: "3d",
      mountainDprCap: mountainMode === "locked" ? 1.5 : 2,
      lastMountainFallbackReason: undefined,
    });
  },
  
  // Called when user starts dragging a slider
  startSlider: (group) => {
    const { fadeTimerId } = get();
    
    // Clear any existing fade timer
    if (fadeTimerId !== null) {
      window.clearTimeout(fadeTimerId);
    }
    
    set({
      activeGroup: group,
      isDragging: true,
      fadeTimerId: null,
      hasInteracted: true, // Mark interaction on first slider touch
    });
  },
  
  // Called when user releases the slider
  endSlider: () => {
    set({ isDragging: false });
    
    // Start 10-second timer to clear activeGroup
    const timerId = window.setTimeout(() => {
      set({ activeGroup: null, fadeTimerId: null });
    }, 10000);
    
    set({ fadeTimerId: timerId });
  },
    }),
    {
      name: "stratfit-ui",
      partialize: (s) => ({ mountainMode: s.mountainMode }),
      onRehydrateStorage: () => (state) => {
        // Re-apply the mode so derived fields (renderer/DPR cap) are consistent.
        if (state?.mountainMode) state.setMountainMode(state.mountainMode);
      },
    }
  )
);
