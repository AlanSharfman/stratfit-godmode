// src/components/command/director/DirectorScript.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Director Mode Script (Cinematic Intelligence Theatre)
//
// Defines the scripted beat sequence for Investor Briefing mode.
// Each beat controls: camera, highlight, laser anchor, transcript line,
// and optional tile emphasis overrides.
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
  | "none";

export type TileEmphasis = "ev" | "risk" | "dispersion" | "runway";

export interface Beat {
  /** Unique beat identifier */
  id: string;
  /** Display title for the beat (director timeline) */
  title: string;
  /** Duration in milliseconds */
  durationMs: number;
  /** Camera movement type */
  cameraShot: CameraShot;
  /** Terrain highlight layer to activate */
  highlightType: HighlightType;
  /** Terrain anchor id for laser targeting */
  laserTargetKey: string | null;
  /** Transcript line displayed in briefing rail */
  transcriptLine: string;
  /** Optional tile emphasis overrides */
  tileOverrides: TileEmphasis[] | null;
}

// ────────────────────────────────────────────────────────────────────────────
// DEFAULT INVESTOR BRIEFING SCRIPT
// ────────────────────────────────────────────────────────────────────────────

export const INVESTOR_BRIEFING_SCRIPT: Beat[] = [
  {
    id: "opening",
    title: "Opening",
    durationMs: 5000,
    cameraShot: "wide",
    highlightType: "none",
    laserTargetKey: null,
    transcriptLine:
      "This is a probabilistic scenario model. The terrain you see represents the strategic landscape derived from your baseline data and simulation parameters.",
    tileOverrides: null,
  },
  {
    id: "revenue_trajectory",
    title: "Revenue Trajectory",
    durationMs: 6000,
    cameraShot: "track",
    highlightType: "trajectory",
    laserTargetKey: "revenue_engine",
    transcriptLine:
      "The revenue engine anchors the forward model. Growth assumptions flow from baseline metrics — current ARR, retention cohorts, and expansion rates feed into the projection corridor.",
    tileOverrides: ["ev"],
  },
  {
    id: "margin_structure",
    title: "Margin & Capital",
    durationMs: 5500,
    cameraShot: "pan",
    highlightType: "leverage_nodes",
    laserTargetKey: "margin_expansion",
    transcriptLine:
      "Margin expansion and capital efficiency create the leverage geometry. The model captures how operational improvements compound through the valuation framework.",
    tileOverrides: ["ev", "dispersion"],
  },
  {
    id: "risk_assessment",
    title: "Risk Profile",
    durationMs: 6000,
    cameraShot: "zoom",
    highlightType: "risk_zone",
    laserTargetKey: "risk_peak",
    transcriptLine:
      "Risk concentration appears at the peak elevation. The model identifies structural pressure points where multiple risk factors converge — these inform the probability-weighted downside scenarios.",
    tileOverrides: ["risk"],
  },
  {
    id: "inflection_analysis",
    title: "Inflection Point",
    durationMs: 5500,
    cameraShot: "track",
    highlightType: "trajectory",
    laserTargetKey: "inflection_point",
    transcriptLine:
      "The inflection zone marks where the business model transitions from investment phase to value creation. Timing of this transition significantly affects terminal value.",
    tileOverrides: ["ev", "runway"],
  },
  {
    id: "valuation_synthesis",
    title: "Valuation Synthesis",
    durationMs: 6000,
    cameraShot: "zoom",
    highlightType: "valuation_peak",
    laserTargetKey: "valuation_peak",
    transcriptLine:
      "Enterprise value synthesis blends DCF, revenue multiple, and EBITDA multiple methodologies. The P50 estimate represents the probability-weighted central case across all scenarios modelled.",
    tileOverrides: ["ev", "dispersion"],
  },
  {
    id: "probability_landscape",
    title: "Probability Landscape",
    durationMs: 5500,
    cameraShot: "wide",
    highlightType: "probability_band",
    laserTargetKey: "capital_efficiency",
    transcriptLine:
      "The probability landscape shows the distribution of outcomes. Wider dispersion indicates higher uncertainty — the model quantifies this uncertainty without prescribing actions.",
    tileOverrides: ["dispersion", "risk"],
  },
  {
    id: "closing",
    title: "Summary",
    durationMs: 5000,
    cameraShot: "wide",
    highlightType: "none",
    laserTargetKey: null,
    transcriptLine:
      "This analysis is model-derived and probabilistic. All outputs should be interpreted within the context of the assumptions provided. No guarantee of future performance is expressed or implied.",
    tileOverrides: null,
  },
];
