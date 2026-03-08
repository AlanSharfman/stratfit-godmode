// src/components/intelligence/TerrainLaserTarget.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Terrain Intelligence Laser Beam
//
// Renders a thin animated cyan beam from an origin point (intelligence panel
// edge) to the terrain anchor position. Activates only when intelligence
// targeting is active. GPU-friendly animated pulse.
// ═══════════════════════════════════════════════════════════════════════════

import React, { memo, useRef, useMemo, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useIntelligenceTargetStore } from "@/stores/intelligenceTargetStore";
import type { TerrainSurfaceHandle } from "@/terrain/TerrainSurface";

// ────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ────────────────────────────────────────────────────────────────────────────

/** Origin point — upper right area where intelligence panel sits */
const BEAM_ORIGIN: [number, number, number] = [-180, 80, 200];
const BEAM_COLOR = "#00e5ff";
const BEAM_SEGMENTS = 64;
const PULSE_SPEED = 2.5; // Hz

// ────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ────────────────────────────────────────────────────────────────────────────

interface Props {
  terrainRef: React.RefObject<TerrainSurfaceHandle>;
}

const TerrainLaserTarget: React.FC<Props> = memo(({ terrainRef }) => {
  const target = useIntelligenceTargetStore((s) => s.currentTarget);
  const isActive = useIntelligenceTargetStore((s) => s.isActive);

  const lineRef = useRef<THREE.Line>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const { scene } = useThree();

  // Build the Line object imperatively so we avoid the SVG <line> type clash
  const lineObj = useMemo(() => {
    const l = new THREE.Line(new THREE.BufferGeometry(), new THREE.ShaderMaterial());
    l.frustumCulled = false;
    return l;
  }, []);

  // Mount / unmount the Line in the R3F scene
  useEffect(() => {
    scene.add(lineObj);
    return () => { scene.remove(lineObj); };
  }, [lineObj, scene]);

  // Build beam geometry from origin to target
  const { geometry, targetPos } = useMemo(() => {
    if (!target || !isActive) {
      return { geometry: null, targetPos: null };
    }

    // Sample terrain height for anchor Y
    const terrain = terrainRef.current;
    const ax = target.position[0];
    const az = target.position[2];
    const ay = terrain ? terrain.getHeightAt(ax, az) + 0.05 : target.position[1] + 0.05;

    const from = new THREE.Vector3(...BEAM_ORIGIN);
    const to = new THREE.Vector3(ax, ay, az);

    // Create smooth arc (slight curve upward for cinematic feel)
    const points: THREE.Vector3[] = [];
    for (let i = 0; i <= BEAM_SEGMENTS; i++) {
      const t = i / BEAM_SEGMENTS;
      const p = new THREE.Vector3().lerpVectors(from, to, t);
      // Add arc — peaks at t=0.5
      const arcHeight = Math.sin(t * Math.PI) * 12;
      p.y += arcHeight;
      points.push(p);
    }

    const geo = new THREE.BufferGeometry().setFromPoints(points);
    return { geometry: geo, targetPos: to };
  }, [target, isActive, terrainRef]);

  // Shader material for animated energy pulse
  const shaderMat = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(BEAM_COLOR) },
        uOpacity: { value: 0.65 },
      },
      vertexShader: `
        varying float vT;
        void main() {
          vT = position.x; // approximate parameter
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColor;
        uniform float uOpacity;
        varying float vT;
        void main() {
          float pulse = 0.4 + 0.6 * abs(sin(vT * 0.01 + uTime * ${PULSE_SPEED.toFixed(1)}));
          gl_FragColor = vec4(uColor, uOpacity * pulse);
        }
      `,
    });
  }, []);

  // Sync geometry + material onto the imperative Line object, toggle visibility
  useEffect(() => {
    if (geometry && isActive) {
      lineObj.geometry.dispose();
      lineObj.geometry = geometry;
      (lineObj.material as THREE.Material).dispose();
      lineObj.material = shaderMat;
      lineObj.visible = true;
    } else {
      lineObj.visible = false;
    }
  }, [geometry, isActive, lineObj, shaderMat]);

  // Animate pulse
  useFrame((_, delta) => {
    if (!isActive || !lineObj.visible) return;
    const mat = lineObj.material as THREE.ShaderMaterial;
    if (mat.uniforms?.uTime) {
      mat.uniforms.uTime.value += delta;
    }
  });

  return null;
});

TerrainLaserTarget.displayName = "TerrainLaserTarget";
export default TerrainLaserTarget;
