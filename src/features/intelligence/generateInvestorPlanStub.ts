// src/features/intelligence/generateInvestorPlanStub.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Stub Investor-Cinematic Briefing Plan
//
// Returns a deterministic 4-shot briefing plan with:
//   4 camera shots, 4 narration cues, 4 overlay events
//   Silence pauses embedded. Stable UV anchors. Clamped within bounds.
//
// Arc:
//   1. Baseline resilience
//   2. Scenario divergence
//   3. Risk concentration
//   4. How we get there (3 milestone pulses)
//
// Max ~28 seconds total runtime. No advice language.
// ═══════════════════════════════════════════════════════════════════════════

import type { BriefingPlan } from "./BriefingDirector"
import type { CameraShot } from "./CinematicCamera"
import type { NarrationCue } from "./CaptionRail"
import type { OverlayEvent } from "./OverlayEngine"
import type { SimulationKpis } from "@/state/phase1ScenarioStore"
import { COMPARE_PRESET } from "@/scene/camera/terrainCameraPresets"

/* ── Stable terrain UV anchors → world positions ── */
// Terrain: width=560, depth=360, scale [3.0, 2.8]
// worldX = (u - 0.5) * 560 * 3.0
// worldZ = (v - 0.5) * 360 * 2.8

function uvToWorld(u: number, v: number): [number, number] {
  const x = (u - 0.5) * 560 * 3.0
  const z = (v - 0.5) * 360 * 2.8
  // Clamp within reasonable bounds
  return [
    Math.max(-800, Math.min(800, x)),
    Math.max(-500, Math.min(500, z)),
  ]
}

// Anchors (clamped)
const ANCHOR_RIDGE = uvToWorld(0.55, 0.50)   // Central ridge
const ANCHOR_RUNWAY = uvToWorld(0.75, 0.55)  // Runway horizon
const ANCHOR_RISK = uvToWorld(0.60, 0.35)    // Risk concentration
const ANCHOR_GROWTH = uvToWorld(0.40, 0.60)  // Growth zone
const ANCHOR_M1 = uvToWorld(0.35, 0.45)      // Milestone 1
const ANCHOR_M2 = uvToWorld(0.50, 0.50)      // Milestone 2
const ANCHOR_M3 = uvToWorld(0.65, 0.55)      // Milestone 3

/* ── Base camera positions ── */
const CAM_BASE = COMPARE_PRESET.pos
const CAM_TARGET = COMPARE_PRESET.target

export function generateInvestorPlanStub(
  kpisA: SimulationKpis | null,
  kpisB: SimulationKpis | null,
  labelA: string,
  labelB: string,
): BriefingPlan {
  // Compute deltas for narration templating
  const revDelta = (kpisB?.revenue ?? 0) - (kpisA?.revenue ?? 0)
  const revPct = (kpisA?.revenue ?? 0) > 0
    ? ((revDelta / (kpisA?.revenue ?? 1)) * 100)
    : 0
  const burnA = kpisA?.monthlyBurn ?? 0
  const burnB = kpisB?.monthlyBurn ?? 0
  const runwayA = burnA > 0 ? (kpisA?.cash ?? 0) / burnA : 99
  const runwayB = burnB > 0 ? (kpisB?.cash ?? 0) / burnB : 99
  const better = revDelta > 0 ? labelB : labelA

  /* ═══ SHOTS (4 shots, ~28s total) ═══ */
  const shots: CameraShot[] = [
    // Shot 1: Establishing glide — pull back to survey (6s)
    {
      style: "glide",
      fromPos: [CAM_BASE[0] - 20, CAM_BASE[1] - 30, CAM_BASE[2] - 80],
      toPos: [CAM_BASE[0], CAM_BASE[1], CAM_BASE[2]],
      fromTarget: [CAM_TARGET[0], CAM_TARGET[1] - 5, CAM_TARGET[2]],
      toTarget: CAM_TARGET as [number, number, number],
      durationMs: 6000,
    },
    // Shot 2: Dolly toward divergence zone (7s)
    {
      style: "dolly",
      fromPos: [CAM_BASE[0], CAM_BASE[1], CAM_BASE[2]],
      toPos: [CAM_BASE[0] + 40, CAM_BASE[1] - 20, CAM_BASE[2] - 100],
      fromTarget: CAM_TARGET as [number, number, number],
      toTarget: [ANCHOR_GROWTH[0], CAM_TARGET[1], ANCHOR_GROWTH[1]],
      durationMs: 7000,
    },
    // Shot 3: Focus on risk area (7s)
    {
      style: "focus",
      fromPos: [CAM_BASE[0] + 40, CAM_BASE[1] - 20, CAM_BASE[2] - 100],
      toPos: [CAM_BASE[0] + 60, CAM_BASE[1] + 10, CAM_BASE[2] - 60],
      fromTarget: [ANCHOR_GROWTH[0], CAM_TARGET[1], ANCHOR_GROWTH[1]],
      toTarget: [ANCHOR_RISK[0], CAM_TARGET[1] + 5, ANCHOR_RISK[1]],
      durationMs: 7000,
    },
    // Shot 4: Pull back to survey with milestone pulses (8s)
    {
      style: "orbit",
      fromPos: [CAM_BASE[0] + 60, CAM_BASE[1] + 10, CAM_BASE[2] - 60],
      toPos: [CAM_BASE[0] - 10, CAM_BASE[1] + 20, CAM_BASE[2] + 20],
      fromTarget: [ANCHOR_RISK[0], CAM_TARGET[1] + 5, ANCHOR_RISK[1]],
      toTarget: CAM_TARGET as [number, number, number],
      durationMs: 8000,
    },
  ]

  const totalDurationMs = shots.reduce((a, s) => a + s.durationMs, 0) // 28000

  /* ═══ NARRATION CUES ═══ */
  const cues: NarrationCue[] = [
    // Cue 1 — Baseline resilience (during shot 1)
    {
      id: "cue-1-baseline",
      startMs: 1200,
      durationMs: 4200,
      text: `${labelA} establishes a baseline runway of ${runwayA.toFixed(0)} months.`,
      subtitle: "Structural foundation under current assumptions.",
      pauseAfterMs: 800,
    },
    // Cue 2 — Scenario divergence (during shot 2)
    {
      id: "cue-2-diverge",
      startMs: 7000,
      durationMs: 5000,
      text: `${better} projects ${Math.abs(revPct).toFixed(0)}% ${revDelta > 0 ? "higher" : "lower"} revenue — a ${Math.abs(revPct) > 15 ? "material" : "measured"} divergence.`,
      pauseAfterMs: 600,
    },
    // Cue 3 — Risk concentration (during shot 3)
    {
      id: "cue-3-risk",
      startMs: 14000,
      durationMs: 5000,
      text: `Risk concentrates at the runway horizon. ${runwayB.toFixed(0)} months under ${labelB} assumptions.`,
      subtitle: "Probability-weighted — not deterministic.",
      pauseAfterMs: 1000,
    },
    // Cue 4 — Path forward (during shot 4)
    {
      id: "cue-4-path",
      startMs: 22000,
      durationMs: 5000,
      text: "Three execution milestones define the corridor between these outcomes.",
      pauseAfterMs: 0,
    },
  ]

  /* ═══ OVERLAY EVENTS ═══ */
  const overlays: OverlayEvent[] = [
    // Overlay 1 — Contour glow at ridge (shot 1)
    {
      id: "ov-1-ridge",
      type: "contour_glow",
      startMs: 2000,
      durationMs: 4000,
      position: ANCHOR_RIDGE,
      color: 0x22d3ee, // cyan
      radius: 20,
    },
    // Overlay 2 — Delta ribbon at growth zone (shot 2)
    {
      id: "ov-2-delta",
      type: "delta_ribbon",
      startMs: 8000,
      durationMs: 5000,
      position: ANCHOR_GROWTH,
      color: 0x34d399, // emerald
      radius: 18,
    },
    // Overlay 3 — Heat wash at risk area (shot 3)
    {
      id: "ov-3-risk",
      type: "heat_wash",
      startMs: 14500,
      durationMs: 5500,
      position: ANCHOR_RISK,
      color: 0xef4444, // red
      radius: 22,
      label: "Risk",
    },
    // Overlay 4a–c — Milestone pulses (shot 4)
    {
      id: "ov-4a-m1",
      type: "pin_pulse",
      startMs: 22500,
      durationMs: 2000,
      position: ANCHOR_M1,
      color: 0x22d3ee,
      radius: 10,
    },
    {
      id: "ov-4b-m2",
      type: "pin_pulse",
      startMs: 24000,
      durationMs: 2000,
      position: ANCHOR_M2,
      color: 0x22d3ee,
      radius: 10,
    },
    {
      id: "ov-4c-m3",
      type: "pin_pulse",
      startMs: 25500,
      durationMs: 2000,
      position: ANCHOR_M3,
      color: 0x22d3ee,
      radius: 10,
    },
  ]

  return {
    shots,
    cues,
    overlays,
    totalDurationMs,
  }
}
