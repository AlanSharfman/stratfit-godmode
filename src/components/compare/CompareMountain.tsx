// src/components/compare/CompareMountain.tsx
// STRATFIT — BLACK CANVAS (CLEAN SLATE)

interface Props {
  position: [number, number, number]
  scenarioModifier?: number
  timeline?: number
  rimColor?: string
  debug?: boolean
}

export default function CompareMountain({
  position,
}: Props) {
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[160, 160]} />
      <meshBasicMaterial color="#000000" />
    </mesh>
  )
}
