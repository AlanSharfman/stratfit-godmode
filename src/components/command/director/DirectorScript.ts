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

// Total duration: 7+8+7+7+7+6+9+9 = 60 seconds
export const INTELLIGENCE_BRIEFING_SCRIPT: Beat[] = [
  {
    id: "strategic_orientation",
    title: "Strategic Orientation",
    durationMs: 7000,
    cameraShot: "wide",
    highlightType: "none",
    laserTargetKey: null,
    transcriptLine:
      "This is a probabilistic terrain analysis. The landscape encodes growth trajectory as elevation, operational friction as roughness, and strategic leverage as ridge structures. All figures are model-derived probability indicators.",
    tileOverrides: null,
    cameraTarget: "wide_overview",
    highlightMarkers: [],
    pauseMs: 7000,
  },
  {
    id: "terrain_difficulty",
    title: "Terrain Difficulty",
    durationMs: 8000,
    cameraShot: "pan",
    highlightType: "terrain_surface",
    laserTargetKey: "roughness_zone",
    transcriptLine:
      "The terrain surface encodes operational friction from the scenario's burn structure and margin dynamics. Ridge intensity indicates leverage divergence between growth and margin assumptions. Surface volatility signals dispersion in the growth-to-margin trajectory.",
    tileOverrides: ["risk"],
    cameraTarget: "terrain_surface",
    highlightMarkers: ["roughness_zone"],
    pauseMs: 8000,
  },
  {
    id: "risk_concentration",
    title: "Risk Concentration",
    durationMs: 7000,
    cameraShot: "zoom",
    highlightType: "risk_zone",
    laserTargetKey: "risk_peak",
    transcriptLine:
      "Risk concentration appears where multiple structural pressure points converge on the terrain surface. Hotspots indicate localised areas where the probability distribution skews toward downside scenarios.",
    tileOverrides: ["risk", "runway"],
    cameraTarget: "risk_peak",
    highlightMarkers: ["risk_peak"],
    pauseMs: 7000,
  },
  {
    id: "valuation_trajectory",
    title: "Valuation Trajectory",
    durationMs: 7000,
    cameraShot: "track",
    highlightType: "valuation_peak",
    laserTargetKey: "valuation_peak",
    transcriptLine:
      "Enterprise value synthesis blends DCF, revenue multiple, and EBITDA multiple methodologies. The P50 estimate represents the probability-weighted central case. Primary value drivers are identified through sequential marginal attribution.",
    tileOverrides: ["ev", "dispersion"],
    cameraTarget: "valuation_peak",
    highlightMarkers: ["ev_trajectory"],
    pauseMs: 7000,
  },
  {
    id: "path_viability",
    title: "Strategic Path Viability",
    durationMs: 7000,
    cameraShot: "track",
    highlightType: "trajectory",
    laserTargetKey: "revenue_engine",
    transcriptLine:
      "The strategic path traverses the terrain surface from current position toward modelled outcomes. Path stress probability indicates the likelihood of trajectory deviation. Growth trajectory versus churn pressure determines net path momentum.",
    tileOverrides: ["ev", "runway"],
    cameraTarget: "path_trajectory",
    highlightMarkers: ["revenue_engine", "inflection_point"],
    pauseMs: 7000,
  },
  {
    id: "milestone_friction",
    title: "Milestone Friction",
    durationMs: 6000,
    cameraShot: "pan",
    highlightType: "leverage_nodes",
    laserTargetKey: "margin_expansion",
    transcriptLine:
      "Milestone friction represents headwinds that the strategic path must absorb. The waterfall attribution identifies driver groups with negative marginal impact. Ridge structures suggest concentrated leverage at key transition points.",
    tileOverrides: ["ev", "dispersion"],
    cameraTarget: "margin_expansion",
    highlightMarkers: ["leverage_nodes"],
    pauseMs: 6000,
  },
  {
    id: "robustness_envelope",
    title: "Robustness Envelope",
    durationMs: 9000,
    cameraShot: "wide",
    highlightType: "probability_band",
    laserTargetKey: "capital_efficiency",
    transcriptLine:
      "The robustness envelope measures how sensitive the modelled outcome is to methodology and assumption variation. Methodology dispersion, probability zone distribution, and the interquartile range define the boundaries of the outcome space.",
    tileOverrides: ["dispersion", "risk"],
    cameraTarget: "probability_band",
    highlightMarkers: ["capital_efficiency"],
    pauseMs: 9000,
  },
  {
    id: "executive_implication",
    title: "Executive Implication",
    durationMs: 9000,
    cameraShot: "wide",
    highlightType: "none",
    laserTargetKey: null,
    transcriptLine:
      "This analysis presents scenario indicators — not directives. The terrain-path synthesis combines surface difficulty with path stress to indicate the overall likelihood of achieving modelled milestones. All outputs are subject to stated assumptions.",
    tileOverrides: null,
    cameraTarget: "wide_overview",
    highlightMarkers: [],
    pauseMs: 9000,
  },
];
