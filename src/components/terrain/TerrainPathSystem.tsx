import React, { useCallback, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { createPathSegmentMaterial, type PathSegmentMaterialUniforms } from "./PathSegmentMaterial";
import { buildRibbonGeometry, buildEdgeLineGeometry } from "@/terrain/corridorTopology";

/**
 * TerrainPathSystem — Unified surface-following ribbon path.
 *
 * - Terrain-conforming ribbon (never inside rock)
 * - Segmented dashes via custom ShaderMaterial
 * - One-time micro-pulse at reference zones
 * - Deterministic: geometry built once per input change
 * - 60fps: no per-frame rebuilds
 * 
 * NOTE: Geometry creation delegated to corridorTopology (one engine rule)
 */

type XZ = { x: number; z: number };

type ReferenceZone = {
  /** World-space anchor position */
  anchor: { x: number; z: number };
  /** Tone for pulse color */
  tone: "up" | "down" | "neutral";
};

type Props = {
  /** Height sampler: (worldX, worldZ) => terrainY */
  getHeightAt: (x: number, z: number) => number;
  /** Control points (XZ plane) */
  points: XZ[];

  // Sampling
  tension?: number;
  samples?: number;

  // Geometry
  halfWidth?: number;
  widthSegments?: number;
  lift?: number;

  // Material
  color?: string;
  dashColor?: string;
  opacity?: number;
  dashLength?: number;
  gapLength?: number;
  emissiveStrength?: number;

  // Edge lines
  edgeLines?: boolean;
  edgeLineColor?: string;
  edgeLineOpacity?: number;

  // Reference zone pulse
  referenceZones?: ReferenceZone[];
  activeZoneIndex?: number;
};

/* ── Utility ── */
const TONE_COLORS: Record<string, string> = {
  up: "#2FBF71",      // Emerald
  down: "#D94B4B",     // Red
  neutral: "#5FD4FF",  // Cyan
};

export default function TerrainPathSystem({
  getHeightAt,
  points,
  tension = 0.55,
  samples = 220,
  halfWidth = 0.55,
  widthSegments = 10,
  lift = 0.06,
  color = "#5CCEE8",
  dashColor = "#7FEAFF",
  opacity = 0.88,
  dashLength = 1.0,
  gapLength = 0.7,
  emissiveStrength = 0.18,
  edgeLines = true,
  edgeLineColor = "#B6F6FF",
  edgeLineOpacity = 0.45,
  referenceZones,
  activeZoneIndex,
}: Props) {
  const matRef = useRef<THREE.ShaderMaterial | null>(null);
  const pulseTimerRef = useRef<number>(0);

  /* ── Build geometry via centralized corridorTopology engine ── */
  const { ribbonGeo, leftEdge, rightEdge, curvePoints } = useMemo(() => {
    const empty = {
      ribbonGeo: null as THREE.BufferGeometry | null,
      leftEdge: null as THREE.Vector3[] | null,
      rightEdge: null as THREE.Vector3[] | null,
      curvePoints: [] as THREE.Vector3[],
    };
    if (!getHeightAt || points.length < 2) return empty;

    // Delegate to centralized ribbon geometry builder
    const result = buildRibbonGeometry(points, getHeightAt, {
      samples,
      halfWidth,
      widthSegments,
      lift,
      tension,
    });

    return {
      ribbonGeo: result.geometry,
      leftEdge: result.leftEdge,
      rightEdge: result.rightEdge,
      curvePoints: result.centerline,
    };
  }, [getHeightAt, points, tension, samples, halfWidth, widthSegments, lift]);

  /* ── Material (created once, uniforms updated) ── */
  const material = useMemo(() => {
    const mat = createPathSegmentMaterial({ color, dashColor, opacity, dashLength, gapLength, emissiveStrength });
    matRef.current = mat;
    return mat;
  }, [color, dashColor, opacity, dashLength, gapLength, emissiveStrength]);

  /* ── Reference zone pulse (one-time micro-breathe) ── */
  const triggerPulse = useCallback((zoneT: number, tone: string) => {
    const mat = matRef.current;
    if (!mat) return;
    const u = mat.uniforms as unknown as PathSegmentMaterialUniforms;
    u.uPulseT.value = zoneT;
    u.uPulseToneColor.value.set(TONE_COLORS[tone] ?? TONE_COLORS.neutral);
    u.uPulseStrength.value = 1.0;

    // Decay pulse over 800ms
    const start = performance.now();
    cancelAnimationFrame(pulseTimerRef.current);
    const decay = () => {
      const elapsed = performance.now() - start;
      const t = Math.min(1, elapsed / 800);
      u.uPulseStrength.value = Math.max(0.08, 1.0 - t * 0.92); // settle to faint 0.08
      if (t < 1) pulseTimerRef.current = requestAnimationFrame(decay);
    };
    pulseTimerRef.current = requestAnimationFrame(decay);
  }, []);

  // Find nearest curve t for active zone
  useEffect(() => {
    if (activeZoneIndex == null || !referenceZones || !referenceZones[activeZoneIndex]) return;
    if (curvePoints.length < 2) return;

    const zone = referenceZones[activeZoneIndex];
    const ax = zone.anchor.x;
    const az = zone.anchor.z;

    // Find nearest centerline point
    let bestDist = Infinity;
    let bestIdx = 0;
    for (let i = 0; i < curvePoints.length; i++) {
      const cp = curvePoints[i];
      const dx = cp.x - ax;
      const dz = cp.z - az;
      const d = dx * dx + dz * dz;
      if (d < bestDist) { bestDist = d; bestIdx = i; }
    }

    const normalizedT = bestIdx / (curvePoints.length - 1);
    triggerPulse(normalizedT, zone.tone);

    return () => cancelAnimationFrame(pulseTimerRef.current);
  }, [activeZoneIndex, referenceZones, curvePoints, triggerPulse]);

  /* ── Edge line geometries via centralized builder ── */
  const { leftLineGeo, rightLineGeo } = useMemo(() => {
    if (!leftEdge || !rightEdge) return { leftLineGeo: null, rightLineGeo: null };
    return {
      leftLineGeo: buildEdgeLineGeometry(leftEdge),
      rightLineGeo: buildEdgeLineGeometry(rightEdge),
    };
  }, [leftEdge, rightEdge]);

  if (!ribbonGeo) return null;

  return (
    <group>
      {/* Main ribbon mesh with segmented dash shader */}
      <mesh geometry={ribbonGeo} material={material} renderOrder={5} />

      {/* Subtle edge lines */}
      {edgeLines && leftLineGeo && rightLineGeo && (
        <>
          <lineSegments geometry={leftLineGeo} renderOrder={6}>
            <lineBasicMaterial transparent opacity={edgeLineOpacity} color={edgeLineColor} />
          </lineSegments>
          <lineSegments geometry={rightLineGeo} renderOrder={6}>
            <lineBasicMaterial transparent opacity={edgeLineOpacity} color={edgeLineColor} />
          </lineSegments>
        </>
      )}
    </group>
  );
}
