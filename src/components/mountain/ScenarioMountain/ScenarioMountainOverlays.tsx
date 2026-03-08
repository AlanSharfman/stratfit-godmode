import React, { useMemo, useRef, useLayoutEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Grid, Line as DreiLine, Html } from "@react-three/drei";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { clamp01, lerp, smoothSeismicNoise } from "./helpers";
import {
  GRID_W,
  GRID_D,
  MESH_W,
  MESH_D,
  ISLAND_RADIUS,
  BASE_SCALE,
  MASSIF_SCALE,
  RIDGE_SHARPNESS,
  gaussian1,
  gaussian2,
  noise2,
  ridgeNoise,
  applySoftCeiling,
  MASSIF_PEAKS,
  CLIFF_BOOST,
  computeStaticTerrainHeight,
} from "./terrainGeometry";
import { SCENARIO_PALETTE_COLORS, heightColor, godModePalette } from "./materials";
import type { ScenarioId } from "@/state/scenarioStore";
import { NeuralBackground } from "@/components/visuals/NeuralBackground";
import { useUIStore } from "@/state/uiStore";

// ============================================================================
// GHOST TERRAIN — Faint wireframe baseline reference
// ============================================================================

export function GhostTerrain({ isVisible, opacityMultiplier = 1 }: { isVisible: boolean; opacityMultiplier?: number }) {
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(MESH_W, MESH_D, GRID_W / 2, GRID_D / 2);
    const pos = geo.attributes.position;
    const count = pos.count;
    const wHalf = MESH_W / 2;
    
    // Static baseline datapoints (neutral values)
    const baselineDP = [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5];
    
    for (let i = 0; i < count; i++) {
      const x = pos.getX(i);
      const z = pos.getY(i);
      const kpiX = ((x + wHalf) / MESH_W) * 6;
      
      let ridge = 0;
      for (let idx = 0; idx < 7; idx++) {
        const v = baselineDP[idx];
        const g = gaussian1(kpiX, idx, 0.48);
        ridge += Math.pow(v, RIDGE_SHARPNESS) * g;
      }
      
      let h = ridge * BASE_SCALE * 0.6; // Slightly lower than main
      
      // Add basic massif shape
      for (const m of MASSIF_PEAKS) {
        const g = gaussian2(x - m.x, z - m.z, m.sigmaX * 1.2, m.sigmaZ * 1.2);
        h += g * m.amplitude * MASSIF_SCALE * 0.5;
      }
      
      // Island mask
      const dist = Math.sqrt(x * x + z * z * 1.4);
      const mask = Math.max(0, 1 - Math.pow(dist / ISLAND_RADIUS, 2.0));
      h = Math.max(0, h * mask * 0.8);
      
      pos.setZ(i, h);
    }
    
    geo.computeVertexNormals();
    return geo;
  }, []);
  
  // TACTICAL GREY: Ghost is a faint blueprint schematic
  const targetOpacity = (isVisible ? 0.08 : 0) * opacityMultiplier;  // 8% wireframe — subtle reference
  const fillOpacity = (isVisible ? 0.02 : 0) * opacityMultiplier;    // 2% fill — barely there
  
  return (
    <group 
      rotation={[-Math.PI / 2, 0, 0]} 
      position={[0, -2.15, 0]}
      scale={[0.995, 0.995, 0.995]} // Slightly smaller to avoid Z-fighting
      renderOrder={10}
    >
      {/* Ghost Wireframe — Tactical Silver baseline (blueprint look) */}
      <mesh geometry={geometry}>
        <meshBasicMaterial 
          color="#cbd5e1"       // Silver/Light Slate — neutral reference
          wireframe 
          transparent 
          opacity={targetOpacity}
          side={THREE.DoubleSide}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      {/* Subtle fill for depth */}
      <mesh geometry={geometry}>
        <meshBasicMaterial 
          color="#94a3b8"       // Slate Grey — neutral fill
          transparent 
          opacity={fillOpacity}
          side={THREE.DoubleSide}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

// ============================================================================
// RECALIBRATION SCAN LINE — Thin horizontal sweep (structural signal)
// Passes once across the mountain during recalibration. No glow burst.
// ============================================================================

export function RecalibrationScanLine({ active }: { active: boolean }) {
  const lineRef = useRef<THREE.Mesh>(null);
  const progressRef = useRef(0);
  const wasActiveRef = useRef(false);

  useFrame((_, delta) => {
    if (!lineRef.current) return;

    // Reset sweep on new activation
    if (active && !wasActiveRef.current) {
      progressRef.current = 0;
    }
    wasActiveRef.current = active;

    if (active && progressRef.current < 1) {
      // Single sweep: y = -4 → +7 over ~2.2 seconds
      progressRef.current = Math.min(1, progressRef.current + delta / 2.2);
      const y = -4 + progressRef.current * 11;
      lineRef.current.position.y = y;

      // Fade envelope: soft in, hold, soft out — no abrupt edges
      const t = progressRef.current;
      const envelope = t < 0.06 ? t / 0.06
        : t > 0.90 ? (1 - t) / 0.10
        : 1;
      const mat = lineRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = envelope * 0.30;
      lineRef.current.visible = true;
    } else {
      lineRef.current.visible = false;
    }
  });

  return (
    <mesh ref={lineRef} visible={false}>
      <planeGeometry args={[55, 0.05]} />
      <meshBasicMaterial
        color="#22d3ee"
        transparent
        opacity={0}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

// ============================================================================
// GOD MODE: INTERQUARTILE CONFIDENCE ENVELOPE (Section 3)
// Translucent mesh showing P25-P75 dispersion band around median mountain
// ============================================================================

export function ConfidenceEnvelope({
  dataPoints,
  spread,
  enabled,
}: {
  dataPoints: number[];
  spread: number;
  enabled: boolean;
}) {
  const geometry = useMemo(() => {
    if (!enabled) return null;

    const geo = new THREE.PlaneGeometry(MESH_W, MESH_D, Math.floor(GRID_W / 2), Math.floor(GRID_D / 2));
    const pos = geo.attributes.position;
    const count = pos.count;
    const wHalf = MESH_W / 2;

    const dp = dataPoints?.length === 7 ? dataPoints : [0.5, 0.5, 0.6, 0.4, 0.5, 0.45, 0.35];
    // Expand data points by spread factor (upper IQR bound)
    const expanded = dp.map((v) => clamp01(v * (1 + spread * 0.8)));

    for (let i = 0; i < count; i++) {
      const x = pos.getX(i);
      const z = pos.getY(i);
      const kpiX = ((x + wHalf) / MESH_W) * 6;

      let ridge = 0;
      for (let idx = 0; idx < 7; idx++) {
        const v = clamp01(expanded[idx]);
        const g = gaussian1(kpiX, idx, 0.55); // Slightly wider sigma for envelope
        ridge += Math.pow(v, RIDGE_SHARPNESS) * g;
      }

      let h = ridge * BASE_SCALE;

      for (const m of MASSIF_PEAKS) {
        const g = gaussian2(x - m.x, z - m.z, m.sigmaX * 1.1, m.sigmaZ * 1.1);
        h += g * m.amplitude * MASSIF_SCALE;
      }

      const dist = Math.sqrt(x * x + z * z * 1.4);
      const mask = Math.max(0, 1 - Math.pow(dist / ISLAND_RADIUS, 2.0));
      const cliff = Math.pow(mask, 0.45) * CLIFF_BOOST;
      const n = noise2(x, z) * 0.2;
      let finalH = Math.max(0, (h + n) * mask * cliff);
      finalH = applySoftCeiling(finalH);

      pos.setZ(i, finalH);
    }

    geo.computeVertexNormals();
    return geo;
  }, [dataPoints, spread, enabled]);

  if (!geometry) return null;

  return (
    <group rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.97, 0]} scale={[0.902, 0.902, 0.902]} renderOrder={50}>
      {/* Upper envelope wireframe — desaturated cyan */}
      <mesh geometry={geometry}>
        <meshBasicMaterial
          color="#3a8fa8"
          wireframe
          transparent
          opacity={0.12}
          side={THREE.DoubleSide}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      {/* Subtle fill for depth perception */}
      <mesh geometry={geometry}>
        <meshBasicMaterial
          color="#2d7a94"
          transparent
          opacity={0.04}
          side={THREE.DoubleSide}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

// ============================================================================
// GOD MODE: STRUCTURAL AXES (Section 4)
// Enterprise Value ↑ (left) + Time Horizon → (ground)
// Institutional, engraved, low opacity
// ============================================================================

export function StructuralAxes() {
  return (
    <group>
      {/* Vertical axis — left side of terrain */}
      <DreiLine
        points={[
          new THREE.Vector3(-24, -2.5, 0),
          new THREE.Vector3(-24, 7, 0),
        ]}
        color="#334155"
        lineWidth={0.5}
        transparent
        opacity={0.2}
      />
      {/* Vertical axis ticks */}
      {[0, 1.5, 3.0, 4.5, 6.0].map((offset) => (
        <DreiLine
          key={offset}
          points={[
            new THREE.Vector3(-24, -2.5 + offset, 0),
            new THREE.Vector3(-23.4, -2.5 + offset, 0),
          ]}
          color="#334155"
          lineWidth={0.4}
          transparent
          opacity={0.15}
        />
      ))}
      {/* Label: Enterprise Value ↑ */}
      <Html position={[-26.5, 2, 0]} center style={{ pointerEvents: "none" }}>
        <div
          style={{
            fontSize: 9,
            fontWeight: 600,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "rgba(148, 163, 184, 0.25)",
            fontFamily: "'Inter', sans-serif",
            whiteSpace: "nowrap",
            transform: "rotate(-90deg)",
            transformOrigin: "center",
            userSelect: "none",
          }}
        >
          Enterprise Value ↑
        </div>
      </Html>
      {/* Ground plane label: Time Horizon → */}
      <Html position={[0, -2.7, 14]} center style={{ pointerEvents: "none" }}>
        <div
          style={{
            fontSize: 9,
            fontWeight: 600,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "rgba(148, 163, 184, 0.25)",
            fontFamily: "'Inter', sans-serif",
            whiteSpace: "nowrap",
            userSelect: "none",
          }}
        >
          Time Horizon →
        </div>
      </Html>
    </group>
  );
}

// ============================================================================
// GOD MODE: BASELINE REFERENCE LINE (Section 5)
// Thin horizontal line across terrain representing current state
// ============================================================================

export function BaselineRefLine({ height }: { height: number }) {
  return (
    <group>
      {/* Thin horizontal plane */}
      <mesh position={[0, height, 0]}>
        <planeGeometry args={[46, 0.015]} />
        <meshBasicMaterial
          color="#22d3ee"
          transparent
          opacity={0.12}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      {/* Subtle glow line */}
      <mesh position={[0, height, 0]}>
        <planeGeometry args={[46, 0.06]} />
        <meshBasicMaterial
          color="#22d3ee"
          transparent
          opacity={0.04}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      {/* Label */}
      <Html position={[24.5, height + 0.4, 0]} center style={{ pointerEvents: "none" }}>
        <div
          style={{
            fontSize: 8,
            fontWeight: 600,
            letterSpacing: "0.08em",
            color: "rgba(34, 211, 238, 0.3)",
            fontFamily: "'Inter', sans-serif",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
            userSelect: "none",
          }}
        >
          Baseline
        </div>
      </Html>
    </group>
  );
}

// ============================================================================
// Annotation definitions for the 7 mountain zones
// ============================================================================

export const KPI_ANNOTATION_DEFS = [
  { key: "revenue",    label: "REVENUE",  color: "#22d3ee" },
  { key: "margin",     label: "MARGIN",   color: "#34d399" },
  { key: "runway",     label: "RUNWAY",   color: "#60a5fa" },
  { key: "cash",       label: "CASH",     color: "#a78bfa" },
  { key: "burn",       label: "BURN",     color: "#fbbf24" },
  { key: "efficiency", label: "LTV/CAC",  color: "#22d3ee" },
  { key: "risk",       label: "RISK",     color: "#f87171" },
];

// ============================================================================
// GOD MODE: TERRAIN SURFACE RIDGE LINE (Mountain Clarity)
// DreiLine that follows the actual terrain heightfield along the ridge spine.
// Replaces 2D TrajectoryOverlay which couldn't match the 3D projection.
// ============================================================================

export function TerrainRidgeLine({
  dataPoints,
  enabled,
}: {
  dataPoints: number[];
  enabled: boolean;
}) {
  const points = useMemo(() => {
    if (!enabled) return [];
    const dp = dataPoints?.length === 7 ? dataPoints : [0.5, 0.5, 0.6, 0.4, 0.5, 0.45, 0.35];
    const wHalf = MESH_W / 2;
    const ridgeZ = -1.5; // planeY where signature peaks center (z + 1.5 = 0)
    const pts: THREE.Vector3[] = [];
    const numSamples = 120;

    for (let i = 0; i <= numSamples; i++) {
      const t = i / numSamples;
      const x = lerp(-wHalf, wHalf, t);
      const h = computeStaticTerrainHeight(x, ridgeZ, dp);
      // Place slightly above surface to avoid z-fighting
      pts.push(new THREE.Vector3(x, ridgeZ, h + 0.15));
    }

    return pts;
  }, [dataPoints, enabled]);

  if (!enabled || !points.length) return null;

  return (
    <group rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} scale={[0.9, 0.9, 0.9]}>
      {/* Subtle glow underline */}
      <DreiLine
        points={points}
        color="#00E0FF"
        lineWidth={2.5}
        transparent
        opacity={0.08}
      />
      {/* Primary ridge line — thin, precise */}
      <DreiLine
        points={points}
        color="#00E0FF"
        lineWidth={1}
        transparent
        opacity={0.35}
      />
    </group>
  );
}

// ============================================================================
// GOD MODE: TERRAIN SURFACE ANNOTATIONS (Mountain Clarity)
// Permanent 3D-positioned labels at each KPI zone on the mountain surface.
// Always visible. Explains shape + numbers. Reconciles with right-hand panel.
// Uses Html from drei to project 3D positions to screen automatically.
// ============================================================================

export function TerrainSurfaceAnnotations({
  dataPoints,
  kpiValues,
  enabled,
}: {
  dataPoints: number[];
  kpiValues: Record<string, { value?: number; label?: string }>;
  enabled: boolean;
}) {
  const annotations = useMemo(() => {
    if (!enabled) return [];
    const dp = dataPoints?.length === 7 ? dataPoints : [0.5, 0.5, 0.6, 0.4, 0.5, 0.45, 0.35];
    const wHalf = MESH_W / 2;
    const ridgeZ = -1.5;

    const runway = kpiValues?.runway?.value ?? 24;
    const ltvCac = kpiValues?.ltvCac?.value ?? 3;
    const riskIndex = kpiValues?.riskIndex?.value ?? 70;

    return KPI_ANNOTATION_DEFS.map((def, idx) => {
      const x = lerp(-wHalf, wHalf, idx / 6);
      const h = computeStaticTerrainHeight(x, ridgeZ, dp);
      const value = dp[idx];

      let displayValue: string;
      let description: string;

      switch (def.key) {
        case "revenue":
          displayValue = `${Math.round(value * 100)}%`;
          description = value > 0.6 ? "Strong growth drives upward slope" : "Revenue pressure flattens terrain";
          break;
        case "margin":
          displayValue = `${Math.round(value * 100)}%`;
          description = value > 0.55 ? "Healthy margins support elevation" : "Margin compression limits peak";
          break;
        case "runway":
          displayValue = `${Math.round(runway)}mo`;
          description = runway >= 18 ? "Capital buffer maintains ridge height" : "Short runway erodes formation";
          break;
        case "cash":
          displayValue = `${Math.round(value * 100)}%`;
          description = value > 0.5 ? "Cash reserves sustain mountain mass" : "Low reserves weaken structure";
          break;
        case "burn":
          displayValue = `${Math.round(value * 100)}%`;
          description = value > 0.5 ? "Disciplined burn maintains form" : "Excessive burn erodes base";
          break;
        case "efficiency":
          displayValue = `${ltvCac.toFixed(1)}x`;
          description = ltvCac >= 3 ? "Efficient acquisition builds height" : "High CAC suppresses elevation";
          break;
        case "risk":
          displayValue = `${Math.round(riskIndex)}%`;
          description = riskIndex > 50 ? "Low risk sharpens ridgeline" : "High risk softens peak";
          break;
        default:
          displayValue = `${Math.round(value * 100)}%`;
          description = "";
      }

      return { ...def, x, z: ridgeZ, h: h + 0.5, value, displayValue, description };
    });
  }, [dataPoints, kpiValues, enabled]);

  if (!enabled || !annotations.length) return null;

  return (
    <group rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} scale={[0.9, 0.9, 0.9]}>
      {annotations.map((ann) => (
        <group key={ann.key} position={[ann.x, ann.z, ann.h]}>
          {/* Node sphere — on the surface */}
          <mesh>
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshBasicMaterial
              color={ann.color}
              transparent
              opacity={0.6}
              depthWrite={false}
            />
          </mesh>
          {/* Glow halo */}
          <mesh>
            <sphereGeometry args={[0.24, 16, 16]} />
            <meshBasicMaterial
              color={ann.color}
              transparent
              opacity={0.1}
              depthWrite={false}
            />
          </mesh>
          {/* Vertical connector down to surface */}
          <DreiLine
            points={[
              new THREE.Vector3(0, 0, 0),
              new THREE.Vector3(0, 0, -0.5),
            ]}
            color={ann.color}
            lineWidth={0.5}
            transparent
            opacity={0.2}
          />
          {/* Html label — ALWAYS VISIBLE, projected from 3D */}
          <Html
            position={[0, 0, 1.2]}
            center
            style={{ pointerEvents: "none", userSelect: "none", whiteSpace: "nowrap" }}
            distanceFactor={14}
            occlude={false}
          >
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 1,
            }}>
              {/* Metric label */}
              <span style={{
                fontSize: 8,
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase" as const,
                color: ann.color,
                opacity: 0.7,
                fontFamily: "'Inter', sans-serif",
                textShadow: "0 1px 6px rgba(0,0,0,0.95), 0 0 3px rgba(0,0,0,0.8)",
              }}>
                {ann.label}
              </span>
              {/* Value — prominent */}
              <span style={{
                fontSize: 13,
                fontWeight: 700,
                color: "rgba(255, 255, 255, 0.92)",
                fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
                textShadow: "0 1px 8px rgba(0,0,0,0.98), 0 0 4px rgba(0,0,0,0.9)",
                fontVariantNumeric: "tabular-nums",
                lineHeight: 1,
              }}>
                {ann.displayValue}
              </span>
              {/* Description — explains what this zone means */}
              <span style={{
                fontSize: 7,
                fontWeight: 500,
                color: "rgba(255, 255, 255, 0.4)",
                fontFamily: "'Inter', sans-serif",
                textShadow: "0 1px 4px rgba(0,0,0,0.95)",
                maxWidth: 110,
                textAlign: "center",
                lineHeight: 1.3,
              }}>
                {ann.description}
              </span>
            </div>
          </Html>
        </group>
      ))}
    </group>
  );
}

// ============================================================================
// DIGITAL HORIZON — Infinite Floor Grid + Data Dust (Scenario-Aware)
// ============================================================================

export const SCENARIO_GRID_COLORS: Record<ScenarioId, string> = {
  base: "#38bdf8",     // Sky Blue
  upside: "#34d399",   // Emerald
  downside: "#fbbf24", // Amber
  stress: "#f87171",   // Red
};

export function DigitalHorizon({ scenarioId, glowMultiplier = 1, baseOpacity = 1, isRecalibrating = false }: { scenarioId: ScenarioId; glowMultiplier?: number; baseOpacity?: number; isRecalibrating?: boolean }) {
  const gridColor = SCENARIO_GRID_COLORS[scenarioId] || SCENARIO_GRID_COLORS.base;
  const lightColor = SCENARIO_PALETTE_COLORS[scenarioId]?.idle || "#22d3ee";
  const gridGroupRef = useRef<THREE.Group>(null);

  // Grid micro-shift during recalibration — very subtle structural signal
  useFrame((_, delta) => {
    if (!gridGroupRef.current) return;
    const targetX = isRecalibrating ? 0.035 : 0;
    const targetZ = isRecalibrating ? 0.025 : 0;
    const ease = Math.min(1, delta * 3);
    gridGroupRef.current.position.x += (targetX - gridGroupRef.current.position.x) * ease;
    gridGroupRef.current.position.z += (targetZ - gridGroupRef.current.position.z) * ease;
  });
  
  return (
    <>
      {/* 1. The Infinite Floor Grid — Color matches scenario */}
      <group ref={gridGroupRef}>
        <Grid 
        position={[0, -2.5, 0]} 
          args={[50, 50]}
          cellSize={1} 
          cellThickness={0.8} 
          cellColor="#1e293b"
          sectionSize={5} 
          sectionThickness={1.5} 
          sectionColor={gridColor}  // Dynamic scenario color
          fadeDistance={40}
          fadeStrength={1.2}
          infiniteGrid
        />
      </group>
      
      {/* 2. NEURAL CONSTELLATION — Floating nodes that connect when simulating */}
      <NeuralBackground />
      
      {/* 3. SUBSURFACE GLOW — Color matches scenario */}
      <pointLight 
        position={[0, -4, 0]} 
        intensity={1.2 * glowMultiplier * baseOpacity}
        color={lightColor}        // Dynamic scenario color
        distance={25} 
        decay={2}
      />
      <pointLight 
        position={[0, -3, 5]} 
        intensity={0.7 * glowMultiplier * baseOpacity}
        color={lightColor}        // Dynamic scenario color
        distance={18} 
        decay={2}
      />
    </>
  );
}

// ============================================================================
// CINEMATIC CONTROLLER — Zoomed-Out Undulation View
// ============================================================================

interface CinematicControllerProps {
  children: React.ReactNode;
  riskLevel?: number;
}

export function CinematicController({ children, riskLevel = 0 }: CinematicControllerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const hasInteracted = useUIStore((s) => s.hasInteracted);
  const riskShakeRef = useRef(0);
  
  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    const t = state.clock.elapsedTime;
    
    // 1. RISK REACTION (Seismic Shake) — Always active when risk is high
    const dt = Math.min(0.05, Math.max(0.001, delta));
    const riskShakeTarget =
      riskLevel > 40
        ? smoothSeismicNoise(t, 0.37) * 0.015 * (riskLevel / 100)
        : 0;
    riskShakeRef.current = THREE.MathUtils.damp(riskShakeRef.current, riskShakeTarget, 10, dt);
    const riskShake = riskShakeRef.current;
    
    if (!hasInteracted) {
      // 2. IDLE MODE: SUBTLE UNDULATION (ZOOMED OUT)
      const yaw = Math.sin(t * 0.10) * 0.25 + Math.sin(t * 0.05) * 0.10;
      groupRef.current.rotation.y = yaw;
      
      groupRef.current.rotation.x = 0;
      groupRef.current.rotation.z = 0;
      
      // Position: Only seismic shake (no vertical bobbing)
      groupRef.current.position.y = riskShake;
      
    } else {
      // 3. ACTIVE MODE: LOCK TO STATION
      groupRef.current.rotation.y = THREE.MathUtils.damp(
        groupRef.current.rotation.y, 
        0, 
        3.5, 
        delta
      );
      groupRef.current.rotation.x = THREE.MathUtils.damp(
        groupRef.current.rotation.x, 
        0, 
        3.5, 
        delta
      );
      groupRef.current.rotation.z = THREE.MathUtils.damp(
        groupRef.current.rotation.z, 
        0, 
        3.5, 
        delta
      );
      groupRef.current.position.y = THREE.MathUtils.damp(
        groupRef.current.position.y, 
        0, 
        3.5, 
        delta
      ) + riskShake;
    }
  });
  
  return <group ref={groupRef}>{children}</group>;
}

// ============================================================================
// BASELINE AUTO ROTATE — Institutional crawl (pausable)
// ============================================================================

export function BaselineAutoRotate({ children, paused }: { children: React.ReactNode; paused: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (!groupRef.current) return;
    if (paused) return;
    // ~0.6°/sec
    groupRef.current.rotation.y += delta * 0.0105;
  });
  return <group ref={groupRef}>{children}</group>;
}

// ============================================================================
// CAMERA RESET EFFECT
// ============================================================================

export function CameraResetEffect({
  resetKey,
  controlsRef,
  cameraPosition,
  target,
}: {
  resetKey?: number;
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
  cameraPosition: [number, number, number];
  target: [number, number, number];
}) {
  const { camera } = useThree();

  useLayoutEffect(() => {
    if (resetKey === undefined) return;

    camera.position.set(cameraPosition[0], cameraPosition[1], cameraPosition[2]);
    camera.updateProjectionMatrix();

    const controls = controlsRef.current;
    if (controls) {
      controls.target.set(target[0], target[1], target[2]);
      controls.update();
    } else {
      camera.lookAt(target[0], target[1], target[2]);
    }
  }, [camera, cameraPosition, controlsRef, resetKey, target]);

  return null;
}
