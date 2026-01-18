import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Line } from '@react-three/drei';
import * as THREE from 'three';
import './CompareTab.css';

interface CompareTabGodModeProps {
  selectedScenario: string;
  scenarios: any[];
  onScenarioChange?: (scenario: string) => void;
}

const CompareTabGodMode: React.FC<CompareTabGodModeProps> = ({
  selectedScenario,
  scenarios,
  onScenarioChange
}) => {
  const [compareWith, setCompareWith] = useState<string>('stress');
  const [hoveredPanel, setHoveredPanel] = useState<'left' | 'right' | null>(null);
  const [animationPhase, setAnimationPhase] = useState(0);

  // Get scenarios
  const leftScenario = scenarios.find(s => s.name === selectedScenario) || scenarios[0];
  const rightScenario = scenarios.find(s => s.name === compareWith) || scenarios[1];

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationPhase(p => (p + 1) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const handleCompareChange = (newCompare: string) => {
    setCompareWith(newCompare);
  };

  return (
    <div className="compare-tab-container">
      {/* Header Bar */}
      <CompareHeader
        leftScenario={leftScenario}
        rightScenario={rightScenario}
        compareWith={compareWith}
        scenarios={scenarios}
        selectedScenario={selectedScenario}
        onCompareChange={handleCompareChange}
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
          {/* Flowing particles effect */}
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

      {/* Add CSS animations */}
      <style>{`
        @keyframes particleFlow {
          0% {
            top: 0%;
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
          80% {
            opacity: 1;
          }
          100% {
            top: 100%;
            opacity: 0;
          }
        }

        @keyframes fadeInRow {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
};

// Compare Header Component
const CompareHeader: React.FC<any> = ({
  leftScenario,
  rightScenario,
  compareWith,
  scenarios,
  selectedScenario,
  onCompareChange
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
          Scenario Comparison
        </h2>
        <p style={{
          color: 'rgba(255, 255, 255, 0.5)',
          fontSize: '12px',
          margin: 0
        }}>
          Compare strategic paths and understand the implications of your decisions
        </p>
      </div>

      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          background: `${leftScenario.color}15`,
          border: `1px solid ${leftScenario.color}40`,
          borderRadius: '6px'
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: leftScenario.color,
            boxShadow: `0 0 10px ${leftScenario.color}`
          }} />
          <span style={{ color: leftScenario.color, fontSize: '13px', fontWeight: '600' }}>
            {leftScenario.name.toUpperCase()}
          </span>
        </div>

        <div style={{
          color: 'rgba(255, 255, 255, 0.4)',
          fontSize: '14px',
          fontWeight: '300'
        }}>
          VS
        </div>

        <select
          value={compareWith}
          onChange={(e) => onCompareChange(e.target.value)}
          className="scenario-selector"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            background: `${rightScenario.color}15`,
            border: `1px solid ${rightScenario.color}40`,
            borderRadius: '6px',
            color: rightScenario.color,
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          {scenarios
            .filter((s: any) => s.name !== selectedScenario)
            .map((s: any) => (
              <option key={s.name} value={s.name}>
                {s.name.toUpperCase()}
              </option>
            ))}
        </select>
      </div>
    </div>
  );
};

// Mountain Panel Component
const MountainPanel: React.FC<any> = ({
  scenario,
  position,
  isHovered,
  onHover,
  onLeave,
  animationPhase
}) => {
  const colorMap: any = {
    growth: '#00ff9d',
    base: '#00d4ff',
    stress: '#ff4757',
    survival: '#ffa502'
  };

  const color = colorMap[scenario.name] || '#00d4ff';

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
      {/* Scenario Info Header */}
      <div
        className="scenario-header"
        style={{
          padding: '24px 32px',
          background: `linear-gradient(135deg, ${color}12 0%, transparent 100%)`,
          borderBottom: `2px solid ${color}30`,
          position: 'relative',
          zIndex: 5
        }}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '20px'
        }}>
          <div>
            <h3 style={{
              color: color,
              fontSize: '14px',
              fontWeight: '700',
              letterSpacing: '0.15em',
              margin: '0 0 12px 0',
              textTransform: 'uppercase',
              textShadow: `0 0 15px ${color}60`
            }}>
              {scenario.name === 'growth' && 'GROWTH SCENARIO'}
              {scenario.name === 'base' && 'BASE CASE'}
              {scenario.name === 'stress' && 'STRESS SCENARIO'}
              {scenario.name === 'survival' && 'SURVIVAL MODE'}
            </h3>

            <div style={{ display: 'flex', gap: '32px', marginTop: '12px' }}>
              <div>
                <div style={{
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontSize: '10px',
                  marginBottom: '4px',
                  letterSpacing: '0.05em'
                }}>
                  CASH
                </div>
                <div style={{
                  color: '#fff',
                  fontSize: '22px',
                  fontWeight: '700',
                  textShadow: `0 0 10px ${color}40`
                }}>
                  ${(scenario.cash / 1000000).toFixed(2)}M
                </div>
              </div>

              <div>
                <div style={{
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontSize: '10px',
                  marginBottom: '4px',
                  letterSpacing: '0.05em'
                }}>
                  RUNWAY
                </div>
                <div style={{
                  color: '#fff',
                  fontSize: '22px',
                  fontWeight: '700',
                  textShadow: `0 0 10px ${color}40`
                }}>
                  {scenario.runway}mo
                </div>
              </div>

              <div>
                <div style={{
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontSize: '10px',
                  marginBottom: '4px',
                  letterSpacing: '0.05em'
                }}>
                  TRAJECTORY
                </div>
                <div style={{
                  color: color,
                  fontSize: '14px',
                  fontWeight: '700',
                  textTransform: 'uppercase'
                }}>
                  {scenario.trajectory}
                </div>
              </div>
            </div>
          </div>

          <div className="scenario-badge" style={{
            padding: '8px 16px',
            background: `${color}20`,
            border: `1px solid ${color}`,
            borderRadius: '6px',
            color: color,
            fontSize: '11px',
            fontWeight: '700',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            boxShadow: `0 0 15px ${color}40`
          }}>
            {scenario.risk}
          </div>
        </div>

        {/* Metric Bars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
          {Object.entries(scenario.metrics).map(([key, value]: [string, any]) => (
            <MetricBar
              key={key}
              label={key
                .replace(/([A-Z])/g, ' $1')
                .replace(/^./, str => str.toUpperCase())}
              value={value}
              color={color}
              inverted={key === 'customerChurn'}
            />
          ))}
        </div>
      </div>

      {/* 3D Mountain Canvas */}
      <div className="mountain-canvas" style={{
        flex: 1,
        position: 'relative',
        minHeight: '450px',
        color: color
      }}>
        <Canvas style={{ background: 'transparent' }}>
          <PerspectiveCamera makeDefault position={[0, 4, 10]} />
          <OrbitControls
            enableZoom={true}
            enablePan={false}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI / 2.3}
            minDistance={7}
            maxDistance={18}
            autoRotate={isHovered}
            autoRotateSpeed={0.5}
          />

          <ambientLight intensity={0.3} />
          <pointLight
            position={[10, 15, 10]}
            intensity={1.2}
            color={color}
            distance={50}
          />
          <pointLight
            position={[-10, 10, -10]}
            intensity={0.6}
            color="#0066cc"
          />
          <spotLight
            position={[0, 20, 0]}
            angle={0.3}
            penumbra={1}
            intensity={0.5}
            color={color}
            castShadow
          />

          <TerrainMountain
            color={color}
            heightScale={scenario.cash / 1500000}
            complexity={scenario.runway}
            animationPhase={animationPhase}
          />

          {/* Enhanced grid */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
            <planeGeometry args={[25, 25, 30, 30]} />
            <meshBasicMaterial
              color={color}
              wireframe
              opacity={0.1}
              transparent
            />
          </mesh>
        </Canvas>
      </div>
    </div>
  );
};

// Enhanced 3D Terrain Mountain
const TerrainMountain: React.FC<any> = ({
  color,
  heightScale,
  complexity,
  animationPhase
}) => {
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
        
        // Multi-layered terrain generation
        const primaryWave = Math.sin(distance * 0.4) * 2.5;
        const secondaryWave = Math.sin(distance * 0.7 + Math.PI / 3) * 1.8;
        const tertiaryWave = Math.cos(x * 0.4) * Math.sin(y * 0.4) * 1.2;
        const detailNoise = Math.sin(x * 1.2) * Math.cos(y * 1.2) * 0.5;

        // Radial falloff
        const falloff = Math.max(0, 1 - distance / 12);
        
        const height = (primaryWave + secondaryWave + tertiaryWave + detailNoise) 
                      * heightScale 
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

// Metric Bar Component
const MetricBar: React.FC<any> = ({ label, value, color, inverted = false }) => {
  const displayValue = inverted ? 100 - value : value;
  const barColor = inverted && value > 60 ? '#ff4757' : color;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div style={{
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: '11px',
        width: '140px',
        flexShrink: 0,
        textTransform: 'uppercase',
        letterSpacing: '0.03em'
      }}>
        {label}
      </div>

      <div className="metric-bar" style={{
        flex: 1,
        height: '6px',
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderRadius: '3px',
        overflow: 'hidden',
        position: 'relative'
      }}>
        <div className="metric-bar-fill" style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: `${displayValue}%`,
          background: `linear-gradient(90deg, ${barColor} 0%, ${barColor}CC 100%)`,
          borderRadius: '3px',
          boxShadow: `0 0 12px ${barColor}70`,
          transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
        }} />
      </div>

      <div style={{
        color: barColor,
        fontSize: '13px',
        fontWeight: '700',
        width: '40px',
        textAlign: 'right',
        textShadow: `0 0 8px ${barColor}60`
      }}>
        {Math.round(value)}%
      </div>
    </div>
  );
};

// Comparison Matrix Component
const ComparisonMatrix: React.FC<any> = ({ leftScenario, rightScenario }) => {
  const metrics = [
    {
      label: 'Cash Flow',
      leftValue: `$${(leftScenario.cash / 1000000).toFixed(2)}M`,
      rightValue: `$${(rightScenario.cash / 1000000).toFixed(2)}M`,
      delta: leftScenario.cash - rightScenario.cash,
      format: (v: number) => `$${(Math.abs(v) / 1000000).toFixed(2)}M`
    },
    {
      label: 'Runway',
      leftValue: `${leftScenario.runway}mo`,
      rightValue: `${rightScenario.runway}mo`,
      delta: leftScenario.runway - rightScenario.runway,
      format: (v: number) => `${Math.abs(v)}mo`
    },
    {
      label: 'Burn Rate',
      leftValue: `$${((leftScenario.cash / leftScenario.runway) / 1000).toFixed(0)}K/mo`,
      rightValue: `$${((rightScenario.cash / rightScenario.runway) / 1000).toFixed(0)}K/mo`,
      delta: (rightScenario.cash / rightScenario.runway) - (leftScenario.cash / leftScenario.runway),
      format: (v: number) => `$${(Math.abs(v) / 1000).toFixed(0)}K/mo`,
      inverted: true
    }
  ];

  const colorMap: any = {
    growth: '#00ff9d',
    base: '#00d4ff',
    stress: '#ff4757',
    survival: '#ffa502'
  };

  const leftColor = colorMap[leftScenario.name] || '#00d4ff';
  const rightColor = colorMap[rightScenario.name] || '#00d4ff';

  return (
    <div className="comparison-table" style={{
      padding: '28px 32px',
      background: 'linear-gradient(135deg, rgba(13, 17, 23, 0.98) 0%, rgba(10, 14, 26, 0.95) 100%)',
      borderTop: '1px solid rgba(0, 212, 255, 0.2)',
      backdropFilter: 'blur(10px)'
    }}>
      <h3 style={{
        color: '#00d4ff',
        fontSize: '13px',
        fontWeight: '600',
        letterSpacing: '0.1em',
        marginBottom: '20px',
        textTransform: 'uppercase',
        textShadow: '0 0 15px rgba(0, 212, 255, 0.4)'
      }}>
        Key Metrics Comparison
      </h3>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '160px 1fr 140px 1fr',
        gap: '16px 20px',
        alignItems: 'center'
      }}>
        {metrics.map((metric, index) => {
          const isPositive = metric.inverted ? metric.delta < 0 : metric.delta > 0;
          const deltaColor = isPositive ? '#00ff9d' : '#ff4757';

          return (
            <React.Fragment key={index}>
              <div style={{
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '13px',
                fontWeight: '500'
              }}>
                {metric.label}
              </div>

              <div style={{
                color: leftColor,
                fontSize: '16px',
                fontWeight: '700',
                textAlign: 'right',
                textShadow: `0 0 10px ${leftColor}50`
              }}>
                {metric.leftValue}
              </div>

              <div className="delta-indicator" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '6px 12px',
                background: `${deltaColor}15`,
                border: `1px solid ${deltaColor}40`,
                borderRadius: '16px',
                color: deltaColor,
                fontSize: '12px',
                fontWeight: '700',
                boxShadow: `0 0 15px ${deltaColor}25`
              }}>
                <span style={{ fontSize: '10px' }}>
                  {isPositive ? '▲' : '▼'}
                </span>
                {metric.format(metric.delta)}
              </div>

              <div style={{
                color: rightColor,
                fontSize: '16px',
                fontWeight: '700',
                textAlign: 'left',
                textShadow: `0 0 10px ${rightColor}50`
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

