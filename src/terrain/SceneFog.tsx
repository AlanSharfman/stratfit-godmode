import { useEffect } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";

type Props = {
  /** Fog color should match/approx your sky/backdrop to avoid darkening */
  color?: string;
  near?: number;
  far?: number;
};

export default function SceneFog({
  color = "#070b10",
  near = 120,
  far = 520,
}: Props) {
  const { scene } = useThree();

  useEffect(() => {
    const prevFog = scene.fog;

    // Linear fog: predictable, and easiest to keep "non-darkening"
    scene.fog = new THREE.Fog(new THREE.Color(color), near, far);

    return () => {
      scene.fog = prevFog ?? null;
    };
  }, [scene, color, near, far]);

  return null;
}
