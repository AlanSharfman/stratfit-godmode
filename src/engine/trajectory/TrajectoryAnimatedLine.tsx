import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useTrajectoryStore } from "@/state/trajectoryStore";

// Three.js fat-line implementation for premium rendering
import { Line2 } from "three/examples/jsm/lines/Line2.js";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";

/**
 * Converts Vector3 array to flat positions array for LineGeometry.
 */
function toPositions(points: THREE.Vector3[]): number[] {
  const arr: number[] = [];
  for (const p of points) {
    arr.push(p.x, p.y, p.z);
  }
  return arr;
}

type Props = {
  sampledPoints: THREE.Vector3[]; // already terrain-projected + offset
};

/**
 * TrajectoryAnimatedLine renders a premium animated path with:
 * - Directional pulse animation (slow drift)
 * - Intermittent black + electric blue segments
 * - Shader-based dashed line with time-based dash offset
 *
 * Visual rules:
 * - Cyan core with subtle bloom feel
 * - Depth fade via transparent material
 * - No neon gaming aesthetic - institutional quality
 */
export default function TrajectoryAnimatedLine({ sampledPoints }: Props) {
  const { hoveredInsightId, selectedInsightId } = useTrajectoryStore();
  const groupRef = useRef<THREE.Group>(null);

  const { line, material } = useMemo(() => {
    if (sampledPoints.length < 2) {
      return { line: null, material: null };
    }

    const geometry = new LineGeometry();
    geometry.setPositions(toPositions(sampledPoints));

    const mat = new LineMaterial({
      color: 0x00e5ff,
      linewidth: 0.0045, // world units; tuned for scene scale
      dashed: true,
      dashScale: 1,
      dashSize: 1.0,
      gapSize: 0.9,
      transparent: true,
      opacity: 0.95,
    });

    // Premium: subtle additive glow feel via toneMapping off
    mat.toneMapped = false;

    const l = new Line2(geometry, mat);
    l.computeLineDistances();
    l.frustumCulled = false;

    return { line: l, material: mat };
  }, [sampledPoints]);

  // Attach line into the scene
  useEffect(() => {
    if (!groupRef.current || !line) return;

    groupRef.current.add(line);

    return () => {
      if (groupRef.current && line) {
        groupRef.current.remove(line);
      }
      if (line) {
        line.geometry.dispose();
        if (line.material instanceof THREE.Material) {
          line.material.dispose();
        }
      }
    };
  }, [line]);

  // Animate dash offset for directional pulse
  useFrame(({ clock, size }) => {
    if (!material) return;

    // Keep resolution correct for LineMaterial
    material.resolution.set(size.width, size.height);

    const t = clock.getElapsedTime();

    // Directional drift (slow, premium feel)
    material.dashOffset = -t * 0.35;

    // Intermittent black/blue feel: modulate opacity + color slightly
    // When user focuses (hover/selected), intensify subtly
    const focused = Boolean(hoveredInsightId || selectedInsightId);
    material.opacity = focused ? 1.0 : 0.88;

    // Very subtle color breathing (no neon gaming)
    // Shift toward deeper cyan occasionally
    const breath = 0.5 + 0.5 * Math.sin(t * 0.6);
    const base = new THREE.Color(0x00e5ff);
    const deep = new THREE.Color(0x0a0f14); // near-black graphite
    // Mix only slightly so it reads as intermittent dark segments
    base.lerp(deep, 0.08 + 0.04 * breath);
    material.color.copy(base);
  });

  if (!line) return null;

  return <group ref={groupRef} />;
}
