// src/components/command/director/DirectorScript.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Director Mode Script (Cinematic Intelligence Theatre v2)
//
// Defines the scripted 8-beat sequence for terrain-aware Investor Briefing.
// Each beat controls: camera, highlight, laser anchor, transcript line,
// tile emphasis, and optional marker highlights + pacing.
//
// Pure data — no React, no side effects.
// ═══════════════════════════════════════════════════════════════════════════

// ────────────────────────────────────────────────────────────────────────────
// TYPES
// ────────────────────────────────────────────────────────────────────────────

export type CameraShot = "wide" | "track" | "zoom" | "pan";

export type HighlightType =
  | "trajectory"
  | "risk_zone"
  | "valuation_peak"
  | "probability_band"
  | "leverage_nodes"
  | "terrain_surface"
  | "none";

export type TileEmphasis = "ev" | "risk" | "dispersion" | "runway";

export interface Beat {
  id: string;
  title: string;
  durationMs: number;
  cameraShot: CameraShot;
  highlightType: HighlightType;
  laserTargetKey: string | null;
  transcriptLine: string;
  tileOverrides: TileEmphasis[] | null;
  /** Camera target key consumed by TerrainTheatre for precise framing */
  cameraTarget: string | null;
  /** Marker keys to highlight on terrain during this beat */
  highlightMarkers: string[];
  /** Suggested dwell time in ms before auto-advancing (director pacing) */
  pauseMs: number;
}

// ────────────────────────────────────────────────────────────────────────────
// DEFAULT INTELLIGENCE BRIEFING SCRIPT (8 beats, terrain-aware)
// ────────────────────────────────────────────────────────────────────────────

// Total duration: 8+8+8+8+7+8+7+6 = 60 seconds
export const INTELLIGENCE_BRIEFING_SCRIPT: Beat[] = [
  {
    id: "headline",
    title: "The Headline",
    durationMs: 8000,
    cameraShot: "wide",
    highlightType: "none",
    laserTargetKey: null,
    transcriptLine:
      "Here's the bottom line — the model reads this scenario against your baseline, and the verdict comes down to value trajectory, structural risk, and path resilience. Everything here is probability-weighted, not a forecast.",
    tileOverrides: null,
    cameraTarget: "wide_overview",
    highlightMarkers: [],
    pauseMs: 8000,
  },
  {
    id: "landscape",
    title: "Reading the Landscape",
    durationMs: 8000,
    cameraShot: "pan",
    highlightType: "terrain_surface",
    laserTargetKey: "roughness_zone",
    transcriptLine:
      "The terrain encodes your company's growth trajectory as elevation, operational friction as surface roughness, and strategic leverage as ridge structures. The shape you see is a direct read of the simulation's probability dynamics.",
    tileOverrides: ["risk"],
    cameraTarget: "terrain_surface",
    highlightMarkers: ["roughness_zone"],
    pauseMs: 8000,
  },
  {
    id: "risk_concentration",
    title: "Where Risk Concentrates",
    durationMs: 8000,
    cameraShot: "zoom",
    highlightType: "risk_zone",
    laserTargetKey: "risk_peak",
    transcriptLine:
      "Risk concentration appears where multiple structural pressures converge. Hotspots on the terrain surface indicate zones where the probability distribution skews toward adverse outcomes — these are the points that deserve the closest attention.",
    tileOverrides: ["risk", "runway"],
    cameraTarget: "risk_peak",
    highlightMarkers: ["risk_peak"],
    pauseMs: 8000,
  },
  {
    id: "value_architecture",
    title: "Value Architecture",
    durationMs: 8000,
    cameraShot: "track",
    highlightType: "valuation_peak",
    laserTargetKey: "valuation_peak",
    transcriptLine:
      "Enterprise value synthesis blends DCF, revenue multiple, and EBITDA multiple methodologies. The P50 represents the probability-weighted centre. Value drivers and headwinds are identified through the waterfall attribution.",
    tileOverrides: ["ev", "dispersion"],
    cameraTarget: "valuation_peak",
    highlightMarkers: ["ev_trajectory"],
    pauseMs: 8000,
  },
  {
    id: "strategic_path",
    title: "The Strategic Path",
    durationMs: 7000,
    cameraShot: "track",
    highlightType: "trajectory",
    laserTargetKey: "revenue_engine",
    transcriptLine:
      "The strategic path traces the most probable execution route across the terrain. Path stress indicates sensitivity to assumption changes. The growth engine versus churn dynamic determines whether the path gains or loses momentum.",
    tileOverrides: ["ev", "runway"],
    cameraTarget: "path_trajectory",
    highlightMarkers: ["revenue_engine", "inflection_point"],
    pauseMs: 7000,
  },
  {
    id: "probability_architecture",
    title: "Probability Architecture",
    durationMs: 8000,
    cameraShot: "wide",
    highlightType: "probability_band",
    laserTargetKey: "capital_efficiency",
    transcriptLine:
      "The probability architecture defines the outcome space — upside, base case, and stress scenarios, each weighted by the model. Combined with terrain-path robustness, this tells you how much confidence to place in the central estimate.",
    tileOverrides: ["dispersion", "risk"],
    cameraTarget: "probability_band",
    highlightMarkers: ["capital_efficiency"],
    pauseMs: 8000,
  },
  {
    id: "model_interpretation",
    title: "What the Model Sees",
    durationMs: 7000,
    cameraShot: "wide",
    highlightType: "none",
    laserTargetKey: null,
    transcriptLine:
      "Combining terrain difficulty, path resilience, and valuation structure, the model forms an overall posture on this scenario. The terrain-path lens is how every milestone probability should be read.",
    tileOverrides: ["ev", "risk"],
    cameraTarget: "wide_overview",
    highlightMarkers: [],
    pauseMs: 7000,
  },
  {
    id: "next_moves",
    title: "Next Moves",
    durationMs: 6000,
    cameraShot: "wide",
    highlightType: "none",
    laserTargetKey: null,
    transcriptLine:
      "These are probability indicators, not instructions. The model quantifies outcomes under stated assumptions — change the inputs and the landscape shifts. Re-run whenever your baseline moves or market conditions change materially.",
    tileOverrides: null,
    cameraTarget: "wide_overview",
    highlightMarkers: [],
    pauseMs: 6000,
  },
];
