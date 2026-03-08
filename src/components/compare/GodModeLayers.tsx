// src/components/compare/GodModeLayers.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — God Mode Intelligence Layers for Compare Terrain
//
// Renders ConfidenceEnvelope, StructuralAxes, BaselineRefLine,
// TerrainRidgeLine, and TerrainSurfaceAnnotations inside a TerrainStage
// Canvas when godMode is enabled on Compare.
//
// Data flow:
//   scenarioStore.engineResults[scenarioId] → engineResultToMountainForces
//   → dataPoints (number[7]) + kpiValues
//
// These layers replicate the god mode presentation from ScenarioMountainImpl
// but are designed to be injected as <TerrainStage> children (R3F context).
//
// DO NOT import into Studio or Position.
// ═══════════════════════════════════════════════════════════════════════════

import React, { useMemo } from "react"
import * as THREE from "three"
import { Line as DreiLine, Html } from "@react-three/drei"
import { useScenarioStore } from "@/state/scenarioStore"
import { useShallow } from "zustand/react/shallow"
import { engineResultToMountainForces } from "@/logic/mountainForces"
import {
  MESH_W,
  MESH_D,
  GRID_W,
  GRID_D,
  ISLAND_RADIUS,
  RIDGE_SHARPNESS,
  BASE_SCALE,
  MASSIF_SCALE,
  CLIFF_BOOST,
  MASSIF_PEAKS,
  gaussian1,
  gaussian2,
  noise2,
  applySoftCeiling,
  computeStaticTerrainHeight,
} from "@/components/mountain/ScenarioMountain/terrainGeometry"
import { clamp01, lerp } from "@/components/mountain/ScenarioMountain/helpers"

// ── KPI Annotation Defs ──
const KPI_ANNOTATION_DEFS = [
  { key: "revenue", label: "REVENUE", color: "#22d3ee" },
  { key: "margin", label: "MARGIN", color: "#34d399" },
  { key: "runway", label: "RUNWAY", color: "#60a5fa" },
  { key: "cash", label: "CASH", color: "#a78bfa" },
  { key: "burn", label: "BURN", color: "#fbbf24" },
  { key: "efficiency", label: "LTV/CAC", color: "#22d3ee" },
  { key: "risk", label: "RISK", color: "#f87171" },
]

// ════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS (R3F — must be inside Canvas)
// ════════════════════════════════════════════════════════════════════════════

function ConfidenceEnvelope({
  dataPoints,
  spread,
}: {
  dataPoints: number[]
  spread: number
}) {
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(MESH_W, MESH_D, Math.floor(GRID_W / 2), Math.floor(GRID_D / 2))
    const pos = geo.attributes.position
    const count = pos.count
    const wHalf = MESH_W / 2

    const dp = dataPoints?.length === 7 ? dataPoints : [0.5, 0.5, 0.6, 0.4, 0.5, 0.45, 0.35]
    const expanded = dp.map((v) => clamp01(v * (1 + spread * 0.8)))

    for (let i = 0; i < count; i++) {
      const x = pos.getX(i)
      const z = pos.getY(i)
      const kpiX = ((x + wHalf) / MESH_W) * 6

      let ridgeVal = 0
      for (let idx = 0; idx < 7; idx++) {
        const v = clamp01(expanded[idx])
        const g = gaussian1(kpiX, idx, 0.55)
        ridgeVal += Math.pow(v, RIDGE_SHARPNESS) * g
      }

      let h = ridgeVal * BASE_SCALE

      for (const m of MASSIF_PEAKS) {
        const g = gaussian2(x - m.x, z - m.z, m.sigmaX * 1.1, m.sigmaZ * 1.1)
        h += g * m.amplitude * MASSIF_SCALE
      }

      const dist = Math.sqrt(x * x + z * z * 1.4)
      const mask = Math.max(0, 1 - Math.pow(dist / ISLAND_RADIUS, 2.0))
      const cliff = Math.pow(mask, 0.45) * CLIFF_BOOST
      const n = noise2(x, z) * 0.2
      let finalH = Math.max(0, (h + n) * mask * cliff)
      finalH = applySoftCeiling(finalH)

      pos.setZ(i, finalH)
    }

    geo.computeVertexNormals()
    return geo
  }, [dataPoints, spread])

  return (
    <group rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.97, 0]} scale={[0.902, 0.902, 0.902]} renderOrder={50}>
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
  )
}

function StructuralAxes() {
  return (
    <group>
      {/* Vertical axis — left side */}
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
      {/* Horizontal axis — base */}
      <DreiLine
        points={[
          new THREE.Vector3(-24, -2.5, 0),
          new THREE.Vector3(24, -2.5, 0),
        ]}
        color="#334155"
        lineWidth={0.5}
        transparent
        opacity={0.2}
      />
      {/* Axis labels */}
      <Html position={[-25.5, 3, 0]} center style={{ pointerEvents: "none" }}>
        <div style={{
          fontSize: 7,
          fontWeight: 700,
          letterSpacing: "0.12em",
          color: "rgba(148,163,184,0.25)",
          fontFamily: "'Inter', sans-serif",
          textTransform: "uppercase",
          writingMode: "vertical-lr",
          transform: "rotate(180deg)",
          userSelect: "none",
        }}>
          Enterprise Value
        </div>
      </Html>
      <Html position={[0, -3.5, 0]} center style={{ pointerEvents: "none" }}>
        <div style={{
          fontSize: 7,
          fontWeight: 700,
          letterSpacing: "0.12em",
          color: "rgba(148,163,184,0.25)",
          fontFamily: "'Inter', sans-serif",
          textTransform: "uppercase",
          userSelect: "none",
        }}>
          Time Horizon →
        </div>
      </Html>
    </group>
  )
}

function BaselineRefLine({ height }: { height: number }) {
  return (
    <group>
      <mesh position={[0, height, 0]}>
        <planeGeometry args={[46, 0.015]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.12} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh position={[0, height, 0]}>
        <planeGeometry args={[46, 0.06]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.04} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <Html position={[24.5, height + 0.4, 0]} center style={{ pointerEvents: "none" }}>
        <div style={{
          fontSize: 8,
          fontWeight: 600,
          letterSpacing: "0.08em",
          color: "rgba(34, 211, 238, 0.3)",
          fontFamily: "'Inter', sans-serif",
          textTransform: "uppercase",
          whiteSpace: "nowrap",
          userSelect: "none",
        }}>
          Baseline
        </div>
      </Html>
    </group>
  )
}

function TerrainRidgeLine({ dataPoints }: { dataPoints: number[] }) {
  const points = useMemo(() => {
    const dp = dataPoints?.length === 7 ? dataPoints : [0.5, 0.5, 0.6, 0.4, 0.5, 0.45, 0.35]
    const wHalf = MESH_W / 2
    const ridgeZ = -1.5
    const pts: THREE.Vector3[] = []
    const numSamples = 120

    for (let i = 0; i <= numSamples; i++) {
      const t = i / numSamples
      const x = lerp(-wHalf, wHalf, t)
      const h = computeStaticTerrainHeight(x, ridgeZ, dp)
      pts.push(new THREE.Vector3(x, ridgeZ, h + 0.15))
    }
    return pts
  }, [dataPoints])

  if (!points.length) return null

  return (
    <group rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} scale={[0.9, 0.9, 0.9]}>
      <DreiLine points={points} color="#00E0FF" lineWidth={2.5} transparent opacity={0.08} />
      <DreiLine points={points} color="#00E0FF" lineWidth={1} transparent opacity={0.35} />
    </group>
  )
}

function TerrainSurfaceAnnotations({
  dataPoints,
  kpiValues,
}: {
  dataPoints: number[]
  kpiValues: Record<string, { value?: number; label?: string }>
}) {
  const annotations = useMemo(() => {
    const dp = dataPoints?.length === 7 ? dataPoints : [0.5, 0.5, 0.6, 0.4, 0.5, 0.45, 0.35]
    const wHalf = MESH_W / 2
    const ridgeZ = -1.5

    const runway = kpiValues?.runway?.value ?? 24
    const ltvCac = kpiValues?.ltvCac?.value ?? 3
    const riskIndex = kpiValues?.riskIndex?.value ?? 70

    return KPI_ANNOTATION_DEFS.map((def, idx) => {
      const x = lerp(-wHalf, wHalf, idx / 6)
      const h = computeStaticTerrainHeight(x, ridgeZ, dp)
      const value = dp[idx]

      let displayValue: string
      let description: string

      switch (def.key) {
        case "revenue":
          displayValue = `${Math.round(value * 100)}%`
          description = value > 0.6 ? "Strong growth drives upward slope" : "Revenue pressure flattens terrain"
          break
        case "margin":
          displayValue = `${Math.round(value * 100)}%`
          description = value > 0.55 ? "Healthy margins support elevation" : "Margin compression limits peak"
          break
        case "runway":
          displayValue = `${Math.round(runway)}mo`
          description = runway >= 18 ? "Capital buffer maintains ridge height" : "Short runway erodes formation"
          break
        case "cash":
          displayValue = `${Math.round(value * 100)}%`
          description = value > 0.5 ? "Cash reserves sustain mountain mass" : "Low reserves weaken structure"
          break
        case "burn":
          displayValue = `${Math.round(value * 100)}%`
          description = value > 0.5 ? "Disciplined burn maintains form" : "Excessive burn erodes base"
          break
        case "efficiency":
          displayValue = `${ltvCac.toFixed(1)}x`
          description = ltvCac >= 3 ? "Efficient acquisition builds height" : "High CAC suppresses elevation"
          break
        case "risk":
          displayValue = `${Math.round(riskIndex)}%`
          description = riskIndex > 50 ? "Low risk sharpens ridgeline" : "High risk softens peak"
          break
        default:
          displayValue = `${Math.round(value * 100)}%`
          description = ""
      }

      return { ...def, x, z: ridgeZ, h: h + 0.5, value, displayValue, description }
    })
  }, [dataPoints, kpiValues])

  if (!annotations.length) return null

  return (
    <group rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} scale={[0.9, 0.9, 0.9]}>
      {annotations.map((ann) => (
        <group key={ann.key} position={[ann.x, ann.z, ann.h]}>
          <mesh>
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshBasicMaterial color={ann.color} transparent opacity={0.6} depthWrite={false} />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.24, 16, 16]} />
            <meshBasicMaterial color={ann.color} transparent opacity={0.1} depthWrite={false} />
          </mesh>
          <DreiLine
            points={[new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -ann.h + 0.1)]}
            color={ann.color}
            lineWidth={0.3}
            transparent
            opacity={0.12}
          />
          <Html
            position={[0, 0, 1.4]}
            center
            style={{ pointerEvents: "none" }}
          >
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 1,
              userSelect: "none",
            }}>
              <div style={{
                fontSize: 7,
                fontWeight: 700,
                letterSpacing: "0.1em",
                color: ann.color,
                opacity: 0.6,
                fontFamily: "'Inter', sans-serif",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
              }}>
                {ann.label}
              </div>
              <div style={{
                fontSize: 9,
                fontWeight: 600,
                color: "rgba(226,240,255,0.7)",
                fontFamily: "'Inter', sans-serif",
                whiteSpace: "nowrap",
              }}>
                {ann.displayValue}
              </div>
              <div style={{
                fontSize: 6.5,
                fontWeight: 400,
                color: "rgba(148,163,184,0.4)",
                fontFamily: "'Inter', sans-serif",
                maxWidth: 90,
                textAlign: "center",
                lineHeight: 1.3,
              }}>
                {ann.description}
              </div>
            </div>
          </Html>
        </group>
      ))}
    </group>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT — GodModeLayers
// ════════════════════════════════════════════════════════════════════════════

export interface GodModeLayersProps {
  /** Scenario ID to look up engineResults for data-driven layers */
  scenarioId: string | null
}

/**
 * Injects god mode intelligence layers into a TerrainStage Canvas.
 * Reads engineResults from scenarioStore, derives dataPoints + kpiValues,
 * then renders ConfidenceEnvelope, StructuralAxes, BaselineRefLine,
 * TerrainRidgeLine, and TerrainSurfaceAnnotations.
 *
 * Usage: <TerrainStage ...><GodModeLayers scenarioId={id} /></TerrainStage>
 */
export default function GodModeLayers({ scenarioId }: GodModeLayersProps) {
  const engineResults = useScenarioStore(
    useShallow((s) => s.engineResults),
  )

  const engineResult = scenarioId
    ? (engineResults as Record<string, any>)?.[scenarioId] ?? null
    : null

  const kpiValues: Record<string, { value?: number; label?: string }> =
    engineResult?.kpis ?? {}

  const dataPoints = useMemo(
    () => engineResultToMountainForces(engineResult),
    [engineResult],
  )

  const envelopeSpread = useMemo(() => {
    const riskIdx = kpiValues?.riskIndex?.value ?? 50
    return clamp01(0.08 + (1 - riskIdx / 100) * 0.25)
  }, [kpiValues])

  // No engine data yet — render nothing
  if (!engineResult) return null

  return (
    <>
      <ConfidenceEnvelope dataPoints={dataPoints} spread={envelopeSpread} />
      <StructuralAxes />
      <BaselineRefLine height={-0.5} />
      <TerrainRidgeLine dataPoints={dataPoints} />
      <TerrainSurfaceAnnotations dataPoints={dataPoints} kpiValues={kpiValues} />
    </>
  )
}
