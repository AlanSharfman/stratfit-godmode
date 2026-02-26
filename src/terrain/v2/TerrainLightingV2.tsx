export default function TerrainLightingV2() {
  return (
    <>
      <hemisphereLight intensity={0.45} />

      <directionalLight
        position={[120, 200, 80]}
        intensity={1.2}
        castShadow
      />
    </>
  )
}
