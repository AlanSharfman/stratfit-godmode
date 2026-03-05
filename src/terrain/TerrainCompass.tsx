import React, { useMemo } from "react"
import * as THREE from "three"
import { TERRAIN_CONSTANTS } from "./terrainConstants"

const RING_RADIUS = TERRAIN_CONSTANTS.width * 1.62
const RING_Y = -5.5
const LABEL_OFFSET = 18
const RING_SEGMENTS = 128

interface CompassLabel { text: string; angle: number; color: string }

const LABELS: CompassLabel[] = [
  { text: "N — Growth",     angle: 0,         color: "#f87171" },
  { text: "E — Revenue",    angle: Math.PI / 2, color: "#60a5fa" },
  { text: "S — Liquidity",  angle: Math.PI,     color: "#34d399" },
  { text: "W — Enterprise", angle: 3 * Math.PI / 2, color: "#fbbf24" },
]

export default function TerrainCompass() {
  const ringGeo = useMemo(() => {
    const geo = new THREE.RingGeometry(RING_RADIUS - 1.5, RING_RADIUS + 1.5, RING_SEGMENTS)
    return geo
  }, [])

  const tickGeos = useMemo(() => {
    const ticks: { pos: [number, number, number]; rot: number }[] = []
    for (let i = 0; i < 36; i++) {
      const angle = (i / 36) * Math.PI * 2
      const x = Math.sin(angle) * RING_RADIUS
      const z = Math.cos(angle) * RING_RADIUS
      ticks.push({ pos: [x, RING_Y + 0.1, z], rot: -angle })
    }
    return ticks
  }, [])

  return (
    <group name="terrain-compass" rotation={[-Math.PI / 2, 0, 0]} position={[0, RING_Y, 0]}>
      <mesh geometry={ringGeo} renderOrder={2}>
        <meshBasicMaterial
          color="#22d3ee"
          transparent
          opacity={0.08}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      {tickGeos.map((t, i) => (
        <mesh key={i} position={t.pos} rotation={[0, 0, t.rot]}>
          <planeGeometry args={[0.8, i % 9 === 0 ? 6 : 3]} />
          <meshBasicMaterial
            color={i % 9 === 0 ? "#22d3ee" : "#1a4060"}
            transparent
            opacity={i % 9 === 0 ? 0.25 : 0.12}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
      {LABELS.map((l) => {
        const x = Math.sin(l.angle) * (RING_RADIUS + LABEL_OFFSET)
        const z = Math.cos(l.angle) * (RING_RADIUS + LABEL_OFFSET)
        return (
          <CompassLabel
            key={l.text}
            text={l.text}
            position={[x, 0.2, z]}
            color={l.color}
          />
        )
      })}
    </group>
  )
}

function CompassLabel({ text, position, color }: { text: string; position: [number, number, number]; color: string }) {
  const canvas = useMemo(() => {
    const c = document.createElement("canvas")
    c.width = 256
    c.height = 48
    const ctx = c.getContext("2d")!
    ctx.clearRect(0, 0, 256, 48)
    ctx.font = "bold 22px Inter, system-ui, sans-serif"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillStyle = color
    ctx.globalAlpha = 0.55
    ctx.fillText(text, 128, 24)
    return c
  }, [text, color])

  const tex = useMemo(() => {
    const t = new THREE.CanvasTexture(canvas)
    t.needsUpdate = true
    return t
  }, [canvas])

  return (
    <mesh position={position} rotation={[Math.PI / 2, 0, 0]} renderOrder={3}>
      <planeGeometry args={[40, 8]} />
      <meshBasicMaterial
        map={tex}
        transparent
        opacity={0.7}
        depthWrite={false}
        depthTest={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}
