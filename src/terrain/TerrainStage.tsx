import React, { Suspense } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"
import SceneStack from "./SceneStack"

export default function TerrainStage() {
  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <Canvas
        camera={{ position: [0, 35, 65], fov: 45 }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[40, 60, 40]} intensity={1} />

        <Suspense fallback={null}>
          <SceneStack />
        </Suspense>

        <OrbitControls enablePan={false} maxPolarAngle={Math.PI / 2.1} />
      </Canvas>
    </div>
  )
}
