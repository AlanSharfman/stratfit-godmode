// src/components/visuals/NeuralBackground.tsx
// STRATFIT — Neural Constellation Background
// Floating nodes that connect when user is actively simulating

import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useUIStore } from '@/state/uiStore';

const NODE_COUNT = 35;
const CONNECTION_DIST = 12;

interface Node {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  baseOpacity: number;
}

// Deterministic pseudo-random (render-pure) generator.
const frac = (n: number) => n - Math.floor(n);
function prng01(seed: number): number {
  // NOTE: deterministic + pure; avoids Math.random() in render.
  return frac(Math.sin(seed) * 43758.5453123);
}
function prngCentered(seed: number): number {
  return prng01(seed) - 0.5;
}

export function NeuralBackground() {
  const isDragging = useUIStore((s) => s.isDragging);
  const groupRef = useRef<THREE.Group>(null);
  const [tick, setTick] = useState(0);
  
  // Initialize nodes with deterministic pseudo-random positions and velocities
  const nodes = useMemo<Node[]>(() => {
    return Array.from({ length: NODE_COUNT }, (_, i) => ({
      position: new THREE.Vector3(
        prngCentered(1000 + i * 11.1) * 70,     // Wide spread X
        prngCentered(2000 + i * 17.3) * 35 + 8, // Upper sky Y
        prngCentered(3000 + i * 23.7) * 50 - 25 // Deep depth Z
      ),
      velocity: new THREE.Vector3(
        prngCentered(4000 + i * 29.9) * 0.015,
        prngCentered(5000 + i * 31.7) * 0.012,
        prngCentered(6000 + i * 37.1) * 0.008
      ),
      baseOpacity: prng01(7000 + i * 41.3) * 0.4 + 0.2,
    }));
  }, []);

  // Animate nodes
  useFrame((_, delta) => {
    nodes.forEach(node => {
      // Slow drift
      node.position.add(node.velocity);
      
      // Soft boundary bounce
      if (Math.abs(node.position.x) > 35) node.velocity.x *= -1;
      if (node.position.y > 25 || node.position.y < -5) node.velocity.y *= -1;
      if (Math.abs(node.position.z) > 30) node.velocity.z *= -1;
    });
    
    // Trigger re-render for connections when dragging
    if (isDragging) {
      setTick(t => t + 1);
    }
  });

  // Calculate connections (expensive, only when dragging)
  const connections = useMemo(() => {
    if (!isDragging) return [];
    
    const lines: THREE.Vector3[] = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dist = nodes[i].position.distanceTo(nodes[j].position);
        if (dist < CONNECTION_DIST) {
          lines.push(nodes[i].position.clone(), nodes[j].position.clone());
        }
      }
    }
    return lines;
  }, [isDragging, nodes, tick]);

  // Create line geometry for synapses
  const lineGeometry = useMemo(() => {
    if (connections.length === 0) return null;
    
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(connections.length * 3);
    
    connections.forEach((vec, i) => {
      positions[i * 3] = vec.x;
      positions[i * 3 + 1] = vec.y;
      positions[i * 3 + 2] = vec.z;
    });
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geometry;
  }, [connections]);

  return (
    <group ref={groupRef}>
      {/* THE NODES — Always visible, glow when active */}
      {nodes.map((node, i) => (
        <mesh key={i} position={node.position}>
          <sphereGeometry args={[isDragging ? 0.18 : 0.12, 12, 12]} />
          <meshBasicMaterial 
            color={isDragging ? "#00D9FF" : "#475569"}
            transparent
            opacity={isDragging ? 0.7 : node.baseOpacity}
            toneMapped={false}
          />
        </mesh>
      ))}

      {/* THE SYNAPSES — Neural connections when simulating */}
      {isDragging && lineGeometry && (
        <lineSegments geometry={lineGeometry}>
          <lineBasicMaterial 
            color="#00D9FF"
            transparent
            opacity={0.12}
            toneMapped={false}
          />
        </lineSegments>
      )}
      
      {/* PULSE RINGS — Expanding rings from active nodes when dragging */}
      {isDragging && nodes.slice(0, 5).map((node, i) => (
        <mesh key={`ring-${i}`} position={node.position} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.8 + (tick % 30) * 0.1, 1 + (tick % 30) * 0.1, 24]} />
          <meshBasicMaterial 
            color="#00D9FF"
            transparent
            opacity={Math.max(0, 0.15 - (tick % 30) * 0.005)}
            side={THREE.DoubleSide}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}

export default NeuralBackground;

