import React, { useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

type ScenarioData = {
  score: number;
  arr: number;
  survival: number;
  runway: number;
  label?: string;
};

type Props = {
  scenarioA: ScenarioData; // Baseline
  scenarioB: ScenarioData; // Exploration
  /** Normalized timeline: 0..1 corresponds to T+0 .. T+36 */
  t?: number;
};

const CYAN = new THREE.Color("#22d3ee");   // locked
const INDIGO = new THREE.Color("#6366f1"); // locked (no orange/yellow)
const GRID = new THREE.Color("#0b1322");

function clamp01(x: number) {
  return Math.min(1, Math.max(0, x));
}

/**
 * Institutional "terrain" (not wax):
 * - Broad mass + secondary undulations
 * - No micro-noise shimmer (keeps it clean + fast)
 */
function surfaceZ(x: number, y: number) {
  // big form
  const m1 = Math.sin(x * 0.35) * 0.55 + Math.cos(y * 0.32) * 0.50;
  // shoulder / saddle
  const m2 = Math.sin((x + y) * 0.22) * 0.35;
  // gentle ridge
  const m3 = Math.cos((x - y) * 0.18) * 0.28;

  const z = (m1 + m2 + m3) * 0.55;
  return z;
}

/** Builds a stable "flow path" over the surface. */
function buildPath(seed: number, side: "left" | "right") {
  const pts: THREE.Vector3[] = [];
  const n = 220;

  // Start higher, arc across, then descend (cinematic)
  const dir = side === "left" ? -1 : 1;

  for (let i = 0; i < n; i++) {
    const u = i / (n - 1);

    // wide arc in X, controlled curve in Y
    const x = dir * (5.6 * (1 - u)) + dir * Math.sin(u * Math.PI) * 1.8 + Math.sin((u + seed) * 3.2) * 0.35;
    const y = -3.2 + u * 6.2 + Math.cos((u + seed) * 2.6) * 0.25;

    const z = surfaceZ(x * 0.55, y * 0.55);
    pts.push(new THREE.Vector3(x, z, y));
  }

  return pts;
}

/** A thin "energy tube" line — intentional, not crayon. */
function FlowLine({
  points,
  color,
  t,
  glow = 1.0,
}: {
  points: THREE.Vector3[];
  color: THREE.Color;
  t: number;
  glow?: number;
}) {
  const geom = useMemo(() => {
    // We rebuild position each frame by slicing; keep base points in memo.
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(points.length * 3), 3));
    g.setDrawRange(0, 0);
    return g;
  }, [points]);

  useFrame(() => {
    const k = Math.max(2, Math.floor(clamp01(t) * points.length));
    const arr = (geom.getAttribute("position") as THREE.BufferAttribute).array as Float32Array;

    for (let i = 0; i < k; i++) {
      const p = points[i];
      arr[i * 3 + 0] = p.x;
      arr[i * 3 + 1] = p.y + 0.02; // slightly above surface
      arr[i * 3 + 2] = p.z;
    }

    (geom.getAttribute("position") as THREE.BufferAttribute).needsUpdate = true;
    geom.setDrawRange(0, k);
  });

  return (
    <line>
      <primitive object={geom} attach="geometry" />
      <lineBasicMaterial
        attach="material"
        color={color}
        transparent
        opacity={0.95}
      />
      {/* Controlled "core glow" (not bloom spam) */}
      <line>
        <primitive object={geom} attach="geometry" />
        <lineBasicMaterial
          attach="material"
          color={color}
          transparent
          opacity={0.18 * glow}
        />
      </line>
    </line>
  );
}

/** Divergence ribbon: a cheap strip between A and B (fast, reads instantly). */
function DivergenceRibbon({
  a,
  b,
  t,
}: {
  a: THREE.Vector3[];
  b: THREE.Vector3[];
  t: number;
}) {
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    // two vertices per segment (A & B)
    const count = a.length * 2;
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    g.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(count * 2), 2));
    g.setDrawRange(0, 0);
    return g;
  }, [a.length]);

  const mat = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uOpacity: { value: 0.55 },
        uIndigo: { value: INDIGO.clone() },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uOpacity;
        uniform vec3 uIndigo;
        varying vec2 vUv;

        void main() {
          // vUv.x: along the ribbon, vUv.y: 0 or 1 across
          // Fade in from start, fade out near end (cinematic)
          float along = smoothstep(0.02, 0.12, vUv.x) * (1.0 - smoothstep(0.80, 0.98, vUv.x));

          // Edge softening so it doesn't look like plastic
          float edge = smoothstep(0.0, 0.20, vUv.y) * (1.0 - smoothstep(0.80, 1.0, vUv.y));

          float alpha = uOpacity * along * edge;

          // Indigo "fog energy" (controlled)
          vec3 col = uIndigo * 0.95;

          gl_FragColor = vec4(col, alpha);
        }
      `,
    });
  }, []);

  useFrame(() => {
    const k = Math.max(2, Math.floor(clamp01(t) * a.length));
    const pos = (geom.getAttribute("position") as THREE.BufferAttribute).array as Float32Array;
    const uv = (geom.getAttribute("uv") as THREE.BufferAttribute).array as Float32Array;

    for (let i = 0; i < k; i++) {
      const pa = a[i];
      const pb = b[i];

      // positions: A then B
      pos[(i * 2 + 0) * 3 + 0] = pa.x;
      pos[(i * 2 + 0) * 3 + 1] = pa.y + 0.01;
      pos[(i * 2 + 0) * 3 + 2] = pa.z;

      pos[(i * 2 + 1) * 3 + 0] = pb.x;
      pos[(i * 2 + 1) * 3 + 1] = pb.y + 0.01;
      pos[(i * 2 + 1) * 3 + 2] = pb.z;

      const uAlong = i / Math.max(1, (a.length - 1));
      uv[(i * 2 + 0) * 2 + 0] = uAlong; uv[(i * 2 + 0) * 2 + 1] = 0.0;
      uv[(i * 2 + 1) * 2 + 0] = uAlong; uv[(i * 2 + 1) * 2 + 1] = 1.0;
    }

    (geom.getAttribute("position") as THREE.BufferAttribute).needsUpdate = true;
    (geom.getAttribute("uv") as THREE.BufferAttribute).needsUpdate = true;

    // 2 vertices per segment
    geom.setDrawRange(0, k * 2);
  });

  return (
    <mesh geometry={geom} material={mat}>
      {/* Use TRIANGLE_STRIP via renderer fallback: we simulate strip by indexed draw? */}
    </mesh>
  );
}

/** The "rock" plane: matte, clean, institutional. */
function TerrainPlane() {
  const geo = useMemo(() => {
    const w = 14;
    const h = 12;
    const segX = 180;
    const segY = 160;

    const g = new THREE.PlaneGeometry(w, h, segX, segY);
    g.rotateX(-Math.PI / 2);

    const pos = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i) * 0.55;
      const z = pos.getZ(i) * 0.55;
      const y = surfaceZ(x, z);
      pos.setY(i, y);
    }
    pos.needsUpdate = true;
    g.computeVertexNormals();
    return g;
  }, []);

  const mat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color("#2b3442"),
      roughness: 0.92,
      metalness: 0.02,
      envMapIntensity: 0.25,
    });
  }, []);

  return <mesh geometry={geo} material={mat} receiveShadow castShadow />;
}

export function GodModeMountain({ scenarioA, scenarioB, t = 0.5 }: Props) {
  // Stable paths (Baseline left, Exploration right)
  const pathA = useMemo(() => buildPath(0.12, "left"), []);
  const pathB = useMemo(() => buildPath(0.77, "right"), []);

  const T = clamp01(t);

  return (
    <group position={[0, -0.35, 0]}>
      {/* Lighting: cinematic but controlled */}
      <ambientLight intensity={0.22} />

      <directionalLight
        position={[-6, 8, 6]}
        intensity={0.85}
        color={new THREE.Color("#dbeafe")}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight
        position={[7, 5.5, -4]}
        intensity={0.45}
        color={new THREE.Color("#a5b4fc")}
      />

      {/* Terrain */}
      <TerrainPlane />

      {/* Subtle grid floor tint (helps "mission control" read) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.56, 0]}>
        <planeGeometry args={[30, 30, 1, 1]} />
        <meshBasicMaterial color={GRID} transparent opacity={0.18} />
      </mesh>

      {/* Divergence ribbon (Indigo fog sheet) */}
      <group position={[0, 0.01, 0]}>
        <DivergenceRibbon a={pathA} b={pathB} t={T} />
      </group>

      {/* Flows */}
      <FlowLine points={pathA} color={CYAN} t={T} glow={1.25} />
      <FlowLine points={pathB} color={INDIGO} t={T} glow={1.05} />

      {/* OPTIONAL: later we'll attach "decision markers" at certain u values */}
    </group>
  );
}
