export default function HorizonBand() {
  return (
    <mesh position={[0, 40, -150]}>
      <planeGeometry args={[600, 220]} />
      <meshBasicMaterial
        color="#020617"
        transparent
        opacity={0.9}
      />
    </mesh>
  );
}
