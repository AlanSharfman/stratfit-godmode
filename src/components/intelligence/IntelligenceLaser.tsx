// src/components/intelligence/IntelligenceLaser.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Intelligence Laser Pointer
//
// When AI narrative references a timeline event (beacon),
// draws an animated line from the UI panel origin to the beacon position.
// Uses THREE.Line with animated opacity.
// ═══════════════════════════════════════════════════════════════════════════

import React, { memo, useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import type { TimelineBeacon } from "@/selectors/eventSelectors";
import type { TerrainSurfaceHandle } from "@/terrain/TerrainSurface";

// ────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ────────────────────────────────────────────────────────────────────────────

const TERRAIN_HALF_W = 560 * 3.0 * 0.5;

/** Origin: upper-right intelligence panel area */
const LASER_ORIGIN = new THREE.Vector3(-180, 90, 210);
const LASER_COLOR = "#00e5ff";
const LASER_SEGMENTS = 48;
const ARC_HEIGHT = 15;
const FADE_SPEED = 3.0; // units/sec for opacity transitions
const MAX_OPACITY = 0.55;

// ────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ────────────────────────────────────────────────────────────────────────────

interface Props {
  targetBeacon: TimelineBeacon | null;
  terrainRef: React.RefObject<TerrainSurfaceHandle>;
}

const IntelligenceLaser: React.FC<Props> = memo(({ targetBeacon, terrainRef }) => {
  const { scene } = useThree();
  const lineObjRef = useRef<THREE.Line | null>(null);
  const matRef = useRef<THREE.LineBasicMaterial | null>(null);
  const currentOpacity = useRef(0);
  const isActive = targetBeacon !== null;

  // Build / update line geometry
  const targetPos = useMemo(() => {
    if (!targetBeacon) return null;
    const x = (targetBeacon.normalizedX - 0.5) * TERRAIN_HALF_W * 1.4;
    const z = 0;
    const terrain = terrainRef.current;
    const y = terrain ? terrain.getHeightAt(x, z) + 2 : 10;
    return new THREE.Vector3(x, y, z);
  }, [targetBeacon, terrainRef]);

  // Create line object once
  useEffect(() => {
    const mat = new THREE.LineBasicMaterial({
      color: LASER_COLOR,
      transparent: true,
      opacity: 0,
      toneMapped: false,
      depthWrite: false,
    });
    const geo = new THREE.BufferGeometry();
    const line = new THREE.Line(geo, mat);
    line.frustumCulled = false;
    scene.add(line);

    lineObjRef.current = line;
    matRef.current = mat;

    return () => {
      scene.remove(line);
      geo.dispose();
      mat.dispose();
    };
  }, [scene]);

  // Update geometry when target changes
  useEffect(() => {
    if (!lineObjRef.current || !targetPos) return;

    const points: THREE.Vector3[] = [];
    for (let i = 0; i <= LASER_SEGMENTS; i++) {
      const t = i / LASER_SEGMENTS;
      const p = new THREE.Vector3().lerpVectors(LASER_ORIGIN, targetPos, t);
      p.y += Math.sin(t * Math.PI) * ARC_HEIGHT;
      points.push(p);
    }

    const positions = new Float32Array(points.length * 3);
    for (let i = 0; i < points.length; i++) {
      positions[i * 3] = points[i].x;
      positions[i * 3 + 1] = points[i].y;
      positions[i * 3 + 2] = points[i].z;
    }

    lineObjRef.current.geometry.dispose();
    const newGeo = new THREE.BufferGeometry();
    newGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    lineObjRef.current.geometry = newGeo;
  }, [targetPos]);

  // Animate opacity fade in/out
  useFrame((_, delta) => {
    if (!matRef.current) return;

    const goal = isActive ? MAX_OPACITY : 0;
    const diff = goal - currentOpacity.current;
    const step = FADE_SPEED * delta;

    if (Math.abs(diff) < step) {
      currentOpacity.current = goal;
    } else {
      currentOpacity.current += Math.sign(diff) * step;
    }

    matRef.current.opacity = currentOpacity.current;
    if (lineObjRef.current) {
      lineObjRef.current.visible = currentOpacity.current > 0.01;
    }
  });

  return null;
});

IntelligenceLaser.displayName = "IntelligenceLaser";
export default IntelligenceLaser;
