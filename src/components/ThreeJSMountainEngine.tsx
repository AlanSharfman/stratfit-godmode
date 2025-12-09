// ============================================================================
// ThreeJSMountainEngine.tsx - 3D Physics Engine (Verified Final Version)
// ============================================================================
import React, { useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise'; // <-- THIS WAS MISSING

export interface MountainEngineProps {
  activeKPIIndex: number | null;
  growth: number;
  efficiency: number;
}

interface EngineState { // <-- THIS WAS MISSING
  time: number;
  height: number;
  speed: number;
  interactionX: number;
  interactionForce: number;
}

const MountainGrid: React.FC<MountainEngineProps> = ({ activeKPIIndex, growth, efficiency }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const noise2D = useMemo(() => createNoise2D(), []);
  
  const state = useRef<EngineState>({ 
    time: 0, 
    height: 10 + (growth / 100) * 25, 
    speed: 0.01 + (efficiency / 100) * 0.04, 
    interactionX: 0, 
    interactionForce: 0 
  });
  
  const roughness = 0.08;

  // <-- !!! THIS USE EFFECT BLOCK WAS MISSING AND IS CRUCIAL FOR INTERACTION !!! -->
  useEffect(() => {
    // 1. Update speed and height when sliders move
    state.current.speed = 0.01 + (efficiency / 100) * 0.04;
    state.current.height = 10 + (growth / 100) * 25;
  }, [growth, efficiency]);

  useEffect(() => {
    // 2. Trigger the surge when a KPI is clicked
    if (activeKPIIndex !== null) {
      const kpiPositions = [-50, -35, -20, 0, 20, 35, 50];
      state.current.interactionX = kpiPositions[Math.min(activeKPIIndex, 6)];
      state.current.interactionForce = 35; // Set the initial surge height
    }
  }, [activeKPIIndex]);
  // <-- !!! END MISSING USE EFFECT BLOCK !!! -->

  const { positions, colors } = useMemo(() => {
    const width = 140;
    const depth = 80;
    const segmentsW = 100;
    const segmentsD = 60;
    
    const geo = new THREE.PlaneGeometry(width, depth, segmentsW, segmentsD);
    geo.rotateX(-Math.PI / 2);

    const count = geo.attributes.position.count;
    const colorsArr = new Float32Array(count * 3);
    
    return {
      positions: geo.attributes.position,
      colors: new THREE.BufferAttribute(colorsArr, 3),
    };
  }, []);

  useFrame(() => {
    if (!meshRef.current) return;

    const s = state.current;
    s.time += s.speed;

    // Decay the surge force over time
    if (s.interactionForce > 0.1) s.interactionForce *= 0.95;
    else s.interactionForce = 0;

    const posAttr = meshRef.current.geometry.attributes.position;
    const colAttr = meshRef.current.geometry.attributes.color;
    
    const posArray = posAttr.array as Float32Array;
    const colArray = colAttr.array as Float32Array;

    const colorLow = new THREE.Color(0x7A00FF);
    const colorMid = new THREE.Color(0x0077FF);
    const colorHigh = new THREE.Color(0x00FFFF);
    const tempColor = new THREE.Color();

    for (let i = 0; i < posAttr.count; i++) {
      const x = posArray[i * 3];
      const z = posArray[i * 3 + 2];

      let y = noise2D(x * roughness, z * roughness - s.time) * s.height;
      y = Math.abs(y);

      const distFromCenter = Math.abs(x);
      const falloff = Math.max(0, 1 - (distFromCenter / 70));
      y *= falloff;

      if (s.interactionForce > 0.1) {
        const distToClick = Math.abs(x - s.interactionX);
        if (distToClick < 25) {
          const spike = Math.cos((distToClick / 25) * (Math.PI / 2));
          y += spike * s.interactionForce;
        }
      }

      posArray[i * 3 + 1] = Math.max(0, y);

      const normHeight = Math.min(1, y / (s.height + 25));
      
      if (normHeight < 0.3) {
        tempColor.lerpColors(colorLow, colorMid, normHeight / 0.3);
      } else {
        tempColor.lerpColors(colorMid, colorHigh, (normHeight - 0.3) / 0.7);
      }

      const distToCamera = 60 - z; 
      const alpha = Math.max(0.1, 1 - (distToCamera / 100));

      colArray[i * 3] = tempColor.r * alpha;
      colArray[i * 3 + 1] = tempColor.g * alpha;
      colArray[i * 3 + 2] = tempColor.b * alpha;
    }

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
  });

  return (
    <mesh ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute 
          attach="attributes-position" 
          array={positions.array as Float32Array} 
          count={positions.count} 
          itemSize={positions.itemSize} 
        />
        <bufferAttribute 
          attach="attributes-color" 
          array={colors.array as Float32Array} 
          count={colors.count} 
          itemSize={colors.itemSize} 
        />
      </bufferGeometry>
      <meshBasicMaterial 
        vertexColors 
        wireframe 
        transparent 
        opacity={0.8} 
        side={THREE.DoubleSide} 
      />
    </mesh>
  );
};

const ThreeJSMountainEngine: React.FC<MountainEngineProps> = (props) => {
  return (
    <div className="w-full h-full bg-[#020204] rounded-2xl overflow-hidden relative shadow-inner">
      <div className="absolute inset-0 z-10 pointer-events-none opacity-20"
           style={{ 
             background: 'linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.5))',
             backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #000 3px)'
           }} 
      />
      
      <Canvas camera={{ position: [0, 15, 60], fov: 50 }}>
        <fog attach="fog" args={['#020204', 20, 100]} />
        <MountainGrid {...props} />
        <gridHelper args={[200, 40, 0x1e293b, 0x0a0a0a]} position={[0, -2, 0]} />
      </Canvas>
    </div>
  );
};

export default ThreeJSMountainEngine;