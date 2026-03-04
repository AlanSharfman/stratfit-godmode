// src/components/command/CinematicBeaconLayer.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Cinematic Beacon Layer (Command Centre)
//
// Renders pulsing glow beacons at all highlightMarker positions during
// director playback. Each beacon is a sphere + expanding ring + point light
// placed at the terrain-sampled anchor position.
//
// Consumed by TerrainTheatre as a child of TerrainStage (inside R3F Canvas).
// ═══════════════════════════════════════════════════════════════════════════

import React, { memo, useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getTerrainAnchor } from "@/terrain/terrainAnchors";
import type { TerrainSurfaceHandle } from "@/terrain/TerrainSurface";

const BEACON_COLOR_PRIMARY = "#22d3ee";
const BEACON_COLOR_RISK = "#ef4444";
const BEACON_COLOR_VALUE = "#34d399";
const PULSE_SPEED = 1.8;
const BEACON_RADIUS = 1.8;
const RING_MAX_SCALE = 12;
const RING_CYCLE = 2.4;

const ringGeo = new THREE.RingGeometry(0.9, 1.0, 32);
const sphereGeo = new THREE.SphereGeometry(1, 16, 16);

function beaconColor(anchorId: string): string {
  if (anchorId.includes("risk")) return BEACON_COLOR_RISK;
  if (anchorId.includes("ev") || anchorId.includes("valuation") || anchorId.includes("revenue")) return BEACON_COLOR_VALUE;
  return BEACON_COLOR_PRIMARY;
}

interface SingleBeaconProps {
  anchorId: string;
  terrainRef: React.RefObject<TerrainSurfaceHandle>;
}

const SingleBeacon: React.FC<SingleBeaconProps> = memo(({ anchorId, terrainRef }) => {
  const anchor = getTerrainAnchor(anchorId);
  const sphereRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const ringMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const [position, setPosition] = useState<[number, number, number]>([0, -9999, 0]);

  // Sample terrain height imperatively after terrain is confirmed ready
  useEffect(() => {
    if (!anchor) return;
    const ax = anchor.position[0];
    const az = anchor.position[2];
    const terrain = terrainRef.current;
    const ay = terrain ? terrain.getHeightAt(ax, az) + 0.3 : 0.3;
    setPosition([ax, ay, az]);
  }, [anchor, terrainRef]);

  const color = beaconColor(anchorId);

  useFrame(({ clock }) => {
    if (!anchor) return;
    const t = clock.elapsedTime;

    if (sphereRef.current) {
      const pulse = 1 + Math.sin(t * PULSE_SPEED * Math.PI * 2) * 0.15;
      sphereRef.current.scale.setScalar(BEACON_RADIUS * pulse);
      const mat = sphereRef.current.material as THREE.MeshStandardMaterial;
      if (mat) mat.emissiveIntensity = 0.4 + Math.sin(t * PULSE_SPEED * Math.PI * 2) * 0.2;
    }

    if (ringRef.current && ringMatRef.current) {
      const cycle = (t % RING_CYCLE) / RING_CYCLE;
      const scale = 2 + (RING_MAX_SCALE - 2) * cycle;
      ringRef.current.scale.setScalar(scale);
      ringMatRef.current.opacity = 0.35 * (1 - cycle);
    }
  });

  if (!anchor) return null;

  return (
    <group position={position}>
      <mesh ref={sphereRef} geometry={sphereGeo} renderOrder={25}>
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.5}
          transparent
          opacity={0.85}
          depthWrite={false}
        />
      </mesh>

      <mesh
        ref={ringRef}
        geometry={ringGeo}
        rotation={[-Math.PI / 2, 0, 0]}
        renderOrder={24}
      >
        <meshBasicMaterial
          ref={ringMatRef}
          color={color}
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      <pointLight
        color={color}
        intensity={0.6}
        distance={60}
        decay={2}
      />
    </group>
  );
});
SingleBeacon.displayName = "SingleBeacon";

interface CinematicBeaconLayerProps {
  markerIds: string[];
  terrainRef: React.RefObject<TerrainSurfaceHandle>;
}

const CinematicBeaconLayer: React.FC<CinematicBeaconLayerProps> = memo(
  ({ markerIds, terrainRef }) => {
    if (!markerIds.length) return null;

    return (
      <group name="cinematic-beacons">
        {markerIds.map((id) => (
          <SingleBeacon key={id} anchorId={id} terrainRef={terrainRef} />
        ))}
      </group>
    );
  },
);

CinematicBeaconLayer.displayName = "CinematicBeaconLayer";
export default CinematicBeaconLayer;
