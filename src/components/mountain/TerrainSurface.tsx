import React, { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import * as THREE from "three";

export type TerrainSurfaceHandle = {
  getHeightAt: (worldX: number, worldZ: number) => number; // returns local Y (mesh space)
  width: number;
  depth: number;
  segX: number;
  segZ: number;
};

type Props = {
  width?: number;
  depth?: number;
  segX?: number;
  segZ?: number;
  wireColor?: string;
  wireOpacity?: number;

  amplitude?: number;
  ridgeStrength?: number;
  basinStrength?: number;
  plateauStrength?: number;
  channelStrength?: number;
  seed?: number;
};

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

function hash2(ix: number, iz: number, seed: number) {
  let n = ix * 374761393 + iz * 668265263 + seed * 1.44269504088896e18;
  n = (n ^ (n >> 13)) * 1274126177;
  n = n ^ (n >> 16);
  return (n >>> 0) / 4294967295;
}

function valueNoise2(x: number, z: number, seed: number) {
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fz = z - iz;

  const a = hash2(ix, iz, seed);
  const b = hash2(ix + 1, iz, seed);
  const c = hash2(ix, iz + 1, seed);
  const d = hash2(ix + 1, iz + 1, seed);

  const u = fx * fx * (3 - 2 * fx);
  const v = fz * fz * (3 - 2 * fz);

  const ab = a + (b - a) * u;
  const cd = c + (d - c) * u;
  return ab + (cd - ab) * v; // 0..1
}

function fbm(x: number, z: number, seed: number, octaves = 4) {
  let sum = 0;
  let amp = 0.5;
  let freq = 1;
  for (let i = 0; i < octaves; i++) {
    sum += (valueNoise2(x * freq, z * freq, seed + i * 1013) * 2 - 1) * amp;
    freq *= 2;
    amp *= 0.5;
  }
  return sum; // ~ -1..1
}

function sdSegment(px: number, pz: number, ax: number, az: number, bx: number, bz: number) {
  const pax = px - ax;
  const paz = pz - az;
  const bax = bx - ax;
  const baz = bz - az;
  const h = clamp01((pax * bax + paz * baz) / (bax * bax + baz * baz + 1e-6));
  const dx = pax - bax * h;
  const dz = paz - baz * h;
  return Math.sqrt(dx * dx + dz * dz);
}

function channelField(x: number, z: number) {
  const pts: Array<[number, number]> = [
    [-6, 2],
    [-2, 1],
    [1, -0.5],
    [4, -1.2],
    [7, -2.0],
  ];

  let dMin = Infinity;
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, az] = pts[i];
    const [bx, bz] = pts[i + 1];
    dMin = Math.min(dMin, sdSegment(x, z, ax, az, bx, bz));
  }

  const core = Math.exp(-(dMin * dMin) / (0.18 * 0.18));
  const bank = Math.exp(-(dMin * dMin) / (0.8 * 0.8));
  return { core, bank };
}

function heroMound(x: number, z: number) {
  const m1 = Math.exp(-((x + 1.5) ** 2 + (z + 0.3) ** 2) / (2 * 2.2 ** 2));
  const m2 = Math.exp(-((x - 4.2) ** 2 + (z + 0.6) ** 2) / (2 * 1.4 ** 2));
  return 0.9 * m1 + 0.55 * m2;
}

function ridgeField(x: number, z: number, seed: number) {
  const n = fbm(x * 0.12, z * 0.12, seed, 5);
  const r = 1 - Math.abs(n);
  const sharp = Math.pow(clamp01(r), 3.2);
  return sharp; // 0..1
}

function basinField(x: number, z: number, seed: number) {
  const n = fbm(x * 0.06, z * 0.06, seed + 999, 4);
  return clamp01((-n + 1) * 0.5);
}

function plateauField(h: number) {
  const steps = 6;
  const t = (h + 1) * 0.5;
  const q = Math.round(t * steps) / steps;
  return (t * 0.55 + q * 0.45) * 2 - 1;
}

function bilerp(a: number, b: number, c: number, d: number, tx: number, tz: number) {
  const ab = a + (b - a) * tx;
  const cd = c + (d - c) * tx;
  return ab + (cd - ab) * tz;
}

const TerrainSurface = forwardRef<TerrainSurfaceHandle, Props>(function TerrainSurface(
  {
    width = 18,
    depth = 10,
    segX = 220,
    segZ = 140,
    wireColor = "#6FE7FF",
    wireOpacity = 0.95,
    amplitude = 2.25,
    ridgeStrength = 1.1,
    basinStrength = 0.7,
    plateauStrength = 0.55,
    channelStrength = 0.55,
    seed = 1337,
  },
  ref
) {
  const meshRef = useRef<THREE.Mesh>(null);

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(width, depth, segX, segZ);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position as THREE.BufferAttribute;

    const halfW = width / 2;
    const halfD = depth / 2;

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);

      const nx = x / halfW;
      const nz = z / halfD;

      const ridges = ridgeField(x, z, seed) * ridgeStrength;
      const basins = basinField(x, z, seed) * basinStrength;
      const micro = fbm(x * 0.22, z * 0.22, seed + 777, 3) * 0.18;

      const ch = channelField(x, z);
      const carve = -ch.core * 0.65 * channelStrength;
      const banks = ch.bank * 0.18 * channelStrength;

      const mound = heroMound(x, z);

      let h = 0;
      h += ridges * 0.75;
      h -= basins * 0.55;
      h += mound * 1.25;
      h += micro;
      h += carve + banks;

      const terraced = plateauField(h);
      h = h * (1 - plateauStrength) + terraced * plateauStrength;

      const edge = clamp01(1 - (Math.abs(nx) ** 6 + Math.abs(nz) ** 6));
      h *= edge;

      pos.setY(i, y + h * amplitude);
    }

    geo.computeVertexNormals();
    return geo;
  }, [width, depth, segX, segZ, amplitude, ridgeStrength, basinStrength, plateauStrength, channelStrength, seed]);

  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(wireColor),
      wireframe: true,
      transparent: true,
      opacity: wireOpacity,
      emissive: new THREE.Color(wireColor),
      emissiveIntensity: 0.22,
      metalness: 0.15,
      roughness: 0.35,
    });
  }, [wireColor, wireOpacity]);

  const getHeightAt = (worldX: number, worldZ: number) => {
    const geo = geometry;
    const pos = geo.attributes.position as THREE.BufferAttribute;

    const mesh = meshRef.current;
    let x = worldX;
    let z = worldZ;

    if (mesh) {
      const wp = new THREE.Vector3(worldX, 0, worldZ);
      mesh.worldToLocal(wp);
      x = wp.x;
      z = wp.z;
    }

    const halfW = width / 2;
    const halfD = depth / 2;

    const u = clamp01((x + halfW) / width);
    const v = clamp01((z + halfD) / depth);

    const gx = u * segX;
    const gz = v * segZ;

    const ix = Math.floor(gx);
    const iz = Math.floor(gz);

    const tx = gx - ix;
    const tz = gz - iz;

    const vx = segX + 1;

    const i00 = iz * vx + ix;
    const i10 = iz * vx + Math.min(ix + 1, segX);
    const i01 = Math.min(iz + 1, segZ) * vx + ix;
    const i11 = Math.min(iz + 1, segZ) * vx + Math.min(ix + 1, segX);

    const y00 = pos.getY(i00);
    const y10 = pos.getY(i10);
    const y01 = pos.getY(i01);
    const y11 = pos.getY(i11);

    return bilerp(y00, y10, y01, y11, tx, tz);
  };

  useImperativeHandle(
    ref,
    () => ({
      getHeightAt,
      width,
      depth,
      segX,
      segZ,
    }),
    [width, depth, segX, segZ, geometry]
  );

  return <mesh ref={meshRef} geometry={geometry} material={material} />;
});

export default TerrainSurface;
