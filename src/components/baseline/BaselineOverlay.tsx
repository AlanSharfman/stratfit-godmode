import React, { memo, useMemo } from "react";
import * as THREE from "three";
import { Html, Line } from "@react-three/drei";
import {
  BASELINE_ANCHORS,
  type BaselineAnchorId,
  type BaselineMetricId,
  type BaselineMetricToAnchorMap,
} from "./baselineAnchors";

// Must match ScenarioMountain's stable terrain constants.
// We keep these as local constants to avoid refactoring ScenarioMountain.
const GRID_W = 120;
const GRID_D = 60;
const MESH_W = 50;
const MESH_D = 25;

const TERRAIN_GROUP_ROT: [number, number, number] = [-Math.PI / 2, 0, 0];
const TERRAIN_GROUP_POS: [number, number, number] = [0, -2, 0];
const TERRAIN_GROUP_SCALE: [number, number, number] = [0.9, 0.9, 0.9];

function clamp01(n: number) {
  return Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0));
}

function uvToLocalXY(uv: { u: number; v: number }) {
  const u = clamp01(uv.u);
  const v = clamp01(uv.v);
  const x = (u - 0.5) * MESH_W;
  const y = (v - 0.5) * MESH_D; // local plane Y (pre-rotation)
  return { x, y, u, v };
}

function sampleHeightFromTerrainMesh(mesh: THREE.Mesh | null, uv: { u: number; v: number }) {
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

export type BaselineOverlayProps = {
  heatmapOn: boolean;
  metricToAnchor: BaselineMetricToAnchorMap;
  activeMetricId?: BaselineMetricId | null;
  terrainMesh: THREE.Mesh | null;
};

const BaselineOverlay: React.FC<BaselineOverlayProps> = memo((props) => {
  const anchorLocal = useMemo(() => {
    const m = new Map<BaselineAnchorId, THREE.Vector3>();
    for (const a of Object.values(BASELINE_ANCHORS)) {
      const { x, y } = uvToLocalXY(a.uv);
      const h = sampleHeightFromTerrainMesh(props.terrainMesh, a.uv);
      m.set(a.id, new THREE.Vector3(x, y, h + 0.18));
    }
    return m;
  }, [props.terrainMesh]);

  const leftPorts = useMemo(() => {
    // Fixed “ports” in the same terrain-local space.
    // These do NOT try to map DOM pixels; they create a deterministic visual bridge.
    const baseX = -MESH_W / 2 - 7.2;
    const topY = 8.5;
    const step = 4.0;
    const z = 2.2;
    const ports: Record<BaselineMetricId, THREE.Vector3> = {
      revenueFitness: new THREE.Vector3(baseX, topY - step * 0, z),
      costDiscipline: new THREE.Vector3(baseX, topY - step * 1, z),
      capitalStrength: new THREE.Vector3(baseX, topY - step * 2, z),
      runwayStability: new THREE.Vector3(baseX, topY - step * 3, z),
      operatingEfficiency: new THREE.Vector3(baseX, topY - step * 4, z),
      structuralRisk: new THREE.Vector3(baseX, topY - step * 5, z),
    };
    return ports;
  }, []);

  const anchorGlow = props.heatmapOn ? 1.0 : 0.75;
  const lineColor = props.heatmapOn ? "#46e3ff" : "rgba(170, 215, 230, 0.85)";

  return (
    <group rotation={TERRAIN_GROUP_ROT} position={TERRAIN_GROUP_POS} scale={TERRAIN_GROUP_SCALE}>
      {/* Anchor orbs + labels */}
      {Object.values(BASELINE_ANCHORS).map((a) => {
        const p = anchorLocal.get(a.id) ?? new THREE.Vector3(0, 0, 1.6);
        return (
          <group key={a.id} position={p}>
            <mesh>
              <sphereGeometry args={[0.18, 24, 24]} />
              <meshStandardMaterial emissive={"#46e3ff"} emissiveIntensity={anchorGlow} color={"#071a1f"} />
            </mesh>
            <Html distanceFactor={12} style={{ pointerEvents: "none" }}>
              <div
                style={{
                  color: "rgba(220,240,255,0.90)",
                  fontSize: 12,
                  letterSpacing: "0.10em",
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                  textShadow: "0 2px 10px rgba(0,0,0,0.9)",
                }}
              >
                <div style={{ fontWeight: 750 }}>{a.label}</div>
                <div style={{ opacity: 0.72, fontSize: 11, letterSpacing: "0.06em" }}>{a.subtitle}</div>
              </div>
            </Html>
          </group>
        );
      })}

      {/* Lines from left ports -> anchor */}
      {(Object.keys(props.metricToAnchor) as BaselineMetricId[]).map((metricId) => {
        const anchorId = props.metricToAnchor[metricId];
        const from = leftPorts[metricId];
        const to = anchorLocal.get(anchorId) ?? new THREE.Vector3(0, 0, 1.6);

        const active = props.activeMetricId === metricId;
        const dim = !!props.activeMetricId && !active;
        const opacity = dim ? 0.18 : active ? 0.95 : 0.62;

        return (
          <Line
            key={metricId}
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
});

BaselineOverlay.displayName = "BaselineOverlay";
export default BaselineOverlay;




