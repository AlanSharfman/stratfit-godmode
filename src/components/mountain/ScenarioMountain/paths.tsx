import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Line as DreiLine } from "@react-three/drei";
import * as THREE from "three";

import { clamp01 } from "./helpers";
import { MODE_CONFIGS, type MountainMode } from "./types";
import { sampleMountainHeight } from "./terrainSampler";

// ============================================================================
// STRATEGIC PATH + MILESTONES (lightweight overlays; no terrain rewrite)
// ============================================================================

/** Minimum height lift above terrain surface — path never renders under terrain */
const PATH_LIFT = 0.55;

export function StrategicPath({
  solverPath,
  color,
  mode,
  glowIntensity,
  dataPoints,
}: {
  solverPath: { riskIndex: number; enterpriseValue: number; runway: number }[];
  color: string;
  mode: MountainMode;
  glowIntensity: number;
  dataPoints?: number[];
}) {
  const config = MODE_CONFIGS[mode] ?? MODE_CONFIGS.default;
  const lineRef = useRef<any>(null);
  const glowRef = useRef<any>(null);

  // Map solverPath points into a compact, stable curve above the mountain.
  // Path XY is projected to terrain, Z is terrain-sampled height + offset.
  const points = useMemo(() => {
    if (!solverPath?.length) return [];
    const maxRunway = Math.max(...solverPath.map((p) => p.runway || 0), 1);
    const minEV = Math.min(...solverPath.map((p) => p.enterpriseValue || 0));
    const maxEV = Math.max(
      ...solverPath.map((p) => p.enterpriseValue || 0),
      minEV + 1
    );

    return solverPath.map((p, i) => {
      const t = solverPath.length <= 1 ? 0 : i / (solverPath.length - 1);
      const runway01 = (p.runway ?? 0) / maxRunway;
      const ev01 = ((p.enterpriseValue ?? 0) - minEV) / (maxEV - minEV);
      const risk01 = clamp01((p.riskIndex ?? 50) / 100);

      // Mesh-local coordinates (sampler uses PlaneGeometry local space)
      const mesh_x = (t - 0.5) * 10; // left↔right
      const mesh_y = -1.2 + t * 0.8; // forward (PlaneGeometry Y → world -Z after rotation)

      // Sample terrain height (returns PlaneGeometry local Z = world Y after rotation)
      const terrainH = sampleMountainHeight(mesh_x, mesh_y, dataPoints);
      // Compute data-driven offset; clamp so path NEVER goes below terrain
      const dataOffset = runway01 * 0.3 + ev01 * 0.15 - risk01 * 0.1;
      const mesh_z = terrainH + PATH_LIFT + Math.max(0, dataOffset);

      // Convert mesh-local → world via terrain group transform:
      //   rotation [-π/2, 0, 0]: local-Z → world-Y, local-Y → world-(-Z)
      //   position [0, -2, 0], scale [0.9, 0.9, 0.9]
      const worldX = mesh_x * 0.9;
      const worldY = mesh_z * 0.9 - 2;
      const worldZ = -mesh_y * 0.9;

      return new THREE.Vector3(worldX, worldY, worldZ);
    });
  }, [solverPath, dataPoints]);

  const curvePoints = useMemo(() => {
    if (points.length < 2) return points;
    const curve = new THREE.CatmullRomCurve3(points, false, "centripetal", 0.5);
    return curve.getPoints(120);
  }, [points]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const pulse = mode === "celebration" ? 0.8 + Math.sin(t * 2) * 0.2 : 1;
    if (lineRef.current) {
      const m = lineRef.current.material as { opacity?: number } | undefined;
      if (m) m.opacity = (mode === "ghost" ? 0.2 : 0.95) * pulse;
      // Flow feel in celebration mode (dashed line offset)
      const md = lineRef.current.material as any;
      if (mode === "celebration" && md) md.dashOffset = -t * 0.8;
    }
    if (glowRef.current) {
      const m = glowRef.current.material as { opacity?: number } | undefined;
      if (m) m.opacity = 0.5 * config.pathGlow * glowIntensity * pulse;
      const mg = glowRef.current.material as any;
      if (mode === "celebration" && mg) mg.dashOffset = -t * 0.8;
    }
  });

  if (!curvePoints.length) return null;
  if (mode === "ghost" && config.pathGlow <= 0) return null;

  return (
    <group renderOrder={100}>
      {/* Outer glow layer for depth and realism */}
      <DreiLine
        ref={glowRef}
        points={curvePoints}
        color={color}
        transparent
        opacity={0.5 * config.pathGlow * glowIntensity}
        lineWidth={8}
        depthTest={false}
        dashed={mode === "celebration"}
        dashScale={1}
        dashSize={0.8}
        gapSize={0.6}
      />
      {/* Core path line - thicker and more solid */}
      <DreiLine
        ref={lineRef}
        points={curvePoints}
        color={color}
        transparent
        opacity={mode === "ghost" ? 0.2 : 0.95}
        lineWidth={4}
        depthTest={false}
        dashed={mode === "celebration"}
        dashScale={1}
        dashSize={0.8}
        gapSize={0.6}
      />
      {/* Strategy: trajectory halo (wider, semi-transparent glow) */}
      {mode === "strategy" && (
        <DreiLine
          points={curvePoints}
          color="#7dd3fc"
          lineWidth={3.5 * (config.trajectoryHaloWidthMult ?? 1.8)}
          transparent
          opacity={config.trajectoryHaloOpacity ?? 0.22}
          depthTest={false}
        />
      )}
    </group>
  );
}

export function MilestoneOrbs({
  color,
  mode,
  glowIntensity,
  solverPath,
  dataPoints,
}: {
  color: string;
  mode: MountainMode;
  glowIntensity: number;
  solverPath?: { riskIndex: number; enterpriseValue: number; runway: number }[];
  dataPoints?: number[];
}) {
  const config = MODE_CONFIGS[mode] ?? MODE_CONFIGS.default;

  const milestones = useMemo(() => {
    if (mode === "ghost") return [];
    const sp = solverPath?.length
      ? solverPath
      : [
          { riskIndex: 60, enterpriseValue: 1, runway: 12 },
          { riskIndex: 55, enterpriseValue: 2, runway: 16 },
          { riskIndex: 50, enterpriseValue: 3, runway: 20 },
          { riskIndex: 45, enterpriseValue: 4, runway: 26 },
          { riskIndex: 40, enterpriseValue: 5, runway: 32 },
        ];

    const maxRunway = Math.max(...sp.map((p) => p.runway || 0), 1);
    const minEV = Math.min(...sp.map((p) => p.enterpriseValue || 0));
    const maxEV = Math.max(
      ...sp.map((p) => p.enterpriseValue || 0),
      minEV + 1
    );

    const pts = sp.map((p, i) => {
      const t = sp.length <= 1 ? 0 : i / (sp.length - 1);
      const runway01 = (p.runway ?? 0) / maxRunway;
      const ev01 = ((p.enterpriseValue ?? 0) - minEV) / (maxEV - minEV);
      const risk01 = clamp01((p.riskIndex ?? 50) / 100);
      const mesh_x = (t - 0.5) * 10;
      const mesh_y = -1.2 + t * 0.8;
      const terrainH = sampleMountainHeight(mesh_x, mesh_y, dataPoints);
      const dataOffset = runway01 * 0.3 + ev01 * 0.15 - risk01 * 0.1;
      const mesh_z = terrainH + PATH_LIFT + Math.max(0, dataOffset);
      // Convert mesh-local → world (same terrain group transform as StrategicPath)
      return new THREE.Vector3(mesh_x * 0.9, mesh_z * 0.9 - 2, -mesh_y * 0.9);
    });

    const typeOrder = [
      "revenue",
      "funding",
      "team",
      "revenue",
      "product",
    ] as const;
    const picks = [0.15, 0.35, 0.55, 0.75, 0.92];

    return picks.map((t, idx) => {
      const i = Math.max(0, Math.min(pts.length - 1, Math.round(t * (pts.length - 1))));
      return { pos: pts[i], type: typeOrder[idx] };
    });
  }, [solverPath, mode, dataPoints]);

  if (mode === "ghost") return null;

  const typeColors: Record<string, string> = {
    revenue: "#10b981",
    team: "#F59E0B",
    product: "#f59e0b",
    funding: "#EF4444",
    risk: "#ef4444",
  };

  return (
    <group>
      {milestones.map((m, i) => (
        <MilestoneOrb
          key={i}
          position={m.pos}
          color={typeColors[m.type] ?? color}
          mode={mode}
          glowIntensity={glowIntensity}
          glowMultiplier={config.glowMultiplier}
        />
      ))}
    </group>
  );
}

export function MilestoneOrb({
  position,
  color,
  mode,
  glowIntensity,
  glowMultiplier,
}: {
  position: THREE.Vector3;
  color: string;
  mode: MountainMode;
  glowIntensity: number;
  glowMultiplier: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    meshRef.current.position.y = position.y + Math.sin(t * 2) * 0.05;
    if (mode === "celebration") {
      const s = 1 + Math.sin(t * 3) * 0.2 * glowIntensity;
      meshRef.current.scale.setScalar(s);
      if (glowRef.current) glowRef.current.scale.setScalar(s * 2);
    }
  });

  return (
    <group position={position}>
      {mode === "celebration" ? (
        <mesh ref={glowRef}>
          <sphereGeometry args={[0.18, 16, 16]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.15 * glowMultiplier}
            depthWrite={false}
            depthTest={false}
          />
        </mesh>
      ) : null}
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={glowMultiplier * glowIntensity * 0.45}
          transparent
          opacity={1}
          depthWrite={false}
          depthTest={false}
        />
      </mesh>
      {mode === "celebration" ? (
        <pointLight
          color={color}
          intensity={glowIntensity * 0.35}
          distance={2}
          decay={2}
        />
      ) : null}
    </group>
  );
}
