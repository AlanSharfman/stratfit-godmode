import { useThree, useFrame } from "@react-three/fiber"
import { useEffect } from "react"
import * as THREE from "three"

export default function TerrainCameraRigV2() {
  const { camera, pointer } = useThree()

  useEffect(() => {
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = 36
      camera.updateProjectionMatrix()
    }
    camera.position.set(0, 32, 78)
    camera.lookAt(0, 10, 0)
  }, [camera])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()

    const px = (pointer.x || 0) * 1.8
    const py = (pointer.y || 0) * 1.0

    camera.position.x = Math.sin(t * 0.18) * 0.22 + px
    camera.position.y = 32 + Math.sin(t * 0.12) * 0.12 + py * 0.35
    camera.position.z = 78 + Math.cos(t * 0.15) * 0.18

    camera.lookAt(px * 0.35, 10 + py * 0.25, 0)
  })

  return null
}
