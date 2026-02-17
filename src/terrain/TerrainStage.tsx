import React, { Suspense } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"
import SceneStack from "./SceneStack"

export default function TerrainStage({ children }: { children?: React.ReactNode }) {
  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <Canvas
        camera={{
          position: [0, 18, 38], // normalized framing
          fov: 45,
          near: 0.1,
          far: 1000,
        }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.6} />
        <directionalLight position={[20, 40, 20]} intensity={1} />

        <Suspense fallback={null}>
          <SceneStack />
          {children}
        </Suspense>

        <OrbitControls
          target={[0, 2, 0]}
          minDistance={12}
          maxDistance={80}
          maxPolarAngle={Math.PI / 2.1}
          enablePan={false}
        />
      </Canvas>
    </div>
  )
}
