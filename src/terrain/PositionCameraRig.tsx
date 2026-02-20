import { useThree } from "@react-three/fiber"
import { useEffect } from "react"
import * as THREE from "three"

export default function PositionCameraRig() {
  const { camera } = useThree()

  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera | THREE.OrthographicCamera

    // Balanced perspective — avoids distortion
    if ((cam as any).isPerspectiveCamera) {
      ;(cam as THREE.PerspectiveCamera).fov = 42
    }

    /**
     * Cinematic elevated vantage point
     * Gives terrain curvature + horizon depth
     */
    cam.position.set(32, 20, 34)

    /**
     * Look slightly forward in the terrain
     * Not dead center — creates journey feel
     */
    cam.lookAt(4, 3, -2)

    cam.near = 0.1
    cam.far = 1200

    cam.updateProjectionMatrix()
  }, [camera])

  return null
}
