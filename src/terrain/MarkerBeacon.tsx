// src/terrain/MarkerBeacon.tsx
import React, { useMemo, useRef } from "react"
import * as THREE from "three"
import { useFrame, useThree } from "@react-three/fiber"
import { Html } from "@react-three/drei"
import { usePositionNarrative } from "@/position/PositionNarrativeContext"

export type MarkerKind = "risk" | "constraint" | "milestone" | "opportunity" | "signal"

export type MarkerDef = {
  id: string
  kind: MarkerKind
  label: string
  position: THREE.Vector3
  color?: string
}

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

export default function MarkerBeacon({ marker }: { marker: MarkerDef }) {
  const { camera } = useThree()
  const { hoveredId, lockedId, setHoveredId, lockToMarker } = usePositionNarrative()
  const groupRef = useRef<THREE.Group>(null)

  const active = hoveredId === marker.id || lockedId === marker.id
  const baseColor = useMemo(
    () => new THREE.Color(marker.color ?? colorForKind(marker.kind)),
    [marker.kind, marker.color]
  )

  useFrame(() => {
    const g = groupRef.current
    if (!g) return
    const d = camera.position.distanceTo(g.position)
    const s = THREE.MathUtils.clamp(d * 0.02, 0.65, 2.25)
    g.scale.setScalar(s)
  })

  return (
    <group ref={groupRef} position={marker.position}>
      {/* Stem */}
      <mesh position={[0, -0.8, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 1.6, 10]} />
        <meshStandardMaterial
          color={baseColor}
          emissive={baseColor}
          emissiveIntensity={active ? 0.7 : 0.25}
          metalness={0.1}
          roughness={0.35}
        />
      </mesh>

      {/* Orb — interaction target */}
      <mesh
        onPointerOver={(e) => { e.stopPropagation(); setHoveredId(marker.id) }}
        onPointerOut={(e)  => { e.stopPropagation(); setHoveredId(null) }}
        onClick={(e)       => { e.stopPropagation(); lockToMarker(marker.id) }}
      >
        <sphereGeometry args={[0.22, 22, 22]} />
        <meshStandardMaterial
          color={baseColor}
          emissive={baseColor}
          emissiveIntensity={active ? 1.3 : 0.55}
          metalness={0.2}
          roughness={0.25}
        />
      </mesh>

      {/* Halo (only when active) */}
      {active ? (
        <mesh>
          <sphereGeometry args={[0.34, 22, 22]} />
          <meshBasicMaterial color={baseColor} transparent opacity={0.22} depthWrite={false} />
        </mesh>
      ) : null}

      {/* Label (billboard via Html) */}
      <Html
        position={[0, 0.55, 0]}
        center
        style={{ pointerEvents: "none", whiteSpace: "nowrap" }}
      >
        <div
          style={{
            fontSize: 11,
            padding: "4px 10px",
            borderRadius: 999,
            background: "rgba(8,12,16,0.72)",
            border: "1px solid rgba(255,255,255,0.16)",
            color: "rgba(255,255,255,0.92)",
            boxShadow: "0 8px 18px rgba(0,0,0,0.35)",
            backdropFilter: "blur(10px)",
          }}
        >
          {marker.label}
        </div>
      </Html>
    </group>
  )
}
