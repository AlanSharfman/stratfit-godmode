import React, { useMemo } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

/**
 * VolumetricHorizon
 * - Adds a thin "atmospheric veil" near the horizon.
 * - Does not touch scene.fog
 * - Cheap: 1 plane, transparent, depthWrite off
 * - Sits behind terrain (slightly) and blends with sky
 */
export default function VolumetricHorizon() {
  const { camera } = useThree();

  const mat = useMemo(() => {
    const m = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#8fe7ff"),
      transparent: true,
      opacity: 0.085,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending,
    });
    return m;
  }, []);

  /**
   * Placement (tuned for TerrainStage camera):
   * camera pos ~ [0,155,460], lookAt ~ [0,18,0]
   *
   * We place a large plane around Y~22 and Z~-520 (near horizon band),
   * slightly tilted to face camera.
   */
  return (
    <group name="sf-volumetric-horizon" renderOrder={5}>
      <mesh
        position={[0, 26, -520]}
        rotation={[-0.12, 0, 0]}
        material={mat}
        frustumCulled={false}
      >
        <planeGeometry args={[2400, 900, 1, 1]} />
      </mesh>

      {/* Secondary softer layer for gradient depth */}
      <mesh
        position={[0, 44, -720]}
        rotation={[-0.10, 0, 0]}
        material={mat}
        frustumCulled={false}
      >
        <planeGeometry args={[3200, 1400, 1, 1]} />
      </mesh>
    </group>
  );
}
