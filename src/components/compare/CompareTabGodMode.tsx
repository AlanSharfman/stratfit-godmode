// src/components/compare/CompareTabGodMode.tsx
// STRATFIT - Compare Mode with 4 Strategy-Based Situations

import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Line } from '@react-three/drei';
import * as THREE from 'three';
import './CompareTab.css';

// Import the 4 situations
import { COMPARE_SCENARIOS, type CompareScenario } from '@/data/compareScenarios';

interface CompareTabGodModeProps {
  selectedScenario?: string;
  scenarios?: CompareScenario[];
  onScenarioChange?: (scenario: string) => void;
}

const CompareTabGodMode: React.FC<CompareTabGodModeProps> = ({
  selectedScenario = 'current-trajectory',
  scenarios = COMPARE_SCENARIOS,
  onScenarioChange
}) => {
  // Default: Baseline vs Series B
  const [leftId, setLeftId] = useState<string>('current-trajectory');
  const [rightId, setRightId] = useState<string>('series-b');
  const [hoveredPanel, setHoveredPanel] = useState<'left' | 'right' | null>(null);
  const [animationPhase, setAnimationPhase] = useState(0);

  // Get scenarios by ID
  const leftScenario = scenarios.find(s => s.id === leftId) || scenarios[0];
  const rightScenario = scenarios.find(s => s.id === rightId) || scenarios[1];

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationPhase(p => (p + 1) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const handleLeftChange = (newId: string) => {
    setLeftId(newId);
    // If same as right, swap
    if (newId === rightId) {
      setRightId(leftId);
    }
  };

  const handleRightChange = (newId: string) => {
    setRightId(newId);
    // If same as left, swap
    if (newId === leftId) {
      setLeftId(rightId);
    }
  };

  return (
    <div className="compare-tab-container">
      {/* Header Bar */}
      <CompareHeader
        leftScenario={leftScenario}
        rightScenario={rightScenario}
        scenarios={scenarios}
        onLeftChange={handleLeftChange}
        onRightChange={handleRightChange}
      />

      {/* Main Split View */}
      <div style={{
        flex: 1,
        display: 'flex',
        gap: '2px',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* Left Panel */}
        <MountainPanel
          scenario={leftScenario}
          position="left"
          isHovered={hoveredPanel === 'left'}
          onHover={() => setHoveredPanel('left')}
          onLeave={() => setHoveredPanel(null)}
          animationPhase={animationPhase}
        />

        {/* Animated Divider */}
        <div className="scenario-divider" style={{
          position: 'relative',
          animation: 'dividerPulse 3s ease-in-out infinite'
        }}>
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: '50%',
                width: '4px',
                height: '4px',
                borderRadius: '50%',
                backgroundColor: '#00d4ff',
                boxShadow: '0 0 10px #00d4ff',
                animation: `particleFlow 3s ease-in-out infinite ${i * 0.6}s`,
                opacity: 0
              }}
            />
          ))}
        </div>

        {/* Right Panel */}
        <MountainPanel
          scenario={rightScenario}
          position="right"
          isHovered={hoveredPanel === 'right'}
          onHover={() => setHoveredPanel('right')}
          onLeave={() => setHoveredPanel(null)}
          animationPhase={animationPhase}
        />
      </div>

      {/* Bottom Comparison Matrix */}
      <ComparisonMatrix
        leftScenario={leftScenario}
        rightScenario={rightScenario}
      />

      {/* CSS animations */}
      <style>{`
        @keyframes particleFlow {
          0% { top: 0%; opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes fadeInRow {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};

// ============================================
// COMPARE HEADER - Both dropdowns
// ============================================
const CompareHeader: React.FC<{
  leftScenario: CompareScenario;
  rightScenario: CompareScenario;
  scenarios: CompareScenario[];
  onLeftChange: (id: string) => void;
  onRightChange: (id: string) => void;
}> = ({
  leftScenario,
  rightScenario,
  scenarios,
  onLeftChange,
  onRightChange
}) => {
  return (
    <div style={{
      padding: '20px 32px',
      background: 'linear-gradient(135deg, rgba(10, 14, 26, 0.95) 0%, rgba(13, 17, 23, 0.98) 100%)',
      borderBottom: '1px solid rgba(0, 212, 255, 0.2)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      position: 'relative',
      zIndex: 10
    }}>
      <div>
        <h2 style={{
          color: '#00d4ff',
          fontSize: '16px',
          fontWeight: '600',
          letterSpacing: '0.1em',
          margin: '0 0 4px 0',
          textTransform: 'uppercase',
          textShadow: '0 0 20px rgba(0, 212, 255, 0.4)'
        }}>
          Strategy Comparison
        </h2>
        <p style={{
          color: 'rgba(255, 255, 255, 0.5)',
          fontSize: '12px',
          margin: 0
        }}>
          Compare strategic paths side-by-side
        </p>
      </div>

      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        {/* LEFT DROPDOWN */}
        <select
          value={leftScenario.id}
          onChange={(e) => onLeftChange(e.target.value)}
          style={{
            padding: '10px 16px',
            background: `${leftScenario.color}15`,
            border: `1px solid ${leftScenario.color}60`,
            borderRadius: '6px',
            color: leftScenario.color,
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            minWidth: '180px'
          }}
        >
          {scenarios.map((s) => (
            <option key={s.id} value={s.id} style={{ background: '#0a0e1a', color: '#fff' }}>
              {s.name}
            </option>
          ))}
        </select>

        <div style={{
          color: 'rgba(255, 255, 255, 0.4)',
          fontSize: '14px',
          fontWeight: '600',
          padding: '0 8px'
        }}>
          VS
        </div>

        {/* RIGHT DROPDOWN */}
        <select
          value={rightScenario.id}
          onChange={(e) => onRightChange(e.target.value)}
          style={{
            padding: '10px 16px',
            background: `${rightScenario.color}15`,
            border: `1px solid ${rightScenario.color}60`,
            borderRadius: '6px',
            color: rightScenario.color,
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            minWidth: '180px'
          }}
        >
          {scenarios.map((s) => (
            <option key={s.id} value={s.id} style={{ background: '#0a0e1a', color: '#fff' }}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

// ============================================
// MOUNTAIN PANEL - 3D Terrain
// ============================================
const MountainPanel: React.FC<{
  scenario: CompareScenario;
  position: 'left' | 'right';
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
  animationPhase: number;
}> = ({
  scenario,
  position,
  isHovered,
  onHover,
  onLeave,
  animationPhase
}) => {
  const color = scenario.color || '#00d4ff';

  return (
    <div
      className="mountain-panel"
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        background: isHovered
          ? `radial-gradient(circle at ${position === 'left' ? 'right' : 'left'}, ${color}10 0%, #0a0e1a 50%)`
          : '#0a0e1a',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'hidden'
      }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      {/* Scenario Label */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: position === 'left' ? '20px' : 'auto',
        right: position === 'right' ? '20px' : 'auto',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <div style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: color,
            boxShadow: `0 0 15px ${color}`,
            animation: 'pulse 2s ease-in-out infinite'
          }} />
          <span style={{
            color: color,
            fontSize: '15px',
            fontWeight: '700',
            letterSpacing: '0.05em',
            textShadow: `0 0 20px ${color}50`
          }}>
            {scenario.name}
          </span>
        </div>
        <span style={{
          color: 'rgba(255,255,255,0.5)',
          fontSize: '11px',
          paddingLeft: '22px'
        }}>
          {scenario.description}
        </span>
      </div>

      {/* Key Metrics */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: position === 'left' ? '20px' : 'auto',
        right: position === 'right' ? '20px' : 'auto',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        background: 'rgba(0,0,0,0.4)',
        padding: '16px',
        borderRadius: '8px',
        border: `1px solid ${color}30`
      }}>
        <MetricRow label="Success Rate" value={`${scenario.metrics.successRate}%`} color={color} />
        <MetricRow label="Exit Value" value={`$${scenario.metrics.exitValue}M`} color={color} />
        <MetricRow label="Runway" value={`${scenario.runway} mo`} color={color} />
        <MetricRow label="Cash" value={`$${(scenario.cash / 1000000).toFixed(1)}M`} color={color} />
      </div>

      {/* 3D Canvas */}
      <div style={{ flex: 1 }}>
        <Canvas>
          <PerspectiveCamera makeDefault position={[0, 8, 12]} fov={45} />
          <OrbitControls
            enablePan={false}
            enableZoom={false}
            maxPolarAngle={Math.PI / 2.2}
            minPolarAngle={Math.PI / 4}
          />
          <ambientLight intensity={0.3} />
          <directionalLight position={[5, 10, 5]} intensity={0.8} color={color} />
          <hemisphereLight intensity={0.4} groundColor="#0a0e1a" />

          <TerrainMountain
            color={color}
            heightScale={scenario.cash / 15000000}
            complexity={scenario.runway}
            animationPhase={animationPhase}
          />

          {/* Grid */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
            <planeGeometry args={[25, 25, 30, 30]} />
            <meshBasicMaterial color={color} wireframe opacity={0.1} transparent />
          </mesh>
        </Canvas>
      </div>
    </div>
  );
};

// Metric Row Helper
const MetricRow: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '24px' }}>
    <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '11px' }}>{label}</span>
    <span style={{ color: color, fontSize: '13px', fontWeight: '700' }}>{value}</span>
  </div>
);

// ============================================
// TERRAIN MOUNTAIN - 3D Mesh
// ============================================
const TerrainMountain: React.FC<{
  color: string;
  heightScale: number;
  complexity: number;
  animationPhase: number;
}> = ({ color, heightScale, complexity, animationPhase }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);

  useEffect(() => {
    if (meshRef.current) {
      const geometry = meshRef.current.geometry as THREE.PlaneGeometry;
      const positions = geometry.attributes.position.array;

      for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i];
        const y = positions[i + 1];
        const distance = Math.sqrt(x * x + y * y);

        const primaryWave = Math.sin(distance * 0.4) * 2.5;
        const secondaryWave = Math.sin(distance * 0.7 + Math.PI / 3) * 1.8;
        const tertiaryWave = Math.cos(x * 0.4) * Math.sin(y * 0.4) * 1.2;
        const detailNoise = Math.sin(x * 1.2) * Math.cos(y * 1.2) * 0.5;

        const falloff = Math.max(0, 1 - distance / 12);
        const height = (primaryWave + secondaryWave + tertiaryWave + detailNoise)
          * Math.max(0.3, heightScale)
          * falloff
          * (complexity / 15);

        positions[i + 2] = Math.max(0, height);
      }

      geometry.attributes.position.needsUpdate = true;
      geometry.computeVertexNormals();
    }
  }, [heightScale, complexity]);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.emissiveIntensity = 0.15 + Math.sin(state.clock.elapsedTime) * 0.1;
    }
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <planeGeometry args={[15, 15, 80, 80]} />
      <meshStandardMaterial
        ref={materialRef}
        color={color}
        wireframe
        opacity={0.85}
        transparent
        emissive={color}
        emissiveIntensity={0.15}
      />
    </mesh>
  );
};

// ============================================
// COMPARISON MATRIX - Bottom metrics
// ============================================
const ComparisonMatrix: React.FC<{
  leftScenario: CompareScenario;
  rightScenario: CompareScenario;
}> = ({ leftScenario, rightScenario }) => {
  const metrics = [
    {
      label: 'Success Rate',
      leftValue: `${leftScenario.metrics.successRate}%`,
      rightValue: `${rightScenario.metrics.successRate}%`,
      delta: leftScenario.metrics.successRate - rightScenario.metrics.successRate,
      format: (v: number) => `${Math.abs(v)}%`
    },
    {
      label: 'Exit Value',
      leftValue: `$${leftScenario.metrics.exitValue}M`,
      rightValue: `$${rightScenario.metrics.exitValue}M`,
      delta: leftScenario.metrics.exitValue - rightScenario.metrics.exitValue,
      format: (v: number) => `$${Math.abs(v)}M`
    },
    {
      label: 'Runway',
      leftValue: `${leftScenario.runway}mo`,
      rightValue: `${rightScenario.runway}mo`,
      delta: leftScenario.runway - rightScenario.runway,
      format: (v: number) => `${Math.abs(v)}mo`
    },
    {
      label: 'Cash Position',
      leftValue: `$${(leftScenario.cash / 1000000).toFixed(1)}M`,
      rightValue: `$${(rightScenario.cash / 1000000).toFixed(1)}M`,
      delta: leftScenario.cash - rightScenario.cash,
      format: (v: number) => `$${(Math.abs(v) / 1000000).toFixed(1)}M`
    }
  ];

  const leftColor = leftScenario.color;
  const rightColor = rightScenario.color;

  return (
    <div style={{
      padding: '24px 32px',
      background: 'linear-gradient(135deg, rgba(13, 17, 23, 0.98) 0%, rgba(10, 14, 26, 0.95) 100%)',
      borderTop: '1px solid rgba(0, 212, 255, 0.2)'
    }}>
      <h3 style={{
        color: '#00d4ff',
        fontSize: '12px',
        fontWeight: '600',
        letterSpacing: '0.1em',
        marginBottom: '16px',
        textTransform: 'uppercase'
      }}>
        Key Metrics Comparison
      </h3>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '140px 1fr 100px 1fr',
        gap: '12px 20px',
        alignItems: 'center'
      }}>
        {metrics.map((metric, index) => {
          const isPositive = metric.delta > 0;
          const deltaColor = isPositive ? '#00ff9d' : '#ff4757';

          return (
            <React.Fragment key={index}>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>
                {metric.label}
              </div>
              <div style={{
                color: leftColor,
                fontSize: '15px',
                fontWeight: '700',
                textAlign: 'right'
              }}>
                {metric.leftValue}
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                padding: '4px 10px',
                background: `${deltaColor}15`,
                border: `1px solid ${deltaColor}40`,
                borderRadius: '12px',
                color: deltaColor,
                fontSize: '11px',
                fontWeight: '700'
              }}>
                <span>{isPositive ? '▲' : '▼'}</span>
                {metric.format(metric.delta)}
              </div>
              <div style={{
                color: rightColor,
                fontSize: '15px',
                fontWeight: '700',
                textAlign: 'left'
              }}>
                {metric.rightValue}
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default CompareTabGodMode;
