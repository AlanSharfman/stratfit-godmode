// src/components/intelligence/TerrainTargetPulse.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Terrain Target Pulse
//
// Expanding pulse ring + glow at the terrain anchor position.
// Activates when intelligence targeting is active.
// ~2 second pulse loop. Cyan/emerald depending on anchor type.
// ═══════════════════════════════════════════════════════════════════════════

import React, { memo, useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useIntelligenceTargetStore } from "@/stores/intelligenceTargetStore";
import type { TerrainSurfaceHandle } from "@/terrain/TerrainSurface";

// ────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ────────────────────────────────────────────────────────────────────────────

const PULSE_DURATION = 2.0; // seconds per loop
const MAX_RADIUS = 16;
const MIN_RADIUS = 3;
const MAX_OPACITY = 0.4;
const GLOW_COLOR_CYAN = "#00e5ff";
const GLOW_COLOR_EMERALD = "#34d399";
const GLOW_COLOR_RED = "#ef4444";

// Shared geometries
const ringGeo = new THREE.RingGeometry(0.9, 1.0, 48);
const discGeo = new THREE.CircleGeometry(1, 48);

// ────────────────────────────────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────────────────────────────────

function colorForType(type: string): string {
  if (type === "risk_peak") return GLOW_COLOR_RED;
  if (type === "revenue_engine" || type === "margin_expansion" || type === "capital_efficiency") {
    return GLOW_COLOR_EMERALD;
  }
  return GLOW_COLOR_CYAN;
}

// ────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ────────────────────────────────────────────────────────────────────────────

interface Props {
  terrainRef: React.RefObject<TerrainSurfaceHandle>;
}

const TerrainTargetPulse: React.FC<Props> = memo(({ terrainRef }) => {
  const target = useIntelligenceTargetStore((s) => s.currentTarget);
  const isActive = useIntelligenceTargetStore((s) => s.isActive);

  const groupRef = useRef<THREE.Group>(null);
  const ringMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const discMatRef = useRef<THREE.MeshBasicMaterial>(null);

  const color = useMemo(() => {
    if (!target) return GLOW_COLOR_CYAN;
    return colorForType(target.type);
  }, [target]);

  const position = useMemo((): [number, number, number] => {
    if (!target) return [0, 0, 0];
    const ax = target.position[0];
    const az = target.position[2];
    const terrain = terrainRef.current;
    const ay = terrain ? terrain.getHeightAt(ax, az) + 0.08 : 0.08;
    return [ax, ay, az];
  }, [target, terrainRef]);

  // Pulse animation
  useFrame(() => {
    if (!isActive || !groupRef.current) return;
    const t = (performance.now() * 0.001) % PULSE_DURATION;
    const progress = t / PULSE_DURATION;

    // Scale: expand from min to max
    const scale = MIN_RADIUS + (MAX_RADIUS - MIN_RADIUS) * progress;
    groupRef.current.scale.setScalar(scale);

    // Opacity: fade out as ring expands
    const opacity = MAX_OPACITY * (1 - progress);
    if (ringMatRef.current) ringMatRef.current.opacity = opacity;
    if (discMatRef.current) discMatRef.current.opacity = opacity * 0.25;
  });

  if (!isActive || !target) return null;

  return (
    <group ref={groupRef} position={position} rotation={[-Math.PI / 2, 0, 0]}>
      {/* Pulse ring */}
      <mesh geometry={ringGeo} renderOrder={20}>
        <meshBasicMaterial
          ref={ringMatRef}
          color={color}
          transparent
          opacity={MAX_OPACITY}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Inner glow disc */}
      <mesh geometry={discGeo} renderOrder={19}>
        <meshBasicMaterial
          ref={discMatRef}
          color={color}
          transparent
          opacity={MAX_OPACITY * 0.25}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
});

TerrainTargetPulse.displayName = "TerrainTargetPulse";
export default TerrainTargetPulse;
