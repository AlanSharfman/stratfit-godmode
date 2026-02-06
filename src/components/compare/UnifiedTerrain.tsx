// src/components/compare/UnifiedTerrain.tsx
// STRATFIT — BLACK CANVAS (CLEAN SLATE)

interface Props {
  position?: [number, number, number]
  baselineHealth?: number
  explorationHealth?: number
  timeline?: number
}

export default function UnifiedTerrain({
  position = [0, 0, 0],
}: Props) {
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[280, 200]} />
      <meshBasicMaterial color="#000000" />
    </mesh>
  )
}
