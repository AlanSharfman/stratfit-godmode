// src/stores/studioTimelineStore.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Studio Timeline Store
//
// Zustand store that controls the simulation timeline.
// Manages resolution, horizon, current timestep, and playback state.
// ═══════════════════════════════════════════════════════════════════════════

import { create } from "zustand";
import type {
  TimelineResolution,
  TimelineStep,
} from "@/core/simulation/timelineTypes";
import type {
  EngineTimelinePoint,
  EngineSummary,
  EngineResults,
} from "@/core/engine/types";
import {
  buildTimeline,
  deriveStepCount,
} from "@/core/simulation/buildTimeline";

// ────────────────────────────────────────────────────────────────────────────
// DEMO ENGINE — generates deterministic simulated timeline data
// ────────────────────────────────────────────────────────────────────────────

function generateEngineTimeline(steps: number): EngineTimelinePoint[] {
  const points: EngineTimelinePoint[] = [];
  const baseRevenue = 2.4;  // $2.4M starting revenue
  const baseEbitda = -0.8;  // Negative to start
  const baseEV = 12;        // $12M starting EV

  for (let i = 0; i < steps; i++) {
    const t = i / Math.max(1, steps - 1); // 0..1

    // Revenue: S-curve growth
    const revGrowth = 1 + 4.5 * (1 / (1 + Math.exp(-8 * (t - 0.4))));
    const revNoise = 1 + 0.03 * Math.sin(i * 1.7 + 0.3) + 0.02 * Math.cos(i * 2.3);
    const revenue = baseRevenue * revGrowth * revNoise;

    // EBITDA: crosses zero around t=0.35, then accelerates
    const ebitdaBase = baseEbitda + (baseEbitda * -1 + 3.2) * Math.pow(t, 1.3);
    const ebitda = ebitdaBase * (1 + 0.04 * Math.sin(i * 1.2));

    // Risk: starts moderate, spikes mid-journey, then declines
    const riskBase = 0.35 + 0.3 * Math.exp(-4 * Math.pow(t - 0.45, 2));
    const riskNoise = 0.03 * Math.sin(i * 2.1 + 1.5);
    const riskIndex = Math.max(0, Math.min(1, riskBase + riskNoise));

    // Enterprise Value: exponential with inflection
    const evGrowth = 1 + 6 * Math.pow(t, 1.8);
    const enterpriseValue = baseEV * evGrowth * (1 + 0.02 * Math.sin(i * 0.9));

    points.push({
      timeIndex: i,
      revenue: Math.round(revenue * 100) / 100,
      ebitda: Math.round(ebitda * 100) / 100,
      riskIndex: Math.round(riskIndex * 1000) / 1000,
      enterpriseValue: Math.round(enterpriseValue * 100) / 100,
    });
  }

  return points;
}

function summarizeTimeline(timeline: EngineTimelinePoint[]): EngineSummary {
  if (timeline.length === 0) {
    return { peakRevenue: 0, peakEV: 0, avgRiskIndex: 0, terminalEbitda: 0, cagr: 0 };
  }

  const peakRevenue = Math.max(...timeline.map((p) => p.revenue));
  const peakEV = Math.max(...timeline.map((p) => p.enterpriseValue));
  const avgRiskIndex =
    timeline.reduce((s, p) => s + p.riskIndex, 0) / timeline.length;
  const terminalEbitda = timeline[timeline.length - 1].ebitda;
  const startEV = timeline[0].enterpriseValue;
  const endEV = timeline[timeline.length - 1].enterpriseValue;
  const years = timeline.length > 1 ? (timeline.length - 1) / 12 : 1;
  const cagr = years > 0 ? Math.pow(endEV / Math.max(0.01, startEV), 1 / years) - 1 : 0;

  return {
    peakRevenue: Math.round(peakRevenue * 100) / 100,
    peakEV: Math.round(peakEV * 100) / 100,
    avgRiskIndex: Math.round(avgRiskIndex * 1000) / 1000,
    terminalEbitda: Math.round(terminalEbitda * 100) / 100,
    cagr: Math.round(cagr * 10000) / 10000,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// STORE SHAPE
// ────────────────────────────────────────────────────────────────────────────

interface StudioTimelineState {
  // Configuration
  resolution: TimelineResolution;
  horizon: number;

  // Generated timeline
  timeline: TimelineStep[];
  engineResults: EngineResults | null;

  // Playback
  currentStep: number;
  isPlaying: boolean;

  // Actions
  setResolution: (r: TimelineResolution) => void;
  setHorizon: (h: number) => void;
  generateTimeline: () => void;
  setStep: (step: number) => void;
  play: () => void;
  pause: () => void;
  reset: () => void;
}

// ────────────────────────────────────────────────────────────────────────────
// PLAYBACK INTERVAL
// ────────────────────────────────────────────────────────────────────────────

let playbackInterval: ReturnType<typeof setInterval> | null = null;

function clearPlayback() {
  if (playbackInterval !== null) {
    clearInterval(playbackInterval);
    playbackInterval = null;
  }
}

// ────────────────────────────────────────────────────────────────────────────
// STORE
// ────────────────────────────────────────────────────────────────────────────

export const useStudioTimelineStore = create<StudioTimelineState>((set, get) => ({
  // Defaults
  resolution: "quarterly",
  horizon: 5,
  timeline: [],
  engineResults: null,
  currentStep: 0,
  isPlaying: false,

  setResolution: (resolution) => {
    clearPlayback();
    set({ resolution, isPlaying: false, currentStep: 0, timeline: [], engineResults: null });
  },

  setHorizon: (horizon) => {
    clearPlayback();
    const clamped = Math.max(1, Math.min(10, horizon));
    set({ horizon: clamped, isPlaying: false, currentStep: 0, timeline: [], engineResults: null });
  },

  generateTimeline: () => {
    clearPlayback();
    const { resolution, horizon } = get();
    const steps = deriveStepCount(resolution, horizon);
    const config = { resolution, horizon, steps };
    const series = buildTimeline(config);
    const engineTimeline = generateEngineTimeline(series.steps.length);
    const summary = summarizeTimeline(engineTimeline);

    set({
      timeline: series.steps,
      engineResults: { timeline: engineTimeline, summary },
      currentStep: 0,
      isPlaying: false,
    });
  },

  setStep: (step) => {
    const { timeline } = get();
    const clamped = Math.max(0, Math.min(timeline.length - 1, step));
    set({ currentStep: clamped });
  },

  play: () => {
    const { timeline, isPlaying } = get();
    if (isPlaying || timeline.length === 0) return;

    set({ isPlaying: true });

    playbackInterval = setInterval(() => {
      const { currentStep, timeline: tl, isPlaying: playing } = get();
      if (!playing) {
        clearPlayback();
        return;
      }
      if (currentStep >= tl.length - 1) {
        clearPlayback();
        set({ isPlaying: false });
        return;
      }
      set({ currentStep: currentStep + 1 });
    }, 120);
  },

  pause: () => {
    clearPlayback();
    set({ isPlaying: false });
  },

  reset: () => {
    clearPlayback();
    set({ currentStep: 0, isPlaying: false });
  },
}));

/**
 * Non-React accessor for imperative contexts.
 */
export const studioTimeline = {
  get: () => useStudioTimelineStore.getState(),
  setStep: (s: number) => useStudioTimelineStore.getState().setStep(s),
  play: () => useStudioTimelineStore.getState().play(),
  pause: () => useStudioTimelineStore.getState().pause(),
  reset: () => useStudioTimelineStore.getState().reset(),
};
