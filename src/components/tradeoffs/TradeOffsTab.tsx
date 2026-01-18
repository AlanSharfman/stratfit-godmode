import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import './TradeOffsTab.css';

interface TradeOffSlider {
  id: string;
  leftLabel: string;
  rightLabel: string;
  leftDescription: string;
  rightDescription: string;
  value: number; // -100 to 100, 0 is center
  impact: {
    cash: number;
    runway: number;
    risk: number;
    growth: number;
  };
}

interface TradeOffsTabProps {
  onScenarioUpdate?: (scenario: any) => void;
  baseScenario: any;
}

const TradeOffsTab: React.FC<TradeOffsTabProps> = ({ onScenarioUpdate, baseScenario }) => {
  const [tradeOffs, setTradeOffs] = useState<TradeOffSlider[]>([
    {
      id: 'growth-sustainability',
      leftLabel: 'Growth',
      rightLabel: 'Sustainability',
      leftDescription: 'Aggressive expansion, higher burn rate, market dominance',
      rightDescription: 'Profitable growth, capital efficiency, long-term stability',
      value: 0,
      impact: { cash: -15, runway: -8, risk: 12, growth: 25 }
    },
    {
      id: 'efficiency-scale',
      leftLabel: 'Efficiency',
      rightLabel: 'Scale',
      leftDescription: 'Lean operations, optimize existing, reduce complexity',
      rightDescription: 'Market expansion, new verticals, geographic reach',
      value: 0,
      impact: { cash: 10, runway: 15, risk: -5, growth: -10 }
    },
    {
      id: 'speed-quality',
      leftLabel: 'Speed',
      rightLabel: 'Quality',
      leftDescription: 'Fast iteration, quick wins, move fast and break things',
      rightDescription: 'Enterprise-grade, technical debt reduction, robustness',
      value: 0,
      impact: { cash: -5, runway: 5, risk: 8, growth: 15 }
    },
    {
      id: 'innovation-execution',
      leftLabel: 'Innovation',
      rightLabel: 'Execution',
      leftDescription: 'New products, R&D investment, future positioning',
      rightDescription: 'Core business focus, operational excellence, proven models',
      value: 0,
      impact: { cash: -12, runway: -5, risk: 15, growth: 20 }
    }
  ]);

  const [hoveredSlider, setHoveredSlider] = useState<string | null>(null);
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);
  const [calculatedMetrics, setCalculatedMetrics] = useState({
    cash: baseScenario.cash,
    runway: baseScenario.runway,
    risk: 50,
    growth: 50,
    heightScale: 1.5,
    complexity: 1.0
  });

  // Calculate metrics based on trade-off positions
  useEffect(() => {
    let cashModifier = 100;
    let runwayModifier = 100;
    let riskScore = 50;
    let growthScore = 50;

    tradeOffs.forEach(tradeOff => {
      const intensity = Math.abs(tradeOff.value) / 100;
      const direction = tradeOff.value > 0 ? 1 : -1;

      cashModifier += (tradeOff.impact.cash * intensity * direction);
      runwayModifier += (tradeOff.impact.runway * intensity * direction);
      riskScore += (tradeOff.impact.risk * intensity * direction);
      growthScore += (tradeOff.impact.growth * intensity * direction);
    });

    const newCash = baseScenario.cash * (cashModifier / 100);
    const newRunway = baseScenario.runway * (runwayModifier / 100);
    
    setCalculatedMetrics({
      cash: newCash,
      runway: Math.max(3, newRunway),
      risk: Math.max(0, Math.min(100, riskScore)),
      growth: Math.max(0, Math.min(100, growthScore)),
      heightScale: (newCash / baseScenario.cash) * 1.5,
      complexity: (newRunway / baseScenario.runway) * 1.0
    });

    if (onScenarioUpdate) {
      onScenarioUpdate({
        cash: newCash,
        runway: Math.max(3, newRunway),
        risk: Math.max(0, Math.min(100, riskScore)),
        growth: Math.max(0, Math.min(100, growthScore))
      });
    }
  }, [tradeOffs, baseScenario, onScenarioUpdate]);

  const handleSliderChange = (id: string, value: number) => {
    setTradeOffs(prev =>
      prev.map(t => (t.id === id ? { ...t, value } : t))
    );
    setActiveTemplate(null); // Clear template when manually adjusting
  };

  const applyTemplate = (template: string) => {
    setActiveTemplate(template);
    
    const templates: { [key: string]: { [key: string]: number } } = {
      'aggressive-growth': {
        'growth-sustainability': -80,
        'efficiency-scale': 60,
        'speed-quality': -70,
        'innovation-execution': -60
      },
      'conservative-scale': {
        'growth-sustainability': 70,
        'efficiency-scale': -50,
        'speed-quality': 50,
        'innovation-execution': 60
      },
      'blitzscale': {
        'growth-sustainability': -100,
        'efficiency-scale': 80,
        'speed-quality': -90,
        'innovation-execution': -40
      },
      'profitable-growth': {
        'growth-sustainability': 40,
        'efficiency-scale': -30,
        'speed-quality': 20,
        'innovation-execution': 30
      }
    };

    const templateValues = templates[template];
    if (templateValues) {
      setTradeOffs(prev =>
        prev.map(t => ({
          ...t,
          value: templateValues[t.id] || 0
        }))
      );
    }
  };

  const resetSliders = () => {
    setTradeOffs(prev => prev.map(t => ({ ...t, value: 0 })));
    setActiveTemplate(null);
  };

  return (
    <div className="tradeoffs-container" style={{
      display: 'flex',
      flexDirection: 'column'
    }}>

      {/* Header */}
      <div style={{
        padding: '20px 32px',
        background: 'linear-gradient(135deg, rgba(10, 14, 26, 0.95) 0%, rgba(13, 17, 23, 0.98) 100%)',
        borderBottom: '1px solid rgba(0, 212, 255, 0.2)',
        zIndex: 10,
        position: 'relative'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
              Strategic Trade-offs
            </h2>
            <p style={{
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: '12px',
              margin: 0
            }}>
              Adjust strategic priorities and watch your business terrain transform in real-time
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
              onClick={resetSliders}
              style={{
                padding: '8px 16px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '6px',
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
              }}
            >
              Reset All
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', gap: '24px', padding: '24px 32px', position: 'relative', zIndex: 1 }}>
        {/* Left Side - Sliders and Controls */}
        <div style={{ flex: '0 0 480px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Strategy Templates */}
          <div>
            <h3 style={{
              color: '#00d4ff',
              fontSize: '13px',
              fontWeight: '600',
              letterSpacing: '0.05em',
              marginBottom: '12px',
              textTransform: 'uppercase'
            }}>
              Strategy Templates
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {[
                { id: 'aggressive-growth', label: 'Aggressive Growth', color: '#00ff9d' },
                { id: 'blitzscale', label: 'Blitzscale', color: '#ff4757' },
                { id: 'profitable-growth', label: 'Profitable Growth', color: '#00d4ff' },
                { id: 'conservative-scale', label: 'Conservative', color: '#ffa502' }
              ].map(template => (
                <button
                  key={template.id}
                  onClick={() => applyTemplate(template.id)}
                  className="template-button"
                  style={{
                    padding: '12px',
                    background: activeTemplate === template.id
                      ? `${template.color}20`
                      : 'rgba(255, 255, 255, 0.03)',
                    border: activeTemplate === template.id
                      ? `1px solid ${template.color}`
                      : '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: activeTemplate === template.id ? template.color : 'rgba(255, 255, 255, 0.7)',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    textAlign: 'center',
                    boxShadow: activeTemplate === template.id ? `0 0 15px ${template.color}30` : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (activeTemplate !== template.id) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTemplate !== template.id) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    }
                  }}
                >
                  {template.label}
                </button>
              ))}
            </div>
          </div>

          {/* Trade-off Sliders */}
          <div className="slider-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto', paddingRight: '8px' }}>
            {tradeOffs.map((tradeOff) => (
              <TradeOffSliderComponent
                key={tradeOff.id}
                tradeOff={tradeOff}
                isHovered={hoveredSlider === tradeOff.id}
                onHover={() => setHoveredSlider(tradeOff.id)}
                onLeave={() => setHoveredSlider(null)}
                onChange={(value) => handleSliderChange(tradeOff.id, value)}
              />
            ))}
          </div>

          {/* Calculated Metrics Display */}
          <MetricsDisplay metrics={calculatedMetrics} baseScenario={baseScenario} />
        </div>

        {/* Right Side - 3D Mountain Visualization */}
        <div style={{ flex: 1, position: 'relative', borderRadius: '12px', overflow: 'hidden' }}>
          <Canvas style={{ background: 'transparent' }}>
            <PerspectiveCamera makeDefault position={[0, 4, 10]} />
            <OrbitControls
              enableZoom={true}
              enablePan={false}
              minPolarAngle={Math.PI / 6}
              maxPolarAngle={Math.PI / 2.3}
              minDistance={7}
              maxDistance={18}
              autoRotate={true}
              autoRotateSpeed={0.5}
            />

            <ambientLight intensity={0.4} />
            <pointLight position={[10, 15, 10]} intensity={1.2} color="#00d4ff" />
            <pointLight position={[-10, 10, -10]} intensity={0.6} color="#0066cc" />
            <spotLight
              position={[0, 20, 0]}
              angle={0.3}
              penumbra={1}
              intensity={0.5}
              color="#00d4ff"
            />

            <DynamicTerrainMountain
              heightScale={calculatedMetrics.heightScale}
              complexity={calculatedMetrics.complexity}
              riskLevel={calculatedMetrics.risk}
              growthLevel={calculatedMetrics.growth}
            />

            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
              <planeGeometry args={[25, 25, 30, 30]} />
              <meshBasicMaterial color="#00d4ff" wireframe opacity={0.1} transparent />
            </mesh>
          </Canvas>

          {/* Overlay metrics on mountain */}
          <div className="mountain-metrics-overlay" style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'rgba(10, 14, 26, 0.9)',
            border: '1px solid rgba(0, 212, 255, 0.3)',
            borderRadius: '12px',
            padding: '16px',
            minWidth: '200px'
          }}>
            <div style={{ marginBottom: '12px' }}>
              <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '10px', marginBottom: '4px' }}>
                PROJECTED CASH
              </div>
              <div style={{ color: '#00ff9d', fontSize: '20px', fontWeight: '700' }}>
                ${(calculatedMetrics.cash / 1000000).toFixed(2)}M
              </div>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '10px', marginBottom: '4px' }}>
                PROJECTED RUNWAY
              </div>
              <div style={{ color: '#00d4ff', fontSize: '20px', fontWeight: '700' }}>
                {Math.round(calculatedMetrics.runway)}mo
              </div>
            </div>
            <div>
              <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '10px', marginBottom: '4px' }}>
                RISK LEVEL
              </div>
              <div style={{
                color: calculatedMetrics.risk > 70 ? '#ff4757' : calculatedMetrics.risk > 40 ? '#ffa502' : '#00ff9d',
                fontSize: '20px',
                fontWeight: '700'
              }}>
                {calculatedMetrics.risk > 70 ? 'HIGH' : calculatedMetrics.risk > 40 ? 'MEDIUM' : 'LOW'}
              </div>
            </div>
          </div>

          {/* Bottom glow effect */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '200px',
            background: 'linear-gradient(to top, rgba(0, 212, 255, 0.1), transparent)',
            pointerEvents: 'none'
          }} />
        </div>
      </div>
    </div>
  );
};

// Individual Trade-off Slider Component
const TradeOffSliderComponent: React.FC<{
  tradeOff: TradeOffSlider;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
  onChange: (value: number) => void;
}> = ({ tradeOff, isHovered, onHover, onLeave, onChange }) => {
  const getColor = () => {
    if (tradeOff.value < -20) return '#ff4757'; // Left side (more aggressive)
    if (tradeOff.value > 20) return '#00ff9d'; // Right side (more conservative)
    return '#00d4ff'; // Center (balanced)
  };

  const color = getColor();

  return (
    <div
      className="slider-container"
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      style={{
        padding: '20px',
        background: isHovered
          ? 'rgba(0, 212, 255, 0.08)'
          : 'rgba(255, 255, 255, 0.02)',
        border: isHovered
          ? '1px solid rgba(0, 212, 255, 0.3)'
          : '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        cursor: 'pointer'
      }}
    >
      {/* Labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ flex: 1, textAlign: 'left' }}>
          <div style={{
            color: tradeOff.value < 0 ? '#ff4757' : 'rgba(255, 255, 255, 0.6)',
            fontSize: '13px',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            transition: 'color 0.3s ease'
          }}>
            {tradeOff.leftLabel}
          </div>
          <div style={{
            color: 'rgba(255, 255, 255, 0.4)',
            fontSize: '10px',
            marginTop: '4px',
            maxWidth: '180px'
          }}>
            {tradeOff.leftDescription}
          </div>
        </div>

        <div style={{ flex: 1, textAlign: 'right' }}>
          <div style={{
            color: tradeOff.value > 0 ? '#00ff9d' : 'rgba(255, 255, 255, 0.6)',
            fontSize: '13px',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            transition: 'color 0.3s ease'
          }}>
            {tradeOff.rightLabel}
          </div>
          <div style={{
            color: 'rgba(255, 255, 255, 0.4)',
            fontSize: '10px',
            marginTop: '4px',
            maxWidth: '180px',
            marginLeft: 'auto'
          }}>
            {tradeOff.rightDescription}
          </div>
        </div>
      </div>

      {/* Slider Track */}
      <div style={{ position: 'relative', marginTop: '16px' }}>
        {/* Center marker */}
        <div className="center-marker" style={{
          position: 'absolute',
          left: '50%',
          top: '-8px',
          transform: 'translateX(-50%)',
          width: '2px',
          height: '40px',
          background: 'rgba(255, 255, 255, 0.2)',
          zIndex: 0
        }} />

        {/* Slider input */}
        <input
          type="range"
          min="-100"
          max="100"
          value={tradeOff.value}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{
            width: '100%',
            height: '8px',
            borderRadius: '4px',
            background: `linear-gradient(90deg, 
              #ff4757 0%, 
              #ff4757 ${(tradeOff.value + 100) / 2}%, 
              ${color} ${(tradeOff.value + 100) / 2}%, 
              #00ff9d 100%
            )`,
            outline: 'none',
            cursor: 'pointer',
            appearance: 'none',
            WebkitAppearance: 'none',
            position: 'relative',
            zIndex: 1
          }}
        />

        {/* Value indicator */}
        <div className="value-indicator" style={{
          position: 'absolute',
          left: `${(tradeOff.value + 100) / 2}%`,
          top: '20px',
          color: color,
          fontSize: '11px',
          fontWeight: '700',
          textShadow: `0 0 10px ${color}`
        }}>
          {tradeOff.value > 0 ? '+' : ''}{tradeOff.value}
        </div>
      </div>

      {/* Add CSS for slider thumb */}
      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: ${color};
          cursor: pointer;
          box-shadow: 0 0 15px ${color};
          border: 2px solid #0a0e1a;
        }
        input[type="range"]::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: ${color};
          cursor: pointer;
          box-shadow: 0 0 15px ${color};
          border: 2px solid #0a0e1a;
        }
      `}</style>
    </div>
  );
};

// Dynamic Mountain that responds to trade-offs
const DynamicTerrainMountain: React.FC<{
  heightScale: number;
  complexity: number;
  riskLevel: number;
  growthLevel: number;
}> = ({ heightScale, complexity, riskLevel, growthLevel }) => {
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

        // Risk affects volatility (more peaks and valleys)
        const volatilityFactor = 1 + (riskLevel / 100) * 0.8;
        
        // Growth affects spread (wider base or tighter peak)
        const spreadFactor = 1 + (growthLevel / 100) * 0.5;

        const primaryWave = Math.sin(distance * 0.4 * volatilityFactor) * 2.5;
        const secondaryWave = Math.sin(distance * 0.7 + Math.PI / 3) * 1.8;
        const tertiaryWave = Math.cos(x * 0.4) * Math.sin(y * 0.4) * 1.2 * volatilityFactor;
        const detailNoise = Math.sin(x * 1.2) * Math.cos(y * 1.2) * 0.5;

        const falloff = Math.max(0, 1 - distance / (12 * spreadFactor));
        
        const height = (primaryWave + secondaryWave + tertiaryWave + detailNoise)
                      * heightScale
                      * falloff
                      * complexity;

        positions[i + 2] = Math.max(0, height);
      }

      geometry.attributes.position.needsUpdate = true;
      geometry.computeVertexNormals();
    }
  }, [heightScale, complexity, riskLevel, growthLevel]);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.emissiveIntensity = 0.15 + Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  // Color based on risk level
  const getColor = () => {
    if (riskLevel > 70) return '#ff4757'; // High risk - red
    if (riskLevel > 40) return '#ffa502'; // Medium risk - orange
    return '#00ff9d'; // Low risk - green
  };

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <planeGeometry args={[15, 15, 80, 80]} />
      <meshStandardMaterial
        ref={materialRef}
        color={getColor()}
        wireframe
        opacity={0.85}
        transparent
        emissive={getColor()}
        emissiveIntensity={0.15}
      />
    </mesh>
  );
};

// Metrics Display Component
const MetricsDisplay: React.FC<{ metrics: any; baseScenario: any }> = ({ metrics, baseScenario }) => {
  const cashDelta = metrics.cash - baseScenario.cash;
  const runwayDelta = metrics.runway - baseScenario.runway;

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(13, 17, 23, 0.95) 0%, rgba(10, 14, 26, 0.98) 100%)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(0, 212, 255, 0.2)',
      borderRadius: '12px',
      padding: '20px'
    }}>
      <h3 style={{
        color: '#00d4ff',
        fontSize: '12px',
        fontWeight: '600',
        letterSpacing: '0.05em',
        marginBottom: '16px',
        textTransform: 'uppercase'
      }}>
        Impact Analysis
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <MetricDelta
          label="Cash Position"
          value={metrics.cash}
          delta={cashDelta}
          format={(v) => `$${(v / 1000000).toFixed(2)}M`}
        />
        <MetricDelta
          label="Runway"
          value={metrics.runway}
          delta={runwayDelta}
          format={(v) => `${Math.round(v)}mo`}
        />
        <div className="metric-row" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 0',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px' }}>
            Risk Level
          </span>
          <span className={metrics.risk > 70 ? 'glow-red' : metrics.risk > 40 ? 'impact-badge' : 'glow-green'} style={{
            color: metrics.risk > 70 ? '#ff4757' : metrics.risk > 40 ? '#ffa502' : '#00ff9d',
            fontSize: '13px',
            fontWeight: '700'
          }}>
            {Math.round(metrics.risk)}%
          </span>
        </div>
        <div className="metric-row" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 0'
        }}>
          <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px' }}>
            Growth Potential
          </span>
          <span className="glow-blue" style={{
            color: '#00d4ff',
            fontSize: '13px',
            fontWeight: '700'
          }}>
            {Math.round(metrics.growth)}%
          </span>
        </div>
      </div>
    </div>
  );
};

// Metric Delta Component
const MetricDelta: React.FC<{
  label: string;
  value: number;
  delta: number;
  format: (v: number) => string;
}> = ({ label, value, delta, format }) => {
  const isPositive = delta > 0;
  const deltaColor = isPositive ? '#00ff9d' : '#ff4757';

  return (
    <div className="metric-row" style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '8px 0',
      borderTop: '1px solid rgba(255, 255, 255, 0.1)'
    }}>
      <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px' }}>
        {label}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ color: '#fff', fontSize: '13px', fontWeight: '700' }}>
          {format(value)}
        </span>
        {Math.abs(delta) > 0.01 && (
          <span className="value-change" style={{
            color: deltaColor,
            fontSize: '11px',
            fontWeight: '600'
          }}>
            ({isPositive ? '+' : ''}{format(delta)})
          </span>
        )}
      </div>
    </div>
  );
};

export default TradeOffsTab;

