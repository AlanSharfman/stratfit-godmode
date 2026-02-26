export default function TerrainLightingV2() {
  return (
    <>
      <ambientLight intensity={0.18} />

      <directionalLight
        position={[60, 80, 40]}
        intensity={1.35}
        color="#7FD6FF"
        castShadow
      />

      <directionalLight
        position={[-40, 35, 10]}
        intensity={0.55}
        color="#2b4a66"
      />

      <directionalLight
        position={[-70, 18, -40]}
        intensity={0.65}
        color="#F59E0B"
      />
    </>
  )
}
