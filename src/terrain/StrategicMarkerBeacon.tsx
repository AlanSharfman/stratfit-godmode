// src/terrain/StrategicMarkerBeacon.tsx
// WHY: Lightweight marker beacon that renders inside TerrainStage WITHOUT
// requiring PositionNarrativeProvider. Replaces MarkerBeacon dependency
// so StrategicMarkers can be safely mounted in the Position page canvas.
// Terrain-sampled Y: markers follow ridge elevation via terrainRef.getHeightAt.

import React, { useMemo, useRef } from "react"
import * as THREE from "three"
import { useFrame, useThree } from "@react-three/fiber"
import { Html } from "@react-three/drei"
import type { MarkerDef, MarkerKind } from "./markerTypes"
import type { TerrainSurfaceHandle } from "@/terrain/TerrainSurface"

/** Height lift above terrain surface — ensures marker never clips into terrain */
const MARKER_LIFT = 6

function colorForKind(kind: MarkerKind): string {
  switch (kind) {
    case "risk":        return "#ff3b30"
    case "opportunity": return "#00e28a"
    case "milestone":   return "#00e0ff"
    case "signal":      return "#7c5cff"
    case "constraint":
    default:            return "#8fdcff"
  }
}

type Props = {
  marker: MarkerDef
  terrainRef?: React.RefObject<TerrainSurfaceHandle>
}

export default function StrategicMarkerBeacon({ marker, terrainRef }: Props) {
  const { camera } = useThree()
  const groupRef = useRef<THREE.Group>(null)

  const baseColor = useMemo(
    () => new THREE.Color(marker.color ?? colorForKind(marker.kind)),
    [marker.kind, marker.color],
  )

  // Sample terrain height every frame so markers always sit above terrain,
  // even if terrainRef becomes available after mount.
  useFrame(() => {
    const g = groupRef.current
    if (!g) return

    // Position: terrain-sampled Y + lift
    const mx = marker.position.x
    const mz = marker.position.z
    const terrain = terrainRef?.current
    const y = terrain ? terrain.getHeightAt(mx, mz) + MARKER_LIFT : MARKER_LIFT
    g.position.set(mx, y, mz)

    // Distance-adaptive scale
    const d = camera.position.distanceTo(g.position)
    const s = THREE.MathUtils.clamp(d * 0.025, 1.0, 3.5)
    g.scale.setScalar(s)
  })

  return (
    <group ref={groupRef} position={[marker.position.x, MARKER_LIFT, marker.position.z]}>
      {/* Stem */}
      <mesh position={[0, -2.5, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 5, 10]} />
        <meshStandardMaterial
          color={baseColor}
          emissive={baseColor}
          emissiveIntensity={0.35}
          metalness={0.1}
          roughness={0.35}
          depthTest={false}
          depthWrite={false}
        />
      </mesh>

      {/* Orb */}
      <mesh renderOrder={200}>
        <sphereGeometry args={[0.5, 22, 22]} />
        <meshStandardMaterial
          color={baseColor}
          emissive={baseColor}
          emissiveIntensity={0.65}
          metalness={0.2}
          roughness={0.25}
          depthTest={false}
          depthWrite={false}
        />
      </mesh>

      {/* Halo ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]} renderOrder={199}>
        <ringGeometry args={[0.55, 0.75, 32]} />
        <meshBasicMaterial
          color={baseColor}
          transparent
          opacity={0.25}
          side={THREE.DoubleSide}
          depthTest={false}
          depthWrite={false}
        />
      </mesh>

      {/* Label — colour-accented frosted glass tag (not a black pill) */}
      <Html
        position={[0, 1.2, 0]}
        center
        style={{ pointerEvents: "none", whiteSpace: "nowrap" }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            padding: "4px 12px",
            borderRadius: 6,
            background: "rgba(6, 12, 20, 0.88)",
            border: `1px solid ${marker.color ?? colorForKind(marker.kind)}50`,
            color: marker.color ?? colorForKind(marker.kind),
            boxShadow: `0 0 12px ${marker.color ?? colorForKind(marker.kind)}25, 0 4px 16px rgba(0,0,0,0.5)`,
            backdropFilter: "blur(12px)",
            fontFamily: "'Inter', system-ui, sans-serif",
            userSelect: "none",
          }}
        >
          {marker.label}
        </div>
      </Html>
    </group>
  )
}
