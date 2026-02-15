import { useRef, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useWeatherStore } from "@/state/weatherStore";

type Props = {
  radius?: number;
  height?: number;
};

/**
 * RiskWeatherSystem renders atmospheric effects based on business risk levels.
 *
 * Weather conditions map to risk states:
 * - Clear: Low risk, good visibility, stable conditions
 * - Cloudy: Moderate risk, some uncertainty
 * - Stormy: Elevated risk, high volatility
 * - Turbulent: High risk, chaotic conditions
 * - Critical: Extreme risk, emergency state
 *
 * Visual effects:
 * - Fog density reflects visibility/uncertainty
 * - Particle intensity shows volatility
 * - Color temperature indicates overall health
 */
export default function RiskWeatherSystem({ radius = 25, height = 15 }: Props) {
  const { weather, enabled } = useWeatherStore();
  const particlesRef = useRef<THREE.Points>(null);
  const fogRef = useRef<THREE.Mesh>(null);

  // Weather-based colors
  const colors = useMemo(() => {
    const map: Record<string, { primary: string; secondary: string; fog: string }> = {
      clear: { primary: "#67E8F9", secondary: "#22D3EE", fog: "#0A1929" },
      cloudy: { primary: "#94A3B8", secondary: "#64748B", fog: "#1E293B" },
      stormy: { primary: "#F59E0B", secondary: "#D97706", fog: "#292524" },
      turbulent: { primary: "#EF4444", secondary: "#DC2626", fog: "#1C1917" },
      critical: { primary: "#DC2626", secondary: "#991B1B", fog: "#0C0A09" },
    };
    return map[weather.condition] || map.clear;
  }, [weather.condition]);

  // Particle geometry
  const particles = useMemo(() => {
    const count = 800;
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const r = Math.random() * radius;
      const y = Math.random() * height - 2;

      positions[i * 3] = Math.cos(theta) * r;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = Math.sin(theta) * r;

      velocities[i * 3] = (Math.random() - 0.5) * 0.02;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.01;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02;

      sizes[i] = Math.random() * 0.08 + 0.02;
    }

    return { positions, velocities, sizes };
  }, [radius, height]);

  // Animate particles based on weather
  useFrame((_, delta) => {
    if (!particlesRef.current || !enabled) return;

    const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
    const { velocities } = particles;
    const windFactor = weather.windSpeed * weather.intensity;
    const turbulenceFactor = weather.turbulence;

    for (let i = 0; i < positions.length / 3; i++) {
      // Apply wind
      positions[i * 3] += (velocities[i * 3] + weather.windDirection[0] * windFactor) * delta * 10;
      positions[i * 3 + 1] += (velocities[i * 3 + 1] + weather.windDirection[1] * windFactor) * delta * 10;
      positions[i * 3 + 2] += (velocities[i * 3 + 2] + weather.windDirection[2] * windFactor) * delta * 10;

      // Add turbulence
      if (turbulenceFactor > 0.2) {
        positions[i * 3] += (Math.random() - 0.5) * turbulenceFactor * 0.1;
        positions[i * 3 + 1] += (Math.random() - 0.5) * turbulenceFactor * 0.05;
        positions[i * 3 + 2] += (Math.random() - 0.5) * turbulenceFactor * 0.1;
      }

      // Wrap around bounds
      const x = positions[i * 3];
      const y = positions[i * 3 + 1];
      const z = positions[i * 3 + 2];

      if (Math.sqrt(x * x + z * z) > radius) {
        const angle = Math.random() * Math.PI * 2;
        positions[i * 3] = Math.cos(angle) * radius * 0.5;
        positions[i * 3 + 2] = Math.sin(angle) * radius * 0.5;
      }

      if (y > height || y < -2) {
        positions[i * 3 + 1] = Math.random() * height - 2;
      }
    }

    particlesRef.current.geometry.attributes.position.needsUpdate = true;

    // Animate fog opacity
    if (fogRef.current) {
      const mat = fogRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = (1 - weather.visibility) * 0.4 * weather.intensity;
    }
  });

  if (!enabled) return null;

  return (
    <group name="risk-weather-system">
      {/* Atmospheric particles */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[particles.positions, 3]}
            count={particles.positions.length / 3}
          />
          <bufferAttribute
            attach="attributes-size"
            args={[particles.sizes, 1]}
            count={particles.sizes.length}
          />
        </bufferGeometry>
        <pointsMaterial
          color={colors.primary}
          size={0.08 * (1 + weather.intensity * 0.5)}
          transparent
          opacity={0.4 * weather.intensity}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Fog dome */}
      <mesh ref={fogRef} position={[0, height / 2 - 2, 0]}>
        <sphereGeometry args={[radius, 32, 32]} />
        <meshBasicMaterial
          color={colors.fog}
          transparent
          opacity={(1 - weather.visibility) * 0.3}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* Condition-specific overlays */}
      {weather.condition === "stormy" && (
        <mesh position={[0, height * 0.7, 0]}>
          <planeGeometry args={[radius * 2, radius * 2]} />
          <meshBasicMaterial
            color="#F59E0B"
            transparent
            opacity={0.05 + Math.sin(Date.now() * 0.002) * 0.02}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      )}

      {weather.condition === "critical" && (
        <>
          {/* Red alert overlay */}
          <mesh position={[0, height / 2, 0]}>
            <sphereGeometry args={[radius * 0.9, 32, 32]} />
            <meshBasicMaterial
              color="#DC2626"
              transparent
              opacity={0.08}
              side={THREE.BackSide}
              depthWrite={false}
            />
          </mesh>
        </>
      )}
    </group>
  );
}
