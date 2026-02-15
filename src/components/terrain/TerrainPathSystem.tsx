import React, { useCallback, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { createPathSegmentMaterial, type PathSegmentMaterialUniforms } from "./PathSegmentMaterial";

/**
 * TerrainPathSystem — Unified surface-following ribbon path.
 *
 * - Terrain-conforming ribbon (never inside rock)
 * - Shallow corridor imprint + subtle berms
 * - Segmented dashes via custom ShaderMaterial
 * - One-time micro-pulse at reference zones
 * - Deterministic: geometry built once per input change
 * - 60fps: no per-frame rebuilds
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

  /** When true, emit vertices as (x, z, y) — Z-up convention */
  swapYZ?: boolean;

  // Sampling
  tension?: number;
  samples?: number;

  // Geometry
  halfWidth?: number;
  widthSegments?: number;
  lift?: number;

  // Cut-in + banking
  cutDepth?: number;
  bankHeight?: number;
  shoulderSoftness?: number;
  autoBank?: boolean;
  autoBankStrength?: number;
  maxBankAngleDeg?: number;

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
function clamp01(x: number) { return Math.max(0, Math.min(1, x)); }
function smoothstep(e0: number, e1: number, x: number) {
  const t = clamp01((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
}
function deg2rad(d: number) { return (d * Math.PI) / 180; }

const TONE_COLORS: Record<string, string> = {
  up: "#2FBF71",      // Emerald
  down: "#D94B4B",     // Red
  neutral: "#5FD4FF",  // Cyan
};

export default function TerrainPathSystem({
  getHeightAt,
  points,
  swapYZ = false,
  tension = 0.55,
  samples = 220,
  halfWidth = 0.55,
  widthSegments = 10,
  lift = 0.06,
  cutDepth = 0.10,
  bankHeight = 0.05,
  shoulderSoftness = 0.65,
  autoBank = true,
  autoBankStrength = 0.75,
  maxBankAngleDeg = 8,
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

  /* ── Build geometry (deterministic, once per input change) ── */
  const { ribbonGeo, leftEdge, rightEdge, curvePoints } = useMemo(() => {
    const empty = {
      ribbonGeo: null as THREE.BufferGeometry | null,
      leftEdge: null as THREE.Vector3[] | null,
      rightEdge: null as THREE.Vector3[] | null,
      curvePoints: [] as THREE.Vector3[],
    };
    if (!getHeightAt || points.length < 2) return empty;

    // 1) Build smoothed curve sampling terrain heights
    const basePts = points.map((p) => {
      const y = getHeightAt(p.x, p.z);
      return new THREE.Vector3(p.x, y, p.z);
    });

    const curve = new THREE.CatmullRomCurve3(basePts, false, "catmullrom", tension);
    const centerline = curve.getPoints(samples);

    // 2) Tangents for banking
    const tangents: THREE.Vector3[] = [];
    for (let i = 0; i < centerline.length; i++) {
      const prev = centerline[Math.max(0, i - 1)];
      const next = centerline[Math.min(centerline.length - 1, i + 1)];
      tangents.push(next.clone().sub(prev).normalize());
    }

    // 3) Build ribbon vertices
    const verts: number[] = [];
    const norms: number[] = [];
    const uvs: number[] = [];
    const idx: number[] = [];
    const up = new THREE.Vector3(0, 1, 0);
    const leftEdgePts: THREE.Vector3[] = [];
    const rightEdgePts: THREE.Vector3[] = [];
    const wSeg = Math.max(2, widthSegments);
    const wCount = wSeg + 1;

    for (let i = 0; i < centerline.length; i++) {
      const c = centerline[i];
      const tan = tangents[i];

      // Side vector perpendicular to tangent on XZ plane
      let side = new THREE.Vector3().crossVectors(up, tan).normalize();
      if (side.lengthSq() < 1e-6) side = new THREE.Vector3(1, 0, 0);

      // Banking angle from curvature
      let bankAngle = 0;
      if (autoBank) {
        const prevTan = tangents[Math.max(0, i - 1)];
        const nextTan = tangents[Math.min(tangents.length - 1, i + 1)];
        const curvature = clamp01(prevTan.distanceTo(nextTan));
        bankAngle = deg2rad(Math.min(maxBankAngleDeg, curvature * autoBankStrength * maxBankAngleDeg));
      }

      if (bankAngle !== 0) {
        const q = new THREE.Quaternion().setFromAxisAngle(tan, bankAngle);
        side = side.applyQuaternion(q).normalize();
      }

      // Cross-section vertices
      for (let j = 0; j < wCount; j++) {
        const u = j / wSeg;
        const s = u * 2 - 1; // -1..1
        const absS = Math.abs(s);

        // Shallow corridor imprint (center depression)
        const centerDepress = 1 - smoothstep(0.0, 0.55, absS);
        const cut = -cutDepth * Math.pow(centerDepress, 1.35);

        // Subtle berm at edges
        const shoulderStart = shoulderSoftness;
        const shoulder = smoothstep(shoulderStart, 1.0, absS);
        const bank = bankHeight * Math.pow(shoulder, 1.15);

        const profileY = cut + bank;

        const px = c.x + side.x * (s * halfWidth);
        const pz = c.z + side.z * (s * halfWidth);

        // CRITICAL: sample terrain at actual vertex position — guarantees surface conformance
        const terrainY = getHeightAt(px, pz);
        const py = Math.max(terrainY + lift, terrainY + lift + profileY);

        if (swapYZ) verts.push(px, pz, py);
        else verts.push(px, py, pz);

        // Normal: mostly up with slight banking tilt
        const n = new THREE.Vector3(0, 1, 0)
          .add(side.clone().multiplyScalar(s * 0.12))
          .normalize();
        if (swapYZ) norms.push(n.x, n.z, n.y);
        else norms.push(n.x, n.y, n.z);

        uvs.push(i / (centerline.length - 1), u);

        if (swapYZ) {
          if (j === 0) leftEdgePts.push(new THREE.Vector3(px, pz, py + 0.01));
          if (j === wSeg) rightEdgePts.push(new THREE.Vector3(px, pz, py + 0.01));
        } else {
          if (j === 0) leftEdgePts.push(new THREE.Vector3(px, py + 0.01, pz));
          if (j === wSeg) rightEdgePts.push(new THREE.Vector3(px, py + 0.01, pz));
        }
      }
    }

    // 4) Triangle indices
    const rowCount = centerline.length;
    for (let i = 0; i < rowCount - 1; i++) {
      for (let j = 0; j < wSeg; j++) {
        const a = i * wCount + j;
        const b = a + 1;
        const c2 = (i + 1) * wCount + j;
        const d = c2 + 1;
        idx.push(a, c2, b);
        idx.push(b, c2, d);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    geo.setAttribute("normal", new THREE.Float32BufferAttribute(norms, 3));
    geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(idx);
    geo.computeBoundingSphere();

    return { ribbonGeo: geo, leftEdge: leftEdgePts, rightEdge: rightEdgePts, curvePoints: centerline };
  }, [getHeightAt, points, tension, samples, halfWidth, widthSegments, lift,
      cutDepth, bankHeight, shoulderSoftness, autoBank, autoBankStrength, maxBankAngleDeg, swapYZ]);

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

  /* ── Edge line geometries ── */
  const { leftLineGeo, rightLineGeo } = useMemo(() => {
    if (!leftEdge || !rightEdge) return { leftLineGeo: null, rightLineGeo: null };

    const mkGeo = (pts: THREE.Vector3[]) => {
      const arr = new Float32Array(pts.length * 3);
      for (let i = 0; i < pts.length; i++) {
        arr[i * 3] = pts[i].x;
        arr[i * 3 + 1] = pts[i].y;
        arr[i * 3 + 2] = pts[i].z;
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(arr, 3));
      return g;
    };

    return { leftLineGeo: mkGeo(leftEdge), rightLineGeo: mkGeo(rightEdge) };
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
