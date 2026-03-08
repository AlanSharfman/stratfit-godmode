import React, { useMemo } from "react"
import * as THREE from "three"
import { extend } from "@react-three/fiber"
import type { ProgressiveTerrainHandle } from "./ProgressiveTerrainSurface"
import { TERRAIN_CONSTANTS } from "./terrainConstants"

extend({ Line_: THREE.Line })

interface Props {
  terrainRef: React.RefObject<ProgressiveTerrainHandle>
}

const SAMPLE_RES = 40
const RIDGE_THRESHOLD = 0.6
const BASIN_THRESHOLD = -0.3
const FLOW_STEP = 8

export default function TerrainIntelligence({ terrainRef }: Props) {
  const { ridgePoints, basinPoints, flowLines } = useMemo(() => {
    const handle = terrainRef.current
    if (!handle) return { ridgePoints: [] as THREE.Vector3[], basinPoints: [] as THREE.Vector3[], flowLines: [] as THREE.Vector3[][] }

    const w = TERRAIN_CONSTANTS.width * 3.0
    const d = TERRAIN_CONSTANTS.depth * 2.8
    const ridges: THREE.Vector3[] = []
    const basins: THREE.Vector3[] = []
    const flows: THREE.Vector3[][] = []

    const grid: number[][] = []
    for (let r = 0; r <= SAMPLE_RES; r++) {
      grid[r] = []
      for (let c = 0; c <= SAMPLE_RES; c++) {
        const wx = (c / SAMPLE_RES - 0.5) * w
        const wz = (r / SAMPLE_RES - 0.5) * d
        grid[r][c] = handle.getHeightAt(wx, wz)
      }
    }

    for (let r = 1; r < SAMPLE_RES; r++) {
      for (let c = 1; c < SAMPLE_RES; c++) {
        const h = grid[r][c]
        const laplacian = (
          grid[r - 1][c] + grid[r + 1][c] +
          grid[r][c - 1] + grid[r][c + 1]
        ) / 4 - h

        if (laplacian < -RIDGE_THRESHOLD) {
          const wx = (c / SAMPLE_RES - 0.5) * w
          const wz = (r / SAMPLE_RES - 0.5) * d
          ridges.push(new THREE.Vector3(wx, h + 1, wz))
        }
        if (laplacian > RIDGE_THRESHOLD && h < grid[r - 1][c] && h < grid[r + 1][c]) {
          const wx = (c / SAMPLE_RES - 0.5) * w
          const wz = (r / SAMPLE_RES - 0.5) * d
          basins.push(new THREE.Vector3(wx, h + 0.5, wz))
        }
      }
    }

    for (let r = 2; r < SAMPLE_RES - 2; r += FLOW_STEP) {
      for (let c = 2; c < SAMPLE_RES - 2; c += FLOW_STEP) {
        const line: THREE.Vector3[] = []
        let cr = r, cc = c
        for (let step = 0; step < 12; step++) {
          if (cr < 1 || cr >= SAMPLE_RES || cc < 1 || cc >= SAMPLE_RES) break
          const wx = (cc / SAMPLE_RES - 0.5) * w
          const wz = (cr / SAMPLE_RES - 0.5) * d
          line.push(new THREE.Vector3(wx, grid[Math.round(cr)][Math.round(cc)] + 0.8, wz))
          const gx = (grid[Math.round(cr)][Math.min(SAMPLE_RES, Math.round(cc) + 1)] -
                       grid[Math.round(cr)][Math.max(0, Math.round(cc) - 1)]) * 0.5
          const gz = (grid[Math.min(SAMPLE_RES, Math.round(cr) + 1)][Math.round(cc)] -
                       grid[Math.max(0, Math.round(cr) - 1)][Math.round(cc)]) * 0.5
          const len = Math.sqrt(gx * gx + gz * gz) + 0.001
          cc -= (gx / len) * 1.2
          cr -= (gz / len) * 1.2
        }
        if (line.length >= 3) flows.push(line)
      }
    }

    return { ridgePoints: ridges, basinPoints: basins, flowLines: flows }
  }, [terrainRef.current?.seed])

  return (
    <group name="terrain-intelligence">
      {ridgePoints.length > 1 && <RidgeLines points={ridgePoints} />}
      {basinPoints.length > 0 && <BasinMarkers points={basinPoints} />}
      {flowLines.map((line, i) => (
        <FlowLine key={i} points={line} />
      ))}
    </group>
  )
}

function RidgeLines({ points }: { points: THREE.Vector3[] }) {
  const sorted = useMemo(() => {
    const clusters: THREE.Vector3[][] = []
    const used = new Set<number>()
    for (let i = 0; i < points.length; i++) {
      if (used.has(i)) continue
      const cluster = [points[i]]
      used.add(i)
      for (let j = i + 1; j < points.length; j++) {
        if (used.has(j)) continue
        if (cluster[cluster.length - 1].distanceTo(points[j]) < 80) {
          cluster.push(points[j])
          used.add(j)
        }
      }
      if (cluster.length >= 2) clusters.push(cluster)
    }
    return clusters
  }, [points])

  return (
    <group name="ridge-lines">
      {sorted.map((cluster, ci) => {
        const geo = new THREE.BufferGeometry().setFromPoints(cluster)
        const mat = new THREE.LineBasicMaterial({ color: "#22d3ee", transparent: true, opacity: 0.18, depthWrite: false })
        const lineObj = new THREE.Line(geo, mat)
        lineObj.renderOrder = 10
        return <primitive key={ci} object={lineObj} />
      })}
    </group>
  )
}

function BasinMarkers({ points }: { points: THREE.Vector3[] }) {
  return (
    <group name="basin-markers">
      {points.map((p, i) => (
        <mesh key={i} position={p} renderOrder={11}>
          <ringGeometry args={[2, 3.5, 24]} />
          <meshBasicMaterial color="#60a5fa" transparent opacity={0.12} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  )
}

function FlowLine({ points }: { points: THREE.Vector3[] }) {
  const lineObj = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(points)
    const linePoints = curve.getPoints(points.length * 4)
    const geo = new THREE.BufferGeometry().setFromPoints(linePoints)
    const mat = new THREE.LineBasicMaterial({ color: "#34d399", transparent: true, opacity: 0.1, depthWrite: false })
    const obj = new THREE.Line(geo, mat)
    obj.renderOrder = 9
    return obj
  }, [points])

  return <primitive object={lineObj} />
}
