// src/components/terrain/MountainMarkers.tsx
// STRATFIT — Mountain Beacon Markers (drei <Html> overlay)
// Renders crisp, styled beacon pills pinned to terrain-surface positions via UV mapping.
// Uses the same coordinate system as TerrainAnchorOverlay for consistent placement.

import React, { useMemo } from "react";
import * as THREE from "three";
import { Html } from "@react-three/drei";

// ── Terrain constants (must match ScenarioMountain internals) ───────────
const GRID_W = 120;
const GRID_D = 60;
const MESH_W = 50;
const MESH_D = 25;

const TERRAIN_GROUP_ROT: [number, number, number] = [-Math.PI / 2, 0, 0];
const TERRAIN_GROUP_POS: [number, number, number] = [0, -2, 0];
const TERRAIN_GROUP_SCALE: [number, number, number] = [0.9, 0.9, 0.9];

// ── Helpers ─────────────────────────────────────────────────────────────

function clamp01(n: number) {
  return Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0));
}

function uvToLocalXY(uv: { u: number; v: number }) {
  const u = clamp01(uv.u);
  const v = clamp01(uv.v);
  return { x: (u - 0.5) * MESH_W, y: (v - 0.5) * MESH_D };
}

function sampleHeight(mesh: THREE.Mesh | null, uv: { u: number; v: number }) {
  if (!mesh) return 1.6;
  const geom = mesh.geometry as THREE.BufferGeometry;
  const pos = geom.getAttribute("position") as THREE.BufferAttribute | undefined;
  if (!pos) return 1.6;
  const u = clamp01(uv.u);
  const v = clamp01(uv.v);
  const ix = Math.round(u * GRID_W);
  const iy = Math.round(v * GRID_D);
  const idx = iy * (GRID_W + 1) + ix;
  const z = pos.getZ(Math.max(0, Math.min(pos.count - 1, idx)));
  return Number.isFinite(z) ? z : 1.6;
}

export type MarkerTone = "info" | "risk" | "strength" | "strategy";

export type MountainMarker = {
  id: string;
  title: string;
  subtitle?: string;
  tone: MarkerTone;
  /** UV coordinate on terrain plane (u = lateral 0..1, v = depth 0..1) */
  uv: { u: number; v: number };
  tooltip: {
    what: string;
    why: string;
    how: string;
    next?: string;
  };
};

function toneVars(tone: MarkerTone): React.CSSProperties {
  switch (tone) {
    case "risk":
      return { "--mk-glow": "rgba(255, 65, 80, 0.55)", "--mk-border": "rgba(255, 65, 80, 0.65)" } as React.CSSProperties;
    case "strength":
      return { "--mk-glow": "rgba(46, 255, 165, 0.35)", "--mk-border": "rgba(46, 255, 165, 0.55)" } as React.CSSProperties;
    case "strategy":
      return { "--mk-glow": "rgba(120, 110, 255, 0.35)", "--mk-border": "rgba(120, 110, 255, 0.55)" } as React.CSSProperties;
    default: // info
      return { "--mk-glow": "rgba(0, 220, 255, 0.35)", "--mk-border": "rgba(0, 220, 255, 0.55)" } as React.CSSProperties;
  }
}

export default function MountainMarkers(props: {
  markers: MountainMarker[];
  terrainMesh?: THREE.Mesh | null;
  selectedId?: string | null;
  onHover?: (id: string | null) => void;
  onSelect?: (id: string) => void;
}) {
  const { markers, terrainMesh = null, selectedId, onHover, onSelect } = props;

  // Compute local-space positions from UV coords + terrain height sampling
  const markerPositions = useMemo(() => {
    const m = new Map<string, [number, number, number]>();
    for (const mk of markers) {
      const { x, y } = uvToLocalXY(mk.uv);
      const h = sampleHeight(terrainMesh, mk.uv);
      m.set(mk.id, [x, y, h + 0.25]);
    }
    return m;
  }, [markers, terrainMesh]);

  return (
    <group rotation={TERRAIN_GROUP_ROT} position={TERRAIN_GROUP_POS} scale={TERRAIN_GROUP_SCALE}>
      {markers.map((m) => {
        const selected = selectedId === m.id;
        const vars = toneVars(m.tone);
        const pos = markerPositions.get(m.id) ?? [0, 0, 1.6];
        return (
          <group key={m.id} position={pos as [number, number, number]}>
            {/* Pin line */}
            <Html center style={{ pointerEvents: "none" }}>
              <div
                style={{
                  width: 2,
                  height: selected ? 110 : 86,
                  margin: "0 auto",
                  background: `linear-gradient(to bottom, rgba(0,0,0,0), ${(vars as any)["--mk-border"]})`,
                  filter: selected ? `drop-shadow(0 0 10px ${(vars as any)["--mk-glow"]})` : "none",
                  transition: "height 0.2s ease, filter 0.2s ease",
                }}
              />
            </Html>

            {/* Beacon pill */}
            <Html
              center
              style={{
                transform: "translateY(-70px)",
                pointerEvents: "auto",
                ...vars,
              }}
            >
              <div
                onMouseEnter={() => onHover?.(m.id)}
                onMouseLeave={() => onHover?.(null)}
                onClick={() => onSelect?.(m.id)}
                style={{
                  userSelect: "none",
                  cursor: "pointer",
                  padding: "10px 12px",
                  minWidth: 180,
                  borderRadius: 14,
                  border: `1px solid ${(vars as any)["--mk-border"]}`,
                  background:
                    "linear-gradient(180deg, rgba(10,18,28,0.88), rgba(6,12,20,0.70))",
                  boxShadow: selected
                    ? `0 0 0 1px rgba(255,255,255,0.06), 0 14px 40px rgba(0,0,0,0.55), 0 0 28px ${(vars as any)["--mk-glow"]}`
                    : "0 0 0 1px rgba(255,255,255,0.04), 0 10px 26px rgba(0,0,0,0.50)",
                  backdropFilter: "blur(8px)",
                  transition: "box-shadow 0.2s ease",
                  fontFamily: "'Inter', system-ui, sans-serif",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 999,
                      background: (vars as any)["--mk-border"],
                      boxShadow: selected
                        ? `0 0 16px ${(vars as any)["--mk-glow"]}`
                        : `0 0 10px ${(vars as any)["--mk-glow"]}`,
                      flex: "0 0 auto",
                    }}
                  />
                  <div style={{ lineHeight: 1.15 }}>
                    <div
                      style={{
                        fontSize: 12,
                        letterSpacing: 0.8,
                        fontWeight: 800,
                        color: "rgba(255,255,255,0.92)",
                      }}
                    >
                      {m.title.toUpperCase()}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "rgba(190,210,230,0.78)",
                        marginTop: 3,
                      }}
                    >
                      {m.subtitle ?? "Hover for details"}
                    </div>
                  </div>
                </div>

                {/* Hover tooltip */}
                <div className="mk-tooltip">
                  <div className="mk-tipTitle">{m.title}</div>
                  <div className="mk-tipRow">
                    <b>What:</b> {m.tooltip.what}
                  </div>
                  <div className="mk-tipRow">
                    <b>Why:</b> {m.tooltip.why}
                  </div>
                  <div className="mk-tipRow">
                    <b>How:</b> {m.tooltip.how}
                  </div>
                  {m.tooltip.next ? (
                    <div className="mk-tipRow">
                      <b>Next:</b> {m.tooltip.next}
                    </div>
                  ) : null}
                </div>
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}
