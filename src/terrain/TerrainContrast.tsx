import * as THREE from "three";
import { useMemo } from "react";

/**
 * TerrainContrast
 * Adds subtle atmospheric depth + tonal separation
 * Pure visual layer — no geometry changes
 */

export function useTerrainContrast() {
  return useMemo(() => {
    const fogColor = new THREE.Color("#0b1d2a"); // deep cyan shadow tone

    return {
      fog: {
        color: fogColor,
        near: 40,
        far: 260,
      },

      material: {
        roughness: 0.92,
        metalness: 0.05,

        // contrast curve multiplier applied in shader hook
        contrastBoost: 1.18,

        // subtle elevation tinting
        lowColor: new THREE.Color("#0c2a3a"),
        midColor: new THREE.Color("#1f5f7a"),
        highColor: new THREE.Color("#a6e8ff"),
      },
    };
  }, []);
}
