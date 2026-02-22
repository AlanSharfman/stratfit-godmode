export default function HorizonBand() {
  return (
    <mesh position={[0, 40, -150]}>
      <planeGeometry args={[600, 220]} />
      <meshBasicMaterial
        color="#0C1E35"
        transparent
        opacity={0.75}
      />
    </mesh>
  );
}
