import React, { Suspense, useEffect, useRef } from "react"
import { Canvas, useThree } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib"
import * as THREE from "three"
import SceneStack from "./SceneStack"

function CameraRig() {
  const { camera } = useThree()
  const controlsRef = useRef<OrbitControlsImpl | null>(null)

  useEffect(() => {
    // Deterministic camera start pose (prevents "inside mountain")
    const cam = camera as THREE.PerspectiveCamera
    cam.near = 0.1
    cam.far = 2000
    cam.fov = 45
    cam.position.set(0, 18, 55)
    cam.lookAt(0, 2, 0)
    cam.updateProjectionMatrix()

    // Reset OrbitControls target + sync
    if (controlsRef.current) {
      controlsRef.current.target.set(0, 2, 0)
      controlsRef.current.update()
    }
  }, [camera])

  return (
    <OrbitControls
      ref={(r) => {
        controlsRef.current = r
      }}
      target={[0, 2, 0]}
      enablePan={false}
      enableDamping={true}
      dampingFactor={0.08}
      minDistance={18}
      maxDistance={120}
      maxPolarAngle={Math.PI / 2.05}
    />
  )
}

export default function TerrainStage({
  children,
}: {
  children?: React.ReactNode
}) {
  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <Canvas>
        {/* Lighting (safe baseline) */}
        <ambientLight intensity={0.6} />
        <directionalLight position={[20, 40, 20]} intensity={1} />

        <Suspense fallback={null}>
          <SceneStack />
          {children}
        </Suspense>

        {/* Camera/controls locked */}
        <CameraRig />
      </Canvas>
    </div>
  )
}
