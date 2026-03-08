// src/components/terrain/signals/signalStyle.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Canonical Signal Style System (Phase A8.1 — LOCKED)
//
// Institutional palette + per-type params for 3D terrain signals.
// These colors are ONLY for emissive/glow in Three.js signal primitives.
// Do NOT use for global UI palette.
// ═══════════════════════════════════════════════════════════════════════════

import type { TerrainEventType } from "@/domain/events/terrainEventTypes"

// ── Signal Palette ──────────────────────────────────────────────

export interface SignalColor {
  primary: string
  accent: string
}

export const SignalPalette: Record<string, SignalColor> = {
  risk:       { primary: "#FF3B3B", accent: "#FF6B6B" },
  liquidity:  { primary: "#FFD24A", accent: "#FFE28A" },
  volatility: { primary: "#4AA8FF", accent: "#8CCBFF" },
  growth:     { primary: "#37E67A", accent: "#7BFFA6" },
  shift:      { primary: "#B56BFF", accent: "#D2A7FF" },
  downside:   { primary: "#C94BFF", accent: "#7A2BFF" },
} as const

// ── Per-type signal parameters ──────────────────────────────────

export interface SignalParams {
  baseRadius: number
  baseHeight: number
  pulseFreq: number
  opacity: number
  maxCountWeight: number
  priority: number
}

export const signalParamsByType: Record<TerrainEventType, SignalParams> = {
  liquidity_stress:  { baseRadius: 24, baseHeight: 2,  pulseFreq: 0.8,  opacity: 0.22, maxCountWeight: 1.0, priority: 100 },
  risk_spike:        { baseRadius: 4,  baseHeight: 28, pulseFreq: 1.2,  opacity: 0.65, maxCountWeight: 0.9, priority: 90  },
  downside_regime:   { baseRadius: 18, baseHeight: 8,  pulseFreq: 0.5,  opacity: 0.18, maxCountWeight: 0.8, priority: 80  },
  volatility_zone:   { baseRadius: 20, baseHeight: 1,  pulseFreq: 0.35, opacity: 0.20, maxCountWeight: 0.7, priority: 70  },
  probability_shift: { baseRadius: 14, baseHeight: 1,  pulseFreq: 0.3,  opacity: 0.30, maxCountWeight: 0.6, priority: 60  },
  growth_inflection: { baseRadius: 4,  baseHeight: 22, pulseFreq: 0.6,  opacity: 0.55, maxCountWeight: 0.5, priority: 50  },
}

// ── Per-type caps (clutter governor) ────────────────────────────

export const perTypeCap: Record<TerrainEventType, number> = {
  risk_spike: 3,
  liquidity_stress: 3,
  volatility_zone: 2,
  downside_regime: 2,
  probability_shift: 2,
  growth_inflection: 2,
}

export const MAX_SIGNALS = 12

// ── Intensity computation ───────────────────────────────────────

/** Deterministic intensity from severity + probabilityImpact */
export function computeSignalIntensity(severity: number, probabilityImpact: number): number {
  const raw = 0.65 * severity + 0.35 * Math.abs(probabilityImpact)
  return Math.max(0, Math.min(1, raw))
}
