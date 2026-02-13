import * as THREE from "three";
import React, { useMemo } from "react";
import { OrbitControls } from "@react-three/drei";
import ClinicalSkyDome from "./ClinicalSkyDome";
import ShadowCatcherFloor from "./ShadowCatcherFloor";
import TerrainSurface from "./TerrainSurface";

type Props = {
  terrainGeometry: THREE.BufferGeometry;
  stress?: Float32Array;
  delta?: Float32Array;
  showStrategicOverlay?: boolean;
};

export default function TerrainStage({
  terrainGeometry,
  stress,
  delta,
  showStrategicOverlay = false,
}: Props) {
  const grid = useMemo(() => {
    // light, precise base grid (not glowing)
    const size = 30;
    const divisions = 18;
    const g = new THREE.GridHelper(size, divisions, 0x173a45, 0x173a45);
    (g.material as THREE.Material).transparent = true;
    (g.material as THREE.Material).opacity = 0.22 as any;
    g.position.y = -2.2;
    return g;
  }, []);

  const horizonMaterial = useMemo(() => {
    const m = new THREE.LineBasicMaterial({
      color: new THREE.Color("#39C6D9"),
      transparent: true,
      opacity: 0.65,
    });
    return m;
  }, []);

  const horizonLine = useMemo(() => {
    // "Zero-cash threshold" line across the stage (clinical, not theatrical)
    const pts = [
      new THREE.Vector3(-15, -2.2, 0),
      new THREE.Vector3(15, -2.2, 0),
    ];
    const geom = new THREE.BufferGeometry().setFromPoints(pts);
    const line = new THREE.Line(geom, horizonMaterial);
    line.position.z = -4.0;
    return line;
  }, [horizonMaterial]);

  return (
    <>
      <ClinicalSkyDome />
      <ShadowCatcherFloor />

      {/* Lights: calm/clinical — key light casts shadow */}
      <directionalLight
        position={[-8, 12, 10]}
        intensity={0.95}
        color={"#EAF6FF"}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={2}
        shadow-camera-far={40}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
      />
      <hemisphereLight intensity={0.22} groundColor={"#071118"} color={"#0C1F28"} />
      <directionalLight position={[10, 4, -8]} intensity={0.18} color={"#6CE7F2"} />

      {/* Anchoring */}
      <primitive object={grid} />
      <primitive object={horizonLine} />

      {/* Terrain */}
      <group position={[0, -1.2, 0]}>
        <TerrainSurface
          geometry={terrainGeometry}
          stress={stress}
          delta={delta}
          showStrategicOverlay={showStrategicOverlay}
        />
      </group>

      {/* Camera discipline: slow + damped = confidence */}
      <OrbitControls
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.35}
        zoomSpeed={0.55}
        minDistance={6}
        maxDistance={18}
        minPolarAngle={Math.PI * 0.20}
        maxPolarAngle={Math.PI * 0.52}
      />
    </>
  );
}
