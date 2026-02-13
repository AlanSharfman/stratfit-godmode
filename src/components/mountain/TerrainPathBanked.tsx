import React, { useMemo } from "react";
import * as THREE from "three";
import type { TerrainSurfaceHandle } from "./TerrainSurface";

type XZ = { x: number; z: number };

type Props = {
  terrain?: React.RefObject<TerrainSurfaceHandle | null>;
  getHeightAt?: (worldX: number, worldZ: number) => number;
  points: XZ[];

  // Output coordinate convention
  // When true, vertices are emitted as (x, z, y) instead of (x, y, z).
  // This lets the ribbon integrate with scenes that use X/Y as ground plane and Z as height.
  swapYZ?: boolean;

  // Sampling / smoothing
  tension?: number;
  samples?: number;

  // Geometry shape (the “route”)
  halfWidth?: number;
  widthSegments?: number;
  lift?: number;

  // Cut-in + banking profile
  cutDepth?: number;
  bankHeight?: number;
  shoulderSoftness?: number;

  // Optional dynamic banking based on curvature
  autoBank?: boolean;
  autoBankStrength?: number;
  maxBankAngleDeg?: number;

  // Material
  color?: string;
  opacity?: number;
  emissiveIntensity?: number;
  roughness?: number;
  metalness?: number;

  // Edge lines
  edgeLines?: boolean;
  edgeLineColor?: string;
  edgeLineOpacity?: number;
};

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

function deg2rad(d: number) {
  return (d * Math.PI) / 180;
}

export default function TerrainPathBanked({
  terrain,
  getHeightAt,
  points,
  tension = 0.55,
  samples = 220,

  halfWidth = 0.42,
  widthSegments = 10,
  lift = 0.02,

  cutDepth = 0.16,
  bankHeight = 0.1,
  shoulderSoftness = 0.65,

  autoBank = true,
  autoBankStrength = 0.75,
  maxBankAngleDeg = 16,

  color = "#7FEAFF",
  opacity = 0.92,
  emissiveIntensity = 0.22,
  roughness = 0.32,
  metalness = 0.18,

  edgeLines = true,
  edgeLineColor = "#B6F6FF",
  edgeLineOpacity = 0.55,
  swapYZ = false,
}: Props) {
  const { ribbonGeo, leftEdge, rightEdge } = useMemo(() => {
    const sampler = getHeightAt ?? terrain?.current?.getHeightAt;
    if (!sampler || points.length < 2) {
      return {
        ribbonGeo: null as THREE.BufferGeometry | null,
        leftEdge: null as THREE.Vector3[] | null,
        rightEdge: null as THREE.Vector3[] | null,
      };
    }

    // 1) Build smoothed curve in 3D by sampling terrain heights
    const basePts = points.map((p) => {
      const y = sampler(p.x, p.z);
      return new THREE.Vector3(p.x, y, p.z);
    });

    const curve = new THREE.CatmullRomCurve3(basePts, false, "catmullrom", tension);
    const centerline = curve.getPoints(samples);

    // 2) Precompute tangents for banking direction
    const tangents: THREE.Vector3[] = [];
    for (let i = 0; i < centerline.length; i++) {
      const prev = centerline[Math.max(0, i - 1)];
      const next = centerline[Math.min(centerline.length - 1, i + 1)];
      const tan = next.clone().sub(prev).normalize();
      tangents.push(tan);
    }

    // 3) Create ribbon vertices: (samples+1) * (widthSegments+1)
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

      // Re-sample terrain exactly at centerline XZ (curve y may drift slightly due to interpolation)
      void sampler(c.x, c.z);

      const tan = tangents[i];

      // Side vector = up x tangent (perpendicular across ribbon)
      let side = new THREE.Vector3().crossVectors(up, tan).normalize();
      if (side.lengthSq() < 1e-6) side = new THREE.Vector3(1, 0, 0);

      // Banking angle based on local curvature (optional)
      let bankAngle = 0;
      if (autoBank) {
        const prevTan = tangents[Math.max(0, i - 1)];
        const nextTan = tangents[Math.min(tangents.length - 1, i + 1)];
        const curvature = clamp01(prevTan.distanceTo(nextTan));
        const target = curvature * autoBankStrength;
        bankAngle = deg2rad(Math.min(maxBankAngleDeg, target * maxBankAngleDeg));
      }

      // Bank the side vector by rotating it around the tangent axis.
      if (bankAngle !== 0) {
        const q = new THREE.Quaternion().setFromAxisAngle(tan, bankAngle);
        side = side.applyQuaternion(q).normalize();
      }

      // Build cross-section points
      for (let j = 0; j < wCount; j++) {
        const u = j / wSeg; // 0..1
        const xw = u * 2 - 1; // -1..1 across width
        const s = xw;

        const absS = Math.abs(s);

        // Center depression bell
        const centerDepress = 1 - smoothstep(0.0, 0.55, absS);
        const cut = -cutDepth * centerDepress ** 1.35;

        // Shoulder rise: starts around mid, peaks at edges
        const shoulderStart = shoulderSoftness;
        const shoulder = smoothstep(shoulderStart, 1.0, absS);
        const bank = bankHeight * shoulder ** 1.15;

        const profileY = cut + bank;

        const px = c.x + side.x * (s * halfWidth);
        const pz = c.z + side.z * (s * halfWidth);

        // Sample terrain at the actual ribbon vertex
        const terrainY = sampler(px, pz);
        const py = terrainY + lift + profileY;

        if (swapYZ) verts.push(px, pz, py);
        else verts.push(px, py, pz);

        // Approx normals: mostly up; add a bit of side tilt so light reads the banking
        const n = new THREE.Vector3(0, 1, 0)
          .add(side.clone().multiplyScalar(s * 0.18))
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

    // 4) Indices for triangle strip grid
    const rowCount = centerline.length;
    for (let i = 0; i < rowCount - 1; i++) {
      for (let j = 0; j < wSeg; j++) {
        const a = i * wCount + j;
        const b = a + 1;
        const c = (i + 1) * wCount + j;
        const d = c + 1;

        idx.push(a, c, b);
        idx.push(b, c, d);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    geo.setAttribute("normal", new THREE.Float32BufferAttribute(norms, 3));
    geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(idx);
    geo.computeBoundingSphere();

    return { ribbonGeo: geo, leftEdge: leftEdgePts, rightEdge: rightEdgePts };
  }, [
    terrain,
    getHeightAt,
    points,
    tension,
    samples,
    halfWidth,
    widthSegments,
    lift,
    cutDepth,
    bankHeight,
    shoulderSoftness,
    autoBank,
    autoBankStrength,
    maxBankAngleDeg,
    swapYZ,
  ]);

  if (!ribbonGeo) return null;

  return (
    <group>
      <mesh geometry={ribbonGeo}>
        <meshStandardMaterial
          color={new THREE.Color(color)}
          transparent
          opacity={opacity}
          emissive={new THREE.Color(color)}
          emissiveIntensity={emissiveIntensity}
          roughness={roughness}
          metalness={metalness}
        />
      </mesh>

      {edgeLines && leftEdge && rightEdge && (
        <>
          <line>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={leftEdge.length}
                array={new Float32Array(leftEdge.flatMap((v) => [v.x, v.y, v.z]))}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial transparent opacity={edgeLineOpacity} color={edgeLineColor} />
          </line>

          <line>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={rightEdge.length}
                array={new Float32Array(rightEdge.flatMap((v) => [v.x, v.y, v.z]))}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial transparent opacity={edgeLineOpacity} color={edgeLineColor} />
          </line>
        </>
      )}
    </group>
  );
}
