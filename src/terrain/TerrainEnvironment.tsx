import { useThree } from "@react-three/fiber"
import { useEffect } from "react"
import * as THREE from "three"

export default function TerrainEnvironment() {
  const { scene } = useThree()

  useEffect(() => {
    scene.fog = new THREE.FogExp2("#061018", 0.010)
    return () => {
      scene.fog = null
    }
  }, [scene])

  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight
        position={[50, 120, 40]}
        intensity={1.2}
        color={"#9be7ff"}
      />
      <directionalLight
        position={[-40, 60, -20]}
        intensity={0.55}
        color={"#1b6cff"}
      />
    </>
  )
}
