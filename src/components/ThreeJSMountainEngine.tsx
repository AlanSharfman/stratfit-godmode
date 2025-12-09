// ============================================================================
// ThreeJSMountainEngine.tsx - PURPLE/MAGENTA GOD MODE
// ============================================================================

import { useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export interface MountainEngineProps {
  activeKPIIndex: number | null;
  growth: number;
  efficiency: number;
  scenario?: 'base' | 'upside' | 'downside' | 'extreme';
}

interface EngineState {
  time: number;
  height: number;
  speed: number;
  interactionX: number;
  interactionForce: number;
}

// Simplex Noise Implementation
class SimplexNoise {
  private perm: number[] = [];
  private gradP: { x: number; y: number; z: number }[] = [];
  private grad3 = [
    { x: 1, y: 1, z: 0 }, { x: -1, y: 1, z: 0 }, { x: 1, y: -1, z: 0 }, { x: -1, y: -1, z: 0 },
    { x: 1, y: 0, z: 1 }, { x: -1, y: 0, z: 1 }, { x: 1, y: 0, z: -1 }, { x: -1, y: 0, z: -1 },
    { x: 0, y: 1, z: 1 }, { x: 0, y: -1, z: 1 }, { x: 0, y: 1, z: -1 }, { x: 0, y: -1, z: -1 }
  ];
  private p = [151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,
    8,99,37,240,21,10,23,190,6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,
    35,11,32,57,177,33,88,237,149,56,87,174,20,125,136,171,168,68,175,74,165,71,
    134,139,48,27,166,77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,
    55,46,245,40,244,102,143,54,65,25,63,161,1,216,80,73,209,76,132,187,208,89,
    18,169,200,196,135,130,116,188,159,86,164,100,109,198,173,186,3,64,52,217,226,
    250,124,123,5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,
    189,28,42,223,183,170,213,119,248,152,2,44,154,163,70,221,153,101,155,167,43,
    172,9,129,22,39,253,19,98,108,110,79,113,224,232,178,185,112,104,218,246,97,
    228,251,34,242,193,238,210,144,12,191,179,162,241,81,51,145,235,249,14,239,
    107,49,192,214,31,181,199,106,157,184,84,204,176,115,121,50,45,127,4,150,254,
    138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180];

  constructor(seed = Math.random()) {
    if (seed > 0 && seed < 1) seed *= 65536;
    seed = Math.floor(seed);
    if (seed < 256) seed |= seed << 8;
    for (let i = 0; i < 256; i++) {
      const v = (i & 1) ? (this.p[i] ^ (seed & 255)) : (this.p[i] ^ ((seed >> 8) & 255));
      this.perm[i] = this.perm[i + 256] = v;
      this.gradP[i] = this.gradP[i + 256] = this.grad3[v % 12];
    }
  }

  noise3D(x: number, y: number, z: number): number {
    const F3 = 1 / 3, G3 = 1 / 6;
    let n0, n1, n2, n3;
    const s = (x + y + z) * F3;
    const i = Math.floor(x + s), j = Math.floor(y + s), k = Math.floor(z + s);
    const t = (i + j + k) * G3;
    const X0 = i - t, Y0 = j - t, Z0 = k - t;
    const x0 = x - X0, y0 = y - Y0, z0 = z - Z0;
    let i1, j1, k1, i2, j2, k2;
    if (x0 >= y0) {
      if (y0 >= z0) { i1=1; j1=0; k1=0; i2=1; j2=1; k2=0; }
      else if (x0 >= z0) { i1=1; j1=0; k1=0; i2=1; j2=0; k2=1; }
      else { i1=0; j1=0; k1=1; i2=1; j2=0; k2=1; }
    } else {
      if (y0 < z0) { i1=0; j1=0; k1=1; i2=0; j2=1; k2=1; }
      else if (x0 < z0) { i1=0; j1=1; k1=0; i2=0; j2=1; k2=1; }
      else { i1=0; j1=1; k1=0; i2=1; j2=1; k2=0; }
    }
    const x1 = x0 - i1 + G3, y1 = y0 - j1 + G3, z1 = z0 - k1 + G3;
    const x2 = x0 - i2 + 2*G3, y2 = y0 - j2 + 2*G3, z2 = z0 - k2 + 2*G3;
    const x3 = x0 - 1 + 3*G3, y3 = y0 - 1 + 3*G3, z3 = z0 - 1 + 3*G3;
    const ii = i & 255, jj = j & 255, kk = k & 255;
    let t0 = 0.6 - x0*x0 - y0*y0 - z0*z0;
    if (t0 < 0) n0 = 0;
    else { t0 *= t0; const gi0 = this.gradP[ii + this.perm[jj + this.perm[kk]]]; n0 = t0 * t0 * (gi0.x*x0 + gi0.y*y0 + gi0.z*z0); }
    let t1 = 0.6 - x1*x1 - y1*y1 - z1*z1;
    if (t1 < 0) n1 = 0;
    else { t1 *= t1; const gi1 = this.gradP[ii + i1 + this.perm[jj + j1 + this.perm[kk + k1]]]; n1 = t1 * t1 * (gi1.x*x1 + gi1.y*y1 + gi1.z*z1); }
    let t2 = 0.6 - x2*x2 - y2*y2 - z2*z2;
    if (t2 < 0) n2 = 0;
    else { t2 *= t2; const gi2 = this.gradP[ii + i2 + this.perm[jj + j2 + this.perm[kk + k2]]]; n2 = t2 * t2 * (gi2.x*x2 + gi2.y*y2 + gi2.z*z2); }
    let t3 = 0.6 - x3*x3 - y3*y3 - z3*z3;
    if (t3 < 0) n3 = 0;
    else { t3 *= t3; const gi3 = this.gradP[ii + 1 + this.perm[jj + 1 + this.perm[kk + 1]]]; n3 = t3 * t3 * (gi3.x*x3 + gi3.y*y3 + gi3.z*z3); }
    return 32 * (n0 + n1 + n2 + n3);
  }
}

// Mountain Grid Component
function MountainGrid({ growth, efficiency, activeKPIIndex, scenario = 'upside' }: MountainEngineProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const noise = useMemo(() => new SimplexNoise(42), []);
  const state = useRef<EngineState>({ time: 0, height: 20, speed: 0.02, interactionX: 0, interactionForce: 0 });
  const gridSize = 100;
  const segments = 80;

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(gridSize, gridSize * 0.6, segments, Math.floor(segments * 0.6));
    const colors = new Float32Array(geo.attributes.position.count * 3);
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  }, []);

  // SCENARIO COLOR PALETTES - Purple/Magenta Theme
  const scenarioColors = useMemo(() => ({
    base: {
      low: [0.05, 0.02, 0.15],      // Deep purple-black
      mid: [0.4, 0.1, 0.6],          // Purple
      high: [0.6, 0.2, 0.8],         // Magenta
      peak: [0.8, 0.4, 1.0]          // Bright magenta
    },
    upside: {
      low: [0.02, 0.05, 0.15],      // Deep blue-black
      mid: [0.3, 0.1, 0.7],          // Violet
      high: [0.5, 0.2, 0.9],         // Bright violet
      peak: [0.7, 0.5, 1.0]          // Pink-white glow
    },
    downside: {
      low: [0.08, 0.05, 0.12],      // Muted purple-grey
      mid: [0.25, 0.15, 0.35],       // Dusty purple
      high: [0.35, 0.25, 0.45],      // Muted violet
      peak: [0.5, 0.4, 0.6]          // Grey-purple
    },
    extreme: {
      low: [0.1, 0.0, 0.2],         // Deep magenta-black
      mid: [0.8, 0.0, 0.5],          // Hot pink
      high: [1.0, 0.2, 0.6],         // Neon pink
      peak: [1.0, 0.6, 0.9]          // White-pink glow
    }
  }), []);

  const kpiXPositions = [-50, -35, -20, 0, 20, 35, 50];

  useEffect(() => {
    const s = state.current;
    s.height = 10 + (growth / 100) * 25;
    s.speed = 0.01 + (efficiency / 100) * 0.04;
  }, [growth, efficiency]);

  useEffect(() => {
    if (activeKPIIndex !== null && activeKPIIndex >= 0 && activeKPIIndex <= 6) {
      state.current.interactionX = kpiXPositions[activeKPIIndex];
      state.current.interactionForce = 35;
    }
  }, [activeKPIIndex]);

  useFrame(() => {
    if (!meshRef.current) return;
    const s = state.current;
    const colors = scenarioColors[scenario];
    s.time += s.speed;
    s.interactionForce *= 0.95;

    const positions = meshRef.current.geometry.attributes.position.array as Float32Array;
    const vertexColors = meshRef.current.geometry.attributes.color.array as Float32Array;
    const width = segments + 1;
    const depth = Math.floor(segments * 0.6) + 1;

    for (let i = 0; i < width; i++) {
      for (let j = 0; j < depth; j++) {
        const idx = (j * width + i) * 3;
        const x = (i / segments - 0.5) * gridSize;
        const z = (j / (segments * 0.6) - 0.5) * gridSize * 0.6;

        let elevation = 0;
        elevation += noise.noise3D(x * 0.02, z * 0.03, s.time * 0.5) * 1.0;
        elevation += noise.noise3D(x * 0.04, z * 0.05, s.time * 0.3) * 0.5;
        elevation += noise.noise3D(x * 0.08, z * 0.1, s.time * 0.2) * 0.25;
        elevation *= s.height;

        if (s.interactionForce > 0.5) {
          const distFromInteraction = Math.abs(x - s.interactionX);
          const surgeFactor = Math.exp(-(distFromInteraction * distFromInteraction) / 200);
          elevation += surgeFactor * s.interactionForce * 0.8;
        }

        elevation = Math.max(0, elevation);
        positions[idx + 2] = elevation;

        const maxHeight = s.height * 1.5 + 35;
        const normalizedHeight = Math.min(elevation / maxHeight, 1);

        let r, g, b;
        if (normalizedHeight < 0.33) {
          const t = normalizedHeight * 3;
          r = colors.low[0] + (colors.mid[0] - colors.low[0]) * t;
          g = colors.low[1] + (colors.mid[1] - colors.low[1]) * t;
          b = colors.low[2] + (colors.mid[2] - colors.low[2]) * t;
        } else if (normalizedHeight < 0.66) {
          const t = (normalizedHeight - 0.33) * 3;
          r = colors.mid[0] + (colors.high[0] - colors.mid[0]) * t;
          g = colors.mid[1] + (colors.high[1] - colors.mid[1]) * t;
          b = colors.mid[2] + (colors.high[2] - colors.mid[2]) * t;
        } else {
          const t = (normalizedHeight - 0.66) * 3;
          r = colors.high[0] + (colors.peak[0] - colors.high[0]) * t;
          g = colors.high[1] + (colors.peak[1] - colors.high[1]) * t;
          b = colors.high[2] + (colors.peak[2] - colors.high[2]) * t;
        }

        vertexColors[idx] = r;
        vertexColors[idx + 1] = g;
        vertexColors[idx + 2] = b;
      }
    }

    meshRef.current.geometry.attributes.position.needsUpdate = true;
    meshRef.current.geometry.attributes.color.needsUpdate = true;
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2.5, 0, 0]} position={[0, -5, 10]}>
      <primitive object={geometry} attach="geometry" />
      <meshBasicMaterial vertexColors wireframe transparent opacity={0.85} />
    </mesh>
  );
}

// Main Export
export default function ThreeJSMountainEngine({ activeKPIIndex, growth, efficiency, scenario = 'upside' }: MountainEngineProps) {
  return (
    <Canvas 
      style={{ position: 'absolute', width: '100%', height: '100%', top: 0, left: 0 }}
      camera={{ position: [0, 30, 60], fov: 50, near: 0.1, far: 1000 }}
    >
      <ambientLight intensity={0.3} />
      <directionalLight position={[30, 50, 30]} intensity={0.6} color="#a855f7" />
      <directionalLight position={[-30, 30, -20]} intensity={0.4} color="#ec4899" />
      <pointLight position={[0, 40, 0]} intensity={0.5} color="#8b5cf6" />
      <MountainGrid growth={growth} efficiency={efficiency} activeKPIIndex={activeKPIIndex} scenario={scenario} />
      <fog attach="fog" args={['#0a0b1a', 50, 120]} />
    </Canvas>
  );
}