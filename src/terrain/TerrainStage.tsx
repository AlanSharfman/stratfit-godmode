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
    // HERO START SHOT — wide + readable
    const cam = camera as THREE.PerspectiveCamera
    cam.near = 0.1
    cam.far = 4000
    cam.fov = 42

    // MODE B DEMO FRAMING — trajectory-first, slight 3/4 angle
    cam.position.set(-38, 42, 118)
    cam.lookAt(6, 7, 0)
    cam.updateProjectionMatrix()

    if (controlsRef.current) {
      controlsRef.current.target.set(6, 7, 0)
      controlsRef.current.update()
    }
  }, [camera])

  return (
    <OrbitControls
      ref={(r) => {
        controlsRef.current = r
      }}
      target={[6, 7, 0]}
      enablePan={false}
      enableDamping={true}
      dampingFactor={0.08}
      minDistance={70}   // prevents "macro" starts
      maxDistance={420}  // prevents losing the scene
      minPolarAngle={0.55}
      maxPolarAngle={1.25}
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
        <ambientLight intensity={0.6} />
        <directionalLight position={[50, 120, 60]} intensity={1} />

        <Suspense fallback={null}>
          <SceneStack />
          {children}
        </Suspense>

        <CameraRig />
      </Canvas>
    </div>
  )
}
