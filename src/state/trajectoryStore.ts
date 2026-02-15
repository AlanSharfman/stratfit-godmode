import { create } from "zustand";
import type { TrajectoryVector, TrajectoryInsight } from "@/types/trajectory";

// ============================================================================
// TRAJECTORY STORE - Unified state for dual-path trajectory rendering
// Phase 2: Supports baseline + scenario paths with divergence visualization
// Backward-compatible aliases: vectors, path, nodes
// ============================================================================

type TrajectoryState = {
  // Canonical (new)
  baselineVectors: TrajectoryVector[];
  scenarioVectors: TrajectoryVector[];
  insights: TrajectoryInsight[];

  // Selection UI
  selectedInsightId: string | null;
  hoveredInsightId: string | null;

  // Actions
  setBaselineVectors: (v: TrajectoryVector[]) => void;
  setScenarioVectors: (v: TrajectoryVector[]) => void;
  setInsights: (i: TrajectoryInsight[]) => void;
  setSelectedInsightId: (id: string | null) => void;
  setHoveredInsightId: (id: string | null) => void;

  // ------------------------------------------------------------
  // Backward-compatible aliases (to stop legacy components breaking)
  // ------------------------------------------------------------
  vectors: TrajectoryVector[]; // alias of baselineVectors
  path: TrajectoryVector[]; // alias of baselineVectors
  nodes: TrajectoryInsight[]; // alias of insights
};

export const useTrajectoryStore = create<TrajectoryState>((set) => ({
  baselineVectors: [],
  scenarioVectors: [],
  insights: [],

  selectedInsightId: null,
  hoveredInsightId: null,

  setBaselineVectors: (v) =>
    set({
      baselineVectors: v,
      vectors: v,
      path: v,
    }),

  setScenarioVectors: (v) => set({ scenarioVectors: v }),

  setInsights: (i) =>
    set({
      insights: i,
      nodes: i,
    }),

  setSelectedInsightId: (id) => set({ selectedInsightId: id }),
  setHoveredInsightId: (id) => set({ hoveredInsightId: id }),

  // aliases initial
  vectors: [],
  path: [],
  nodes: [],
}));

