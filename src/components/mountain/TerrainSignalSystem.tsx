// src/components/mountain/TerrainSignalSystem.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Terrain Signal System Container
//
// Orchestrates:
//   • Ridge trajectory path
//   • Path pulse particle
//   • Event beacons (max 8)
//   • Temporal highlight (nearest beacon to current step)
//   • Intelligence laser pointer (AI → beacon reference)
//   • Camera attention (subtle tilt toward active event)
//
// Reads from studioTimelineStore. Returns null when no timeline is active.
// ═══════════════════════════════════════════════════════════════════════════

import React, { memo, useMemo, useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { useStudioTimelineStore } from "@/stores/studioTimelineStore";
import { selectTimelineBeacons, type TimelineBeacon } from "@/selectors/eventSelectors";
import type { TerrainSurfaceHandle } from "@/terrain/TerrainSurface";
import { useTerrainControls } from "@/terrain/useTerrainControls";

import RidgeTrajectoryPath from "@/components/mountain/RidgeTrajectoryPath";
import PathPulse from "@/components/mountain/PathPulse";
import EventBeacon from "@/components/mountain/EventBeacon";
import IntelligenceLaser from "@/components/intelligence/IntelligenceLaser";

// ────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ────────────────────────────────────────────────────────────────────────────

const CAMERA_EASE_SPEED = 1.8;        // how fast the camera eases
const CAMERA_BLEND = 0.08;            // how much the camera shifts (subtle)
const TERRAIN_HALF_W = 560 * 3.0 * 0.5;

// ────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ────────────────────────────────────────────────────────────────────────────

interface Props {
  terrainRef: React.RefObject<TerrainSurfaceHandle>;
}

const TerrainSignalSystem: React.FC<Props> = memo(({ terrainRef }) => {
  const engineResults = useStudioTimelineStore((s) => s.engineResults);
  const currentStep = useStudioTimelineStore((s) => s.currentStep);
  const isPlaying = useStudioTimelineStore((s) => s.isPlaying);
  const controls = useTerrainControls((s) => s.controls);

  const hasTimeline = !!engineResults && engineResults.timeline.length >= 2;
  const engineTimeline = engineResults?.timeline ?? [];
  const peakEV = engineResults?.summary.peakEV ?? 0;

  // Detect event beacons
  const beacons = useMemo(
    () => selectTimelineBeacons(engineTimeline),
    [engineTimeline],
  );

  // Find nearest beacon to current step (temporal highlight)
  const highlightedBeacon = useMemo<TimelineBeacon | null>(() => {
    if (beacons.length === 0) return null;

    let nearest: TimelineBeacon | null = null;
    let minDist = Infinity;

    for (const b of beacons) {
      const dist = Math.abs(b.stepIndex - currentStep);
      if (dist < minDist) {
        minDist = dist;
        nearest = b;
      }
    }

    // Only highlight if within 2 steps
    return nearest && minDist <= 2 ? nearest : null;
  }, [beacons, currentStep]);

  // Camera attention: subtle tilt toward highlighted beacon
  const originalTargetRef = useRef<THREE.Vector3 | null>(null);
  const isBlending = useRef(false);

  useEffect(() => {
    if (highlightedBeacon && controls) {
      if (!originalTargetRef.current) {
        originalTargetRef.current = controls.target.clone();
      }
      isBlending.current = true;
    }
    if (!highlightedBeacon && originalTargetRef.current && controls) {
      isBlending.current = true;
    }
  }, [highlightedBeacon, controls]);

  useFrame((_, delta) => {
    if (!hasTimeline || !controls || !isBlending.current) return;

    if (highlightedBeacon && originalTargetRef.current) {
      // Compute beacon world position
      const bx = (highlightedBeacon.normalizedX - 0.5) * TERRAIN_HALF_W * 1.4;
      const terrain = terrainRef.current;
      const by = terrain ? terrain.getHeightAt(bx, 0) : 0;
      const beaconPos = new THREE.Vector3(bx, by, 0);

      const desired = new THREE.Vector3().lerpVectors(
        originalTargetRef.current,
        beaconPos,
        CAMERA_BLEND,
      );

      controls.target.lerp(desired, CAMERA_EASE_SPEED * delta);
      controls.update();
    } else if (!highlightedBeacon && originalTargetRef.current) {
      controls.target.lerp(originalTargetRef.current, CAMERA_EASE_SPEED * delta);
      controls.update();

      if (controls.target.distanceTo(originalTargetRef.current) < 0.1) {
        isBlending.current = false;
        originalTargetRef.current = null;
      }
    }
  });

  // No timeline → nothing to render
  if (!hasTimeline) return null;

  return (
    <>
      {/* Strategic Ridge Path */}
      <RidgeTrajectoryPath
        timeline={engineTimeline}
        peakEV={peakEV}
        terrainRef={terrainRef}
      />

      {/* Moving pulse particle */}
      <PathPulse
        timeline={engineTimeline}
        peakEV={peakEV}
        currentStep={currentStep}
        isPlaying={isPlaying}
        terrainRef={terrainRef}
      />

      {/* Event beacons */}
      {beacons.map((beacon) => (
        <EventBeacon
          key={beacon.id}
          beacon={beacon}
          terrainRef={terrainRef}
          isHighlighted={highlightedBeacon?.id === beacon.id}
        />
      ))}

      {/* Intelligence laser from UI → highlighted beacon */}
      <IntelligenceLaser
        targetBeacon={highlightedBeacon}
        terrainRef={terrainRef}
      />
    </>
  );
});

TerrainSignalSystem.displayName = "TerrainSignalSystem";
export default TerrainSignalSystem;
