// ============================================================================
// NEON RIDGE ENGINE — Plain Three.js + GSAP
// NO React-Three-Fiber. NO Recharts. NO Terrain Meshes. NO Noise.
// Pure CatmullRomCurve3 Spline System with Bloom Post-Processing
// ============================================================================

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import gsap from 'gsap';

// ============================================================================
// TYPES
// ============================================================================
export interface NeonRidgeProps {
  dataPoints: number[];
  scenario: 'base' | 'upside' | 'downside' | 'extreme';
  timePeriod: 'monthly' | 'quarterly' | 'yearly';
  activeKPIIndex: number | null;
  onTimelinePositions?: (positions: { x: number; label: string }[]) => void;
}

// ============================================================================
// COLOR PALETTE (NON-NEGOTIABLE)
// ============================================================================
const COLORS = {
  background: 0x0a1628,
  valley: 0x0d4f4f,
  midRidge: 0x14b8a6,
  foregroundRidge: 0x22d3d3,
  peakGlow: 0x5eead4,
};

const SCENARIO_COLORS = {
  base: { primary: 0x22d3d3, secondary: 0x14b8a6, glow: 0x5eead4 },
  upside: { primary: 0x10b981, secondary: 0x059669, glow: 0x34d399 },
  downside: { primary: 0xf59e0b, secondary: 0xd97706, glow: 0xfbbf24 },
  extreme: { primary: 0xef4444, secondary: 0x8b5cf6, glow: 0xf87171 },
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function NeonRidgeEngine({
  dataPoints,
  scenario,
  timePeriod,
  activeKPIIndex,
  onTimelinePositions,
}: NeonRidgeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    composer: EffectComposer;
    ridges: THREE.Line[];
    currentPoints: number[];
    animationId: number;
    clock: THREE.Clock;
  } | null>(null);

  // ========================================================================
  // INITIALIZE THREE.JS ENGINE
  // ========================================================================
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(COLORS.background);
    scene.fog = new THREE.Fog(COLORS.background, 15, 35);

    // Camera (FIXED - NO USER CONTROL)
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 3, 14);
    camera.lookAt(0, 0, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // CRITICAL: Disable all pointer events on canvas
    renderer.domElement.style.pointerEvents = 'none';

    // Post-processing (Bloom)
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      1.5,  // strength
      0.4,  // radius
      0.1   // threshold
    );
    composer.addPass(bloomPass);

    // Ambient Light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.15);
    scene.add(ambientLight);

    // Point Lights for glow effect
    const light1 = new THREE.PointLight(COLORS.peakGlow, 2, 30);
    light1.position.set(0, 5, 5);
    scene.add(light1);

    const light2 = new THREE.PointLight(COLORS.midRidge, 1.5, 25);
    light2.position.set(-5, 3, 3);
    scene.add(light2);

    // Create initial ridges
    const ridges = createRidges(scene, dataPoints, scenario);

    // Clock for animation
    const clock = new THREE.Clock();

    // Store engine reference
    engineRef.current = {
      scene,
      camera,
      renderer,
      composer,
      ridges,
      currentPoints: [...dataPoints],
      animationId: 0,
      clock,
    };

    // Animation loop
    const animate = () => {
      engineRef.current!.animationId = requestAnimationFrame(animate);
      
      const elapsed = clock.getElapsedTime();
      
      // Subtle camera floating (cinematic feel)
      camera.position.y = 3 + Math.sin(elapsed * 0.3) * 0.15;
      camera.position.x = Math.sin(elapsed * 0.2) * 0.1;
      
      // Render with post-processing
      composer.render();
      
      // Update timeline positions
      if (onTimelinePositions) {
        updateTimelinePositions(camera, renderer, dataPoints, timePeriod, onTimelinePositions);
      }
    };
    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(engineRef.current!.animationId);
      renderer.dispose();
      composer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);

  // ========================================================================
  // UPDATE RIDGES WHEN DATA CHANGES (GSAP MORPH)
  // ========================================================================
  useEffect(() => {
    if (!engineRef.current) return;

    const { scene, ridges, currentPoints } = engineRef.current;
    const colors = SCENARIO_COLORS[scenario];

    // GSAP morph current points to new points
    const targetPoints = [...dataPoints];
    
    gsap.to(currentPoints, {
      duration: 0.5,
      ease: 'power2.out',
      ...targetPoints.reduce((acc, val, i) => ({ ...acc, [i]: val }), {}),
      onUpdate: () => {
        // Remove old ridges
        ridges.forEach(ridge => scene.remove(ridge));
        
        // Create new ridges with interpolated points
        const newRidges = createRidges(scene, currentPoints, scenario);
        engineRef.current!.ridges = newRidges;
      },
    });

    // Update colors
    ridges.forEach((ridge, i) => {
      const material = ridge.material as THREE.LineBasicMaterial;
      const targetColor = i === 0 ? colors.secondary : i === 1 ? colors.primary : colors.glow;
      gsap.to(material.color, {
        duration: 0.3,
        r: ((targetColor >> 16) & 255) / 255,
        g: ((targetColor >> 8) & 255) / 255,
        b: (targetColor & 255) / 255,
      });
    });

    engineRef.current.currentPoints = currentPoints;
  }, [dataPoints, scenario]);

  // ========================================================================
  // HIGHLIGHT ON KPI ACTIVATION
  // ========================================================================
  useEffect(() => {
    if (!engineRef.current) return;

    const { ridges } = engineRef.current;
    
    ridges.forEach(ridge => {
      const material = ridge.material as THREE.LineBasicMaterial;
      
      if (activeKPIIndex !== null) {
        // Pulse effect
        gsap.to(material, {
          opacity: 1,
          duration: 0.3,
        });
      } else {
        gsap.to(material, {
          opacity: 0.85,
          duration: 0.3,
        });
      }
    });
  }, [activeKPIIndex]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ background: `#${COLORS.background.toString(16).padStart(6, '0')}` }}
    />
  );
}

// ============================================================================
// CREATE RIDGE SPLINES
// ============================================================================
function createRidges(
  scene: THREE.Scene,
  dataPoints: number[],
  scenario: 'base' | 'upside' | 'downside' | 'extreme'
): THREE.Line[] {
  const ridges: THREE.Line[] = [];
  const colors = SCENARIO_COLORS[scenario];

  // Ridge configurations: [yOffset, zOffset, color, opacity, lineWidth]
  const ridgeConfigs = [
    { yOffset: -0.8, zOffset: -3, color: colors.secondary, opacity: 0.3 },  // Background
    { yOffset: -0.3, zOffset: -1.5, color: colors.primary, opacity: 0.5 },  // Mid
    { yOffset: 0, zOffset: 0, color: colors.glow, opacity: 0.9 },           // Foreground (hero)
  ];

  ridgeConfigs.forEach(config => {
    const points = createSplinePoints(dataPoints, config.yOffset, config.zOffset);
    const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5);
    const curvePoints = curve.getPoints(200);

    const geometry = new THREE.BufferGeometry().setFromPoints(curvePoints);
    
    const material = new THREE.LineBasicMaterial({
      color: config.color,
      transparent: true,
      opacity: config.opacity,
      linewidth: 2,
    });

    const line = new THREE.Line(geometry, material);
    scene.add(line);
    ridges.push(line);
  });

  return ridges;
}

// ============================================================================
// CREATE SPLINE POINTS FROM DATA
// ============================================================================
function createSplinePoints(
  dataPoints: number[],
  yOffset: number,
  zOffset: number
): THREE.Vector3[] {
  const width = 18;
  const heightScale = 6;
  const count = dataPoints.length;

  return dataPoints.map((value, i) => {
    const x = (i / (count - 1)) * width - width / 2;
    const y = (value / 100) * heightScale + yOffset;
    const z = zOffset;
    return new THREE.Vector3(x, y, z);
  });
}

// ============================================================================
// UPDATE TIMELINE POSITIONS (3D → 2D PROJECTION)
// ============================================================================
function updateTimelinePositions(
  camera: THREE.PerspectiveCamera,
  renderer: THREE.WebGLRenderer,
  dataPoints: number[],
  timePeriod: 'monthly' | 'quarterly' | 'yearly',
  callback: (positions: { x: number; label: string }[]) => void
) {
  const labels = {
    monthly: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    quarterly: ['Q1', 'Q2', 'Q3', 'Q4'],
    yearly: ['Y1', 'Y2', 'Y3', 'Y4', 'Y5'],
  }[timePeriod];

  const width = 18;
  const halfWidth = renderer.domElement.clientWidth / 2;
  const count = dataPoints.length;

  const positions = dataPoints.map((_, i) => {
    const x = (i / (count - 1)) * width - width / 2;
    const vector = new THREE.Vector3(x, 0, 0);
    vector.project(camera);
    
    const screenX = (vector.x * halfWidth + halfWidth);
    
    return {
      x: screenX,
      label: labels[i] || '',
    };
  });

  callback(positions);
}