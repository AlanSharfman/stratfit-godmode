import { useMemo } from "react"
import { Tube } from "@react-three/drei"
import { generateP50Spline } from "./generateP50Spline"
import { useTerrainHeight } from "@/terrain/useTerrainHeight"

export default function P50Path() {
  const heightFn = useTerrainHeight()

  const curve = useMemo(() => {
    return generateP50Spline(heightFn)
  }, [heightFn])

  return (
    <Tube args={[curve, 220, 0.18, 10, false]}>
      <meshStandardMaterial
        color="#00E0FF"
        emissive="#00E0FF"
        emissiveIntensity={0.6}
        metalness={0.2}
        roughness={0.35}
      />
    </Tube>
  )
}
