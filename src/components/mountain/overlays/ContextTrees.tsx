import React, { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";

type Vec3 = [number, number, number];

export type ContextTreesProps = {
  terrainGeometry: THREE.BufferGeometry | null;
  count?: number;
  /** Terrain-local bounds in X/Y (plane) and Z (height). */
  bounds?: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
  /** Optional polyline to avoid placing trees near (in X/Y). */
  avoidPolyline?: Vec3[];
  avoidRadius?: number;
};

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function sampleHeightBilinear(
  geometry: THREE.BufferGeometry,
  x: number,
  y: number
): number {
  const pos = geometry.getAttribute("position") as THREE.BufferAttribute | undefined;
  if (!pos) return 0;

  const params = (geometry as any).parameters as
    | {
        width?: number;
        height?: number;
        widthSegments?: number;
        heightSegments?: number;
      }
    | undefined;

  const width = params?.width ?? 50;
  const depth = params?.height ?? 25;
  const segW = params?.widthSegments ?? 120;
  const segD = params?.heightSegments ?? 60;

  const wHalf = width / 2;
  const dHalf = depth / 2;

  const uFloat = ((x + wHalf) / width) * segW;
  const vFloat = ((y + dHalf) / depth) * segD;

  const u0 = clamp(Math.floor(uFloat), 0, segW);
  const v0 = clamp(Math.floor(vFloat), 0, segD);
  const u1 = clamp(u0 + 1, 0, segW);
  const v1 = clamp(v0 + 1, 0, segD);

  const fu = uFloat - u0;
  const fv = vFloat - v0;

  const stride = segW + 1;
  const idx00 = v0 * stride + u0;
  const idx10 = v0 * stride + u1;
  const idx01 = v1 * stride + u0;
  const idx11 = v1 * stride + u1;

  const h00 = pos.getZ(idx00);
  const h10 = pos.getZ(idx10);
  const h01 = pos.getZ(idx01);
  const h11 = pos.getZ(idx11);

  const hx0 = h00 * (1 - fu) + h10 * fu;
  const hx1 = h01 * (1 - fu) + h11 * fu;
  return hx0 * (1 - fv) + hx1 * fv;
}

function distToPolylineXY(p: THREE.Vector2, poly: Vec3[]) {
  let best = Number.POSITIVE_INFINITY;
  for (let i = 0; i < poly.length; i++) {
    const q = new THREE.Vector2(poly[i][0], poly[i][1]);
    best = Math.min(best, p.distanceTo(q));
  }
  return best;
}

export default function ContextTrees({
  terrainGeometry,
  count = 90,
  bounds = { minX: -24, maxX: 24, minY: -11, maxY: 11 },
  avoidPolyline,
  avoidRadius = 1.35,
}: ContextTreesProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const data = useMemo(() => {
    if (!terrainGeometry) return null;

    const rng = mulberry32(1337);

    const transforms: Array<{ pos: THREE.Vector3; scale: number; rotY: number }> = [];

    // Bias trees toward the edges so it reads as "context" not "props"
    for (let i = 0; i < count; i++) {
      const edgeBias = rng();

      const x = THREE.MathUtils.lerp(bounds.minX, bounds.maxX, rng());
      // Pull y toward extremes to keep the center cleaner
      const yMid = THREE.MathUtils.lerp(bounds.minY, bounds.maxY, rng());
      const y = THREE.MathUtils.lerp(yMid, yMid < 0 ? bounds.minY : bounds.maxY, edgeBias * 0.75);

      const p2 = new THREE.Vector2(x, y);
      if (avoidPolyline && avoidPolyline.length > 1) {
        const d = distToPolylineXY(p2, avoidPolyline);
        if (d < avoidRadius) continue;
      }

      const h = sampleHeightBilinear(terrainGeometry, x, y);
      const height = 0.65 + rng() * 1.25;
      const s = 0.65 + rng() * 0.55;
      transforms.push({
        pos: new THREE.Vector3(x, y, h + 0.18),
        scale: s * height,
        rotY: rng() * Math.PI * 2,
      });

      if (transforms.length >= count) break;
    }

    return transforms;
  }, [terrainGeometry, count, bounds, avoidPolyline, avoidRadius]);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh || !data || data.length === 0) return;

    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3();

    for (let i = 0; i < data.length; i++) {
      const t = data[i];
      q.setFromEuler(new THREE.Euler(0, t.rotY, 0));
      s.set(1, 1, 1).multiplyScalar(t.scale);
      m.compose(t.pos, q, s);
      mesh.setMatrixAt(i, m);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, [data]);

  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: "#29d49a",
      transparent: true,
      opacity: 0.13,
      roughness: 0.95,
      metalness: 0,
      depthWrite: false,
    });
  }, []);

  if (!terrainGeometry || !data || data.length === 0) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined as any, undefined as any, data.length]}
      material={material}
      renderOrder={30}
    >
      <coneGeometry args={[0.16, 0.9, 6]} />
    </instancedMesh>
  );
}
