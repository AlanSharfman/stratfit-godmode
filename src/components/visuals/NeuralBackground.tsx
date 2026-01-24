// src/components/visuals/NeuralBackground.tsx
// STRATFIT — Neural Constellation Background
// Floating nodes that connect when user is actively simulating

import { useRef, useMemo, useState, useEffect } from 'react';
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

export function NeuralBackground() {
  const isDragging = useUIStore((s) => s.isDragging);
  const groupRef = useRef<THREE.Group>(null);
  const [tick, setTick] = useState(0);
  
  // Initialize nodes with random positions and velocities
  const nodes = useMemo<Node[]>(() => {
    return Array.from({ length: NODE_COUNT }, () => ({
      position: new THREE.Vector3(
        (Math.random() - 0.5) * 70,     // Wide spread X
        (Math.random() - 0.5) * 35 + 8, // Upper sky Y
        (Math.random() - 0.5) * 50 - 25 // Deep depth Z
      ),
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 0.015,
        (Math.random() - 0.5) * 0.012,
        (Math.random() - 0.5) * 0.008
      ),
      baseOpacity: Math.random() * 0.4 + 0.2
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

