// src/components/command/SignalTiles.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Signal Tiles (Command Centre Intelligence Theatre)
//
// Displays 4 key signal metrics from canonical selectors:
//   1. EV P50 — blended enterprise value
//   2. Risk Index — composite risk score
//   3. Dispersion — valuation spread (P10–P90 proxy)
//   4. Runway — burn rate signal (if available)
//
// During director beats, tiles referenced in tileOverrides receive
// a cyan glow emphasis. Values are NEVER altered — display only.
//
// Selector-only access. No UI-side computation.
// ═══════════════════════════════════════════════════════════════════════════

import React, { memo, useMemo } from "react";
import type { TileEmphasis } from "./director/DirectorScript";

// ────────────────────────────────────────────────────────────────────────────
// TYPES
// ────────────────────────────────────────────────────────────────────────────

export interface SignalTileData {
  evP50: number | null;
  riskIndex: number | null;
  dispersionWidth: number | null;
  runwayMonths: number | null;
}

interface TileDef {
  key: TileEmphasis;
  label: string;
  format: (v: number | null) => string;
  tone: (v: number | null) => string; // css color
}

// ────────────────────────────────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────────────────────────────────

function fmtM(v: number | null): string {
  if (v == null || !isFinite(v)) return "—";
  if (Math.abs(v) >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(1)}B`;
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

function fmtPct(v: number | null): string {
  if (v == null || !isFinite(v)) return "—";
  return `${(v * 100).toFixed(1)}%`;
}

function fmtMonths(v: number | null): string {
  if (v == null || !isFinite(v)) return "—";
  return `${v.toFixed(0)}mo`;
}

function toneEV(v: number | null): string {
  if (v == null) return "rgba(148,180,214,0.5)";
  return v > 0 ? "rgba(34, 197, 94, 0.85)" : "rgba(239, 68, 68, 0.85)";
}

function toneRisk(v: number | null): string {
  if (v == null) return "rgba(148,180,214,0.5)";
  if (v > 0.6) return "rgba(239, 68, 68, 0.85)";
  if (v > 0.35) return "rgba(250, 204, 21, 0.85)";
  return "rgba(34, 197, 94, 0.85)";
}

function toneDispersion(v: number | null): string {
  if (v == null) return "rgba(148,180,214,0.5)";
  return "rgba(168, 85, 247, 0.85)";
}

function toneRunway(v: number | null): string {
  if (v == null) return "rgba(148,180,214,0.5)";
  if (v < 12) return "rgba(239, 68, 68, 0.85)";
  if (v < 24) return "rgba(250, 204, 21, 0.85)";
  return "rgba(34, 197, 94, 0.85)";
}

const TILE_DEFS: TileDef[] = [
  { key: "ev", label: "EV P50", format: fmtM, tone: toneEV },
  { key: "risk", label: "Risk Index", format: fmtPct, tone: toneRisk },
  { key: "dispersion", label: "Dispersion", format: fmtM, tone: toneDispersion },
  { key: "runway", label: "Runway", format: fmtMonths, tone: toneRunway },
];

// ────────────────────────────────────────────────────────────────────────────
// STYLES
// ────────────────────────────────────────────────────────────────────────────

const FONT = "'Inter', system-ui, sans-serif";
const MONO = "ui-monospace, 'JetBrains Mono', monospace";
const CYAN = "#22d3ee";

const S: Record<string, React.CSSProperties> = {
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 8,
  },
  tile: {
    display: "flex",
    flexDirection: "column",
    gap: 3,
    padding: "10px 12px",
    borderRadius: 8,
    background: "rgba(6, 12, 20, 0.65)",
    border: "1px solid rgba(182, 228, 255, 0.08)",
    backdropFilter: "blur(8px)",
    transition: "box-shadow 400ms ease, border-color 400ms ease",
  },
  tileEmphasis: {
    display: "flex",
    flexDirection: "column",
    gap: 3,
    padding: "10px 12px",
    borderRadius: 8,
    background: "rgba(6, 12, 20, 0.65)",
    border: `1px solid rgba(34, 211, 238, 0.3)`,
    backdropFilter: "blur(8px)",
    boxShadow: `0 0 16px -4px rgba(34, 211, 238, 0.2), inset 0 0 12px -4px rgba(34, 211, 238, 0.08)`,
    transition: "box-shadow 400ms ease, border-color 400ms ease",
  },
  label: {
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase" as const,
    fontFamily: FONT,
    color: "rgba(148, 180, 214, 0.55)",
  },
  value: {
    fontSize: 18,
    fontWeight: 700,
    fontFamily: MONO,
    letterSpacing: "-0.01em",
  },
};

// ────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ────────────────────────────────────────────────────────────────────────────

interface SignalTilesProps {
  data: SignalTileData;
  /** Currently emphasised tile keys (from director beat) */
  emphasis: TileEmphasis[] | null;
}

const SignalTiles: React.FC<SignalTilesProps> = memo(({ data, emphasis }) => {
  const emphasisSet = useMemo(
    () => new Set(emphasis ?? []),
    [emphasis],
  );

  const values: Record<TileEmphasis, number | null> = {
    ev: data.evP50,
    risk: data.riskIndex,
    dispersion: data.dispersionWidth,
    runway: data.runwayMonths,
  };

  return (
    <div style={S.grid}>
      {TILE_DEFS.map((def) => {
        const v = values[def.key];
        const isEmphasised = emphasisSet.has(def.key);
        return (
          <div key={def.key} style={isEmphasised ? S.tileEmphasis : S.tile}>
            <span style={S.label}>{def.label}</span>
            <span style={{ ...S.value, color: def.tone(v) }}>
              {def.format(v)}
            </span>
          </div>
        );
      })}
    </div>
  );
});

SignalTiles.displayName = "SignalTiles";
export default SignalTiles;
