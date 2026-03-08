// src/components/intelligence/IntelligenceCameraFocus.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Intelligence Camera Focus Adjustment
//
// When intelligence targeting activates, subtly adjusts the camera
// to reframe the terrain so the target anchor is visible.
// No dramatic movements — smooth eased pan/tilt.
// ═══════════════════════════════════════════════════════════════════════════

import React, { memo, useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useIntelligenceTargetStore } from "@/stores/intelligenceTargetStore";
import type { TerrainSurfaceHandle } from "@/terrain/TerrainSurface";
import { useTerrainControls } from "@/terrain/useTerrainControls";

// ────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ────────────────────────────────────────────────────────────────────────────

/** How much the camera target shifts toward the anchor (0..1 blend) */
const TARGET_BLEND = 0.15;
/** Easing speed (higher = faster response) */
const EASE_SPEED = 1.2;

// ────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ────────────────────────────────────────────────────────────────────────────

interface Props {
  terrainRef: React.RefObject<TerrainSurfaceHandle>;
}

const IntelligenceCameraFocus: React.FC<Props> = memo(({ terrainRef }) => {
  const target = useIntelligenceTargetStore((s) => s.currentTarget);
  const isActive = useIntelligenceTargetStore((s) => s.isActive);
  const controls = useTerrainControls((s) => s.controls);

  const originalTarget = useRef<THREE.Vector3 | null>(null);
  const blendedTarget = useRef(new THREE.Vector3());
  const isBlending = useRef(false);

  // Capture original controls target when targeting activates
  useEffect(() => {
    if (isActive && target && controls) {
      originalTarget.current = controls.target.clone();
      isBlending.current = true;
    }
    if (!isActive && originalTarget.current && controls) {
      // Smoothly return — will be handled in useFrame
      isBlending.current = true;
    }
  }, [isActive, target, controls]);

  useFrame((_, delta) => {
    if (!controls || !isBlending.current) return;

    if (isActive && target && originalTarget.current) {
      // Blend controls target toward anchor position
      const terrain = terrainRef.current;
      const ax = target.position[0];
      const az = target.position[2];
      const ay = terrain ? terrain.getHeightAt(ax, az) : 0;
      const anchorPos = new THREE.Vector3(ax, ay, az);

      // Desired target = blend between original and anchor
      const desired = new THREE.Vector3().lerpVectors(
        originalTarget.current,
        anchorPos,
        TARGET_BLEND,
      );

      // Ease toward desired
      blendedTarget.current.lerp(desired, EASE_SPEED * delta);
      controls.target.copy(blendedTarget.current);
      controls.update();
    } else if (!isActive && originalTarget.current) {
      // Return to original
      blendedTarget.current.lerp(originalTarget.current, EASE_SPEED * delta);
      controls.target.copy(blendedTarget.current);
      controls.update();

      // Stop blending when close enough
      if (blendedTarget.current.distanceTo(originalTarget.current) < 0.1) {
        isBlending.current = false;
        originalTarget.current = null;
      }
    }
  });

  return null;
});

IntelligenceCameraFocus.displayName = "IntelligenceCameraFocus";
export default IntelligenceCameraFocus;
