// src/components/intelligence/TerrainTargetSpotlight.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Terrain Target Spotlight
//
// Subtle directional light boost focused on the target terrain anchor.
// Increases intensity by +0.2 when active. Fades back when cleared.
// ═══════════════════════════════════════════════════════════════════════════

import React, { memo, useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useIntelligenceTargetStore } from "@/stores/intelligenceTargetStore";
import type { TerrainSurfaceHandle } from "@/terrain/TerrainSurface";

// ────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ────────────────────────────────────────────────────────────────────────────

const SPOTLIGHT_INTENSITY = 0.35;
const SPOTLIGHT_HEIGHT = 50;
const SPOTLIGHT_DISTANCE = 120;
const SPOTLIGHT_ANGLE = 0.35; // ~20 degrees
const SPOTLIGHT_PENUMBRA = 0.6;
const FADE_SPEED = 2.0; // units/sec for intensity transitions
const SPOTLIGHT_COLOR = "#e0f7ff";

// ────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ────────────────────────────────────────────────────────────────────────────

interface Props {
  terrainRef: React.RefObject<TerrainSurfaceHandle>;
}

const TerrainTargetSpotlight: React.FC<Props> = memo(({ terrainRef }) => {
  const target = useIntelligenceTargetStore((s) => s.currentTarget);
  const isActive = useIntelligenceTargetStore((s) => s.isActive);

  const lightRef = useRef<THREE.SpotLight>(null);
  const targetObjRef = useRef<THREE.Object3D>(null);
  const currentIntensity = useRef(0);

  const targetPos = useMemo((): THREE.Vector3 => {
    if (!target) return new THREE.Vector3(0, 0, 0);
    const ax = target.position[0];
    const az = target.position[2];
    const terrain = terrainRef.current;
    const ay = terrain ? terrain.getHeightAt(ax, az) : 0;
    return new THREE.Vector3(ax, ay, az);
  }, [target, terrainRef]);

  // Smooth fade in/out
  useFrame((_, delta) => {
    if (!lightRef.current) return;

    const goalIntensity = isActive && target ? SPOTLIGHT_INTENSITY : 0;
    const diff = goalIntensity - currentIntensity.current;
    const step = FADE_SPEED * delta;

    if (Math.abs(diff) < step) {
      currentIntensity.current = goalIntensity;
    } else {
      currentIntensity.current += Math.sign(diff) * step;
    }

    lightRef.current.intensity = currentIntensity.current;

    // Point spotlight down at target
    if (isActive && target) {
      lightRef.current.position.set(targetPos.x, targetPos.y + SPOTLIGHT_HEIGHT, targetPos.z + 10);
      if (targetObjRef.current) {
        lightRef.current.target = targetObjRef.current;
        targetObjRef.current.position.copy(targetPos);
        targetObjRef.current.updateMatrixWorld();
      }
    }
  });

  return (
    <>
      <spotLight
        ref={lightRef}
        color={SPOTLIGHT_COLOR}
        intensity={0}
        distance={SPOTLIGHT_DISTANCE}
        angle={SPOTLIGHT_ANGLE}
        penumbra={SPOTLIGHT_PENUMBRA}
        position={[targetPos.x, targetPos.y + SPOTLIGHT_HEIGHT, targetPos.z + 10]}
        castShadow={false}
      />
      {/* SpotLight requires a target object added to scene */}
      <object3D ref={targetObjRef} position={targetPos} />
    </>
  );
});

TerrainTargetSpotlight.displayName = "TerrainTargetSpotlight";
export default TerrainTargetSpotlight;
