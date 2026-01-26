import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import { useMemo, useState } from 'react'
import CompareMountain from './CompareMountain'
import DivergenceField from './DivergenceField'
import { generateTerrainHeight } from '@/terrain/terrainGenerator'

export default function CompareScene() {

  const [timeline, setTimeline] = useState(0)

  const baselineModifier = 0
  const explorationModifier = 2

  // Match CompareMountain geometry: 220x220 with 150 segments (151 vertices per axis)
  const resolution = 150
  const size = 220
  const steps = 37

  const terrainData = useMemo(() => {

    const data: {
      baseline: number[][]
      exploration: number[][]
    } = {
      baseline: [],
      exploration: []
    }

    const stepSize = size / resolution

    for (let t = 0; t < steps; t++) {

      const baselineHeights: number[] = []
      const explorationHeights: number[] = []

      for (let i = 0; i <= resolution; i++) {
        for (let j = 0; j <= resolution; j++) {

          const x = (j * stepSize) - size / 2
          const z = (i * stepSize) - size / 2

          baselineHeights.push(
            generateTerrainHeight({
              x,
              z,
              time: t,
              modifier: baselineModifier
            })
          )

          explorationHeights.push(
            generateTerrainHeight({
              x,
              z,
              time: t,
              modifier: explorationModifier
            })
          )
        }
      }

      data.baseline.push(baselineHeights)
      data.exploration.push(explorationHeights)
    }

    return data

  }, [])

  const t0 = Math.floor(timeline)
  const t1 = Math.min(t0 + 1, steps - 1)
  const lerpFactor = timeline - t0

  const interpolate = (a: number[], b: number[]) =>
    a.map((val, i) => val + (b[i] - val) * lerpFactor)

  const baselineHeights =
    interpolate(terrainData.baseline[t0], terrainData.baseline[t1])

  const explorationHeights =
    interpolate(terrainData.exploration[t0], terrainData.exploration[t1])

  return (
    <>
      <Canvas
        camera={{ position: [0, 120, 280], fov: 55 }}
        gl={{ toneMapping: THREE.ACESFilmicToneMapping }}
        style={{ height: '100%', width: '100%' }}
      >

        <ambientLight intensity={0.25} />
        <directionalLight position={[40, 80, 40]} intensity={1.1} />
        <directionalLight position={[-40, 20, -20]} intensity={0.3} />

        <CompareMountain
          position={[-80, 0, 0]}
          heights={baselineHeights}
          scenarioModifier={baselineModifier}
          timeline={timeline}
        />

        <CompareMountain
          position={[80, 0, 0]}
          heights={explorationHeights}
          scenarioModifier={explorationModifier}
          timeline={timeline}
        />

        <DivergenceField
          baselineHeights={baselineHeights}
          explorationHeights={explorationHeights}
        />

      </Canvas>

      {/* Temporary slider for testing */}
      <div style={{
        position: 'absolute',
        bottom: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '400px'
      }}>
        <input
          type="range"
          min="0"
          max="36"
          step="0.1"
          value={timeline}
          onChange={(e) => setTimeline(parseFloat(e.target.value))}
          style={{ width: '100%' }}
        />
      </div>
    </>
  )
}
