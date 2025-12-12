/**
 * Scenario color palettes for MountainEngine
 */
import { lerp } from "./math";

export type ScenarioId = "base" | "upside" | "downside" | "extreme";

export interface ScenarioPalette {
  primary: string;
  secondary: string;
  glow: string;
  grid: string;
  haze: string;
  ridgeA: string;
  ridgeB: string;
  floor: string;
}

const PALETTES: Record<ScenarioId, ScenarioPalette> = {
  base: {
    primary: "#22d3ee",
    secondary: "#ec4899",
    glow: "#22d3ee",
    grid: "#22d3ee",
    haze: "#0c1929",
    ridgeA: "#22d3ee",
    ridgeB: "#ec4899",
    floor: "#22d3ee",
  },
  upside: {
    primary: "#34d399",
    secondary: "#22d3ee",
    glow: "#34d399",
    grid: "#34d399",
    haze: "#0c2922",
    ridgeA: "#34d399",
    ridgeB: "#22d3ee",
    floor: "#34d399",
  },
  downside: {
    primary: "#fb923c",
    secondary: "#ec4899",
    glow: "#fb923c",
    grid: "#fb923c",
    haze: "#291c0c",
    ridgeA: "#fb923c",
    ridgeB: "#ec4899",
    floor: "#fb923c",
  },
  extreme: {
    primary: "#f87171",
    secondary: "#fb923c",
    glow: "#f87171",
    grid: "#f87171",
    haze: "#290c0c",
    ridgeA: "#f87171",
    ridgeB: "#fb923c",
    floor: "#f87171",
  },
};

export function getScenarioPalette(scenario: ScenarioId): ScenarioPalette {
  return PALETTES[scenario] ?? PALETTES.base;
}

export function mixHex(a: string, b: string, t: number): string {
  const ar = parseInt(a.slice(1, 3), 16);
  const ag = parseInt(a.slice(3, 5), 16);
  const ab = parseInt(a.slice(5, 7), 16);
  const br = parseInt(b.slice(1, 3), 16);
  const bg = parseInt(b.slice(3, 5), 16);
  const bb = parseInt(b.slice(5, 7), 16);
  const rr = Math.round(lerp(ar, br, t));
  const rg = Math.round(lerp(ag, bg, t));
  const rb = Math.round(lerp(ab, bb, t));
  const toHex = (n: number) =>
    Math.max(0, Math.min(255, n)).toString(16).padStart(2, "0");
  return `#${toHex(rr)}${toHex(rg)}${toHex(rb)}`;
}

export function mixPalette(a: ScenarioPalette, b: ScenarioPalette, t: number): ScenarioPalette {
  return {
    primary: mixHex(a.primary, b.primary, t),
    secondary: mixHex(a.secondary, b.secondary, t),
    glow: mixHex(a.glow, b.glow, t),
    grid: mixHex(a.grid, b.grid, t),
    haze: mixHex(a.haze, b.haze, t),
    ridgeA: mixHex(a.ridgeA, b.ridgeA, t),
    ridgeB: mixHex(a.ridgeB, b.ridgeB, t),
    floor: mixHex(a.floor, b.floor, t),
  };
}
