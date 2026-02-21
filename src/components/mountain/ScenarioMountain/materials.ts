import * as THREE from "three";

import { type ScenarioId } from "@/state/scenarioStore";

import { clamp01 } from "./helpers";

// ============================================================================
// PALETTE
// ============================================================================

// SCENARIO-AWARE COLOR PALETTES
// Each scenario has its own identity color while maintaining brightness
export const SCENARIO_PALETTE_COLORS: Record<ScenarioId, { idle: string; active: string }> = {
  base: {
    idle: "#22d3ee", // Luminous Teal
    active: "#00D9FF", // Electric Cyan
  },
  upside: {
    idle: "#34d399", // Emerald 400
    active: "#00ff9d", // Neon Green
  },
  downside: {
    idle: "#fbbf24", // Amber 400
    active: "#fcd34d", // Bright Amber
  },
  stress: {
    idle: "#f87171", // Red 400
    active: "#ff4444", // Bright Red
  },
};

export function paletteForScenario(
  s: ScenarioId,
  baseColor?: string,
  saturationMultiplier: number = 1
) {
  // Scenario-specific primary color OR scenario-provided color
  const scenarioColor = SCENARIO_PALETTE_COLORS[s] || SCENARIO_PALETTE_COLORS.base;
  const primary = new THREE.Color(baseColor || scenarioColor.idle);

  if (saturationMultiplier !== 1) {
    const hsl = { h: 0, s: 0, l: 0 };
    primary.getHSL(hsl);
    primary.setHSL(hsl.h, Math.min(1, hsl.s * saturationMultiplier), hsl.l);
  }

  // Create a darkened version for shadows
  const shadow = primary.clone().multiplyScalar(0.3);

  return {
    sky: new THREE.Color("#071318"),
    low: shadow,
    mid: primary.clone().lerp(new THREE.Color("#1a2a35"), 0.3),
    high: new THREE.Color("#e0f0f5").lerp(primary, 0.25),
    peak: new THREE.Color("#f8fcff"),
  };
}

export function heightColor(
  h01: number,
  pal: ReturnType<typeof paletteForScenario>,
  illumination: number = 0
) {
  const t = clamp01(h01);
  let c: THREE.Color;

  if (t < 0.15) c = pal.sky.clone().lerp(pal.low, t / 0.15);
  else if (t < 0.45) c = pal.low.clone().lerp(pal.mid, (t - 0.15) / 0.3);
  else if (t < 0.75) c = pal.mid.clone().lerp(pal.high, (t - 0.45) / 0.3);
  else c = pal.high.clone().lerp(pal.peak, (t - 0.75) / 0.25);

  if (illumination > 0) {
    c.lerp(new THREE.Color("#ffffff"), illumination * 0.3);
  }

  return c;
}

// ============================================================================
// GOD MODE PALETTE — Deep charcoal, dense, institutional
// ============================================================================

export function godModePalette(): ReturnType<typeof paletteForScenario> {
  return {
    sky: new THREE.Color("#050709"),
    low: new THREE.Color("#0a0d10"),
    mid: new THREE.Color("#0F1114"), // Primary charcoal per spec
    high: new THREE.Color("#182028"), // Slightly lighter for peaks
    peak: new THREE.Color("#1e2a38"), // Peak hint of slate-blue
  };
}
