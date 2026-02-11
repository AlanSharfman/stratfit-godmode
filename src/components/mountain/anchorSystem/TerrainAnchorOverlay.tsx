/**
 * STRATFIT — Shared Terrain Anchor Overlay
 *
 * Renders orb markers, labels, and connection lines inside the R3F Canvas.
 * Used by both Baseline and Strategy Studio via ScenarioMountain's `overlay` prop.
 *
 * ⚠️ This is an ADDITIVE overlay — it does NOT modify the mountain engine.
 */

import React, { memo, useMemo } from "react";
import * as THREE from "three";
import { Html, Line } from "@react-three/drei";
import {
  ANCHORS,
  type AnchorId,
  type AnchorConnection,
} from "./anchors";

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

// ── Props ───────────────────────────────────────────────────────────────

export interface TerrainAnchorOverlayProps {
  /** "baseline" or "strategy" — adjusts port positions and labels. */
  mode: "baseline" | "strategy";
  /** Which connections to draw (from port → anchor). */
  connections: AnchorConnection[];
  /** If set, this fromId is "active" — its line brightens, others dim. */
  activeFromId?: string | null;
  /** Live terrain mesh for height sampling. Null = use fallback height. */
  terrainMesh?: THREE.Mesh | null;
  /** Heatmap active — changes line/orb glow. */
  heatmapOn?: boolean;
}

// ── Component ───────────────────────────────────────────────────────────

const TerrainAnchorOverlay: React.FC<TerrainAnchorOverlayProps> = memo(
  ({ mode, connections, activeFromId, terrainMesh = null, heatmapOn = false }) => {
    // Build world positions for each anchor
    const anchorPositions = useMemo(() => {
      const m = new Map<AnchorId, THREE.Vector3>();
      for (const a of Object.values(ANCHORS)) {
        const { x, y } = uvToLocalXY(a.uv);
        const h = sampleHeight(terrainMesh, a.uv);
        m.set(a.id, new THREE.Vector3(x, y, h + 0.18));
      }
      return m;
    }, [terrainMesh]);

    // Build "from" ports — stacked along left edge of terrain space
    const fromPorts = useMemo(() => {
      const baseX = -MESH_W / 2 - 7.2;
      const topY = mode === "strategy" ? 10.0 : 8.5;
      const step = mode === "strategy" ? 2.6 : 4.0;
      const z = 2.2;

      const ports = new Map<string, THREE.Vector3>();
      connections.forEach((c, i) => {
        if (!ports.has(c.fromId)) {
          ports.set(c.fromId, new THREE.Vector3(baseX, topY - step * i, z));
        }
      });
      return ports;
    }, [connections, mode]);

    // Deduplicate anchors that actually appear
    const visibleAnchorIds = useMemo(() => {
      const ids = new Set<AnchorId>();
      for (const c of connections) ids.add(c.anchorId);
      return ids;
    }, [connections]);

    const anchorGlow = heatmapOn ? 1.0 : 0.75;
    const lineColor = heatmapOn ? "#46e3ff" : "rgba(170, 215, 230, 0.85)";

    return (
      <group rotation={TERRAIN_GROUP_ROT} position={TERRAIN_GROUP_POS} scale={TERRAIN_GROUP_SCALE}>
        {/* ── Anchor orbs + labels ──────────────────────────────────── */}
        {Object.values(ANCHORS)
          .filter((a) => visibleAnchorIds.has(a.id))
          .map((a) => {
            const p = anchorPositions.get(a.id) ?? new THREE.Vector3(0, 0, 1.6);
            return (
              <group key={a.id} position={p}>
                <mesh>
                  <sphereGeometry args={[0.18, 24, 24]} />
                  <meshStandardMaterial
                    emissive="#46e3ff"
                    emissiveIntensity={anchorGlow}
                    color="#071a1f"
                  />
                </mesh>
                <Html distanceFactor={12} style={{ pointerEvents: "none" }}>
                  <div
                    style={{
                      color: "rgba(220,240,255,0.90)",
                      fontSize: 12,
                      letterSpacing: "0.10em",
                      textTransform: "uppercase" as const,
                      whiteSpace: "nowrap",
                      textShadow: "0 2px 10px rgba(0,0,0,0.9)",
                    }}
                  >
                    <div style={{ fontWeight: 750 }}>{a.label}</div>
                    <div style={{ opacity: 0.72, fontSize: 11, letterSpacing: "0.06em" }}>
                      {a.subtitle}
                    </div>
                  </div>
                </Html>
              </group>
            );
          })}

        {/* ── Connection lines: from port → anchor ─────────────────── */}
        {connections.map((c) => {
          const from = fromPorts.get(c.fromId);
          const to = anchorPositions.get(c.anchorId) ?? new THREE.Vector3(0, 0, 1.6);
          if (!from) return null;

          const active = activeFromId === c.fromId;
          const dim = !!activeFromId && !active;
          const opacity = dim ? 0.18 : active ? 0.95 : 0.62;

          return (
            <Line
              key={`${c.fromId}-${c.anchorId}`}
              points={[from, to]}
              color={lineColor}
              lineWidth={active ? 2.1 : 1.15}
              transparent
              opacity={opacity}
            />
          );
        })}
      </group>
    );
  },
);

TerrainAnchorOverlay.displayName = "TerrainAnchorOverlay";
export default TerrainAnchorOverlay;



