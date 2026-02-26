import { useState, useCallback } from "react"
import { Canvas } from "@react-three/fiber"
import * as THREE from "three"
import TerrainSurfaceV2 from "./TerrainSurfaceV2"
import { DEFAULT_TUNING } from "./TerrainSurfaceV2"
import type { TerrainTuningParams } from "./TerrainSurfaceV2"
import TerrainLightingV2 from "./TerrainLightingV2"
import TerrainCameraRigV2 from "./TerrainCameraRigV2"
import TerrainTuningPanel from "./TerrainTuningPanel"

type Props = {
  granularity: string | number
  terrainMetrics: any
  signals: any
  lockCamera?: boolean
}

export default function TerrainStageV2({
  granularity,
}: Props) {
  const [tuning, setTuning] = useState<TerrainTuningParams>({
    ...DEFAULT_TUNING,
  })
  const handleTuningChange = useCallback(
    (p: TerrainTuningParams) => setTuning(p),
    [],
  )

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        onCreated={({ scene }) => {
          scene.background = new THREE.Color("#05070d")
          scene.fog = new THREE.Fog("#05070d", 200, 900)
        }}
        camera={{ fov: 36 }}
        style={{ width: "100%", height: "100%" }}
      >
        <TerrainCameraRigV2 />
        <TerrainLightingV2 />
        <TerrainSurfaceV2 granularity={granularity} tuning={tuning} />
      </Canvas>

      {/* Visual tuning panel — HTML overlay, local state only */}
      <TerrainTuningPanel params={tuning} onChange={handleTuningChange} />
    </div>
  )
}
