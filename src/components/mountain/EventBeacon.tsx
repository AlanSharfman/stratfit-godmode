// src/components/mountain/EventBeacon.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Timeline Event Beacon
//
// Renders a single event beacon on the terrain:
//   • Vertical cylinder beam (translucent)
//   • Glow ring at base
//   • Html label with event description
//
// Events are derived from engineResults.timeline via eventSelectors.
// ═══════════════════════════════════════════════════════════════════════════

import React, { memo, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";

import type { TimelineBeacon } from "@/selectors/eventSelectors";
import type { BeaconType } from "@/selectors/eventSelectors";
import { BEACON_COLORS, BEACON_ICONS } from "@/selectors/eventSelectors";
import type { TerrainSurfaceHandle } from "@/terrain/TerrainSurface";

// ────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ────────────────────────────────────────────────────────────────────────────

const TERRAIN_HALF_W = 560 * 3.0 * 0.5;
const BEAM_HEIGHT = 60;
const BEAM_RADIUS = 1.2;
const RING_RADIUS = 6;
const RING_TUBE = 0.4;
const LABEL_LIFT = BEAM_HEIGHT + 8;
const PULSE_SPEED = 2.0; // ring pulse Hz

// ────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ────────────────────────────────────────────────────────────────────────────

interface Props {
  beacon: TimelineBeacon;
  terrainRef: React.RefObject<TerrainSurfaceHandle>;
  isHighlighted: boolean;
}

const EventBeacon: React.FC<Props> = memo(({ beacon, terrainRef, isHighlighted }) => {
  const ringRef = useRef<THREE.Mesh>(null);
  const beamRef = useRef<THREE.Mesh>(null);

  const color = BEACON_COLORS[beacon.type];
  const icon = BEACON_ICONS[beacon.type];

  // Compute world position from normalized X
  const worldPos = useMemo(() => {
    const x = (beacon.normalizedX - 0.5) * TERRAIN_HALF_W * 1.4;
    const z = 0;
    const terrain = terrainRef.current;
    const y = terrain ? terrain.getHeightAt(x, z) : 0;
    return new THREE.Vector3(x, y, z);
  }, [beacon.normalizedX, terrainRef]);

  // Animate ring pulse
  useFrame(() => {
    if (!ringRef.current) return;
    const t = performance.now() * 0.001;
    const scale = 1 + 0.25 * Math.sin(t * PULSE_SPEED);
    ringRef.current.scale.setScalar(scale);

    const baseOpacity = isHighlighted ? 0.7 : 0.35;
    const mat = ringRef.current.material as THREE.MeshBasicMaterial;
    mat.opacity = baseOpacity + 0.15 * Math.sin(t * PULSE_SPEED * 1.5);

    // Beam glow intensity
    if (beamRef.current) {
      const beamMat = beamRef.current.material as THREE.MeshBasicMaterial;
      beamMat.opacity = isHighlighted ? 0.28 : 0.12;
    }
  });

  return (
    <group position={worldPos}>
      {/* Vertical beam */}
      <mesh ref={beamRef} position={[0, BEAM_HEIGHT / 2, 0]}>
        <cylinderGeometry args={[BEAM_RADIUS, BEAM_RADIUS * 0.6, BEAM_HEIGHT, 8, 1, true]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.12}
          side={THREE.DoubleSide}
          toneMapped={false}
          depthWrite={false}
        />
      </mesh>

      {/* Glow ring at base */}
      <mesh
        ref={ringRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.3, 0]}
      >
        <torusGeometry args={[RING_RADIUS, RING_TUBE, 12, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.35}
          toneMapped={false}
          depthWrite={false}
        />
      </mesh>

      {/* Html label */}
      <Html
        position={[0, LABEL_LIFT, 0]}
        center
        distanceFactor={280}
        style={{ pointerEvents: "none" }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
            opacity: isHighlighted ? 1 : 0.7,
            transition: "opacity 300ms ease",
          }}
        >
          <div
            style={{
              padding: "3px 8px",
              borderRadius: 4,
              background: "rgba(6, 12, 20, 0.8)",
              border: `1px solid ${color}`,
              backdropFilter: "blur(8px)",
              whiteSpace: "nowrap",
            }}
          >
            <span
              style={{
                fontFamily: "ui-monospace, 'JetBrains Mono', monospace",
                fontSize: 10,
                fontWeight: 700,
                color,
                letterSpacing: "0.06em",
              }}
            >
              {icon} {beacon.label}
            </span>
          </div>
          {isHighlighted && (
            <div
              style={{
                padding: "2px 6px",
                borderRadius: 3,
                background: "rgba(6, 12, 20, 0.7)",
                fontSize: 9,
                color: "rgba(226, 240, 255, 0.65)",
                fontFamily: "'Inter', system-ui, sans-serif",
                whiteSpace: "nowrap",
              }}
            >
              {beacon.description}
            </div>
          )}
        </div>
      </Html>
    </group>
  );
});

EventBeacon.displayName = "EventBeacon";
export default EventBeacon;
