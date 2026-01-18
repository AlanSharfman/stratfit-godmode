import React, { useState, useEffect } from 'react';
import './KPIHeader.css';

interface KPIBoxData {
  category: string;
  metrics: {
    label: string;
    value: string;
    unit?: string;
    trend?: 'up' | 'down' | 'neutral';
    visualization?: 'gauge' | 'chart' | 'line' | 'score';
    visualData?: any;
  }[];
  color: string;
}

interface KPIHeaderProps {
  isVisible: boolean;
  activeScenario?: string;
  onScenarioChange?: (scenario: string) => void;
}

const KPIHeader: React.FC<KPIHeaderProps> = ({ 
  isVisible, 
  activeScenario = 'base',
  onScenarioChange 
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 600);
    return () => clearTimeout(timer);
  }, [isVisible]);

  // KPI Data based on active scenario
  const kpiData: KPIBoxData[] = [
    {
      category: 'RESILIENCE',
      color: '#00d4ff',
      metrics: [
        { label: 'CASH', value: '$4.0M', visualization: 'gauge', visualData: 65 },
        { label: 'MONTHLY BURN', value: '$47K', unit: '/mo', visualization: 'chart' },
        { label: 'RUNWAY', value: '84', unit: 'mo', visualization: 'line' }
      ]
    },
    {
      category: 'MOMENTUM',
      color: '#00ff9d',
      metrics: [
        { label: 'ARR (RUN-RATE)', value: '$4.8M', trend: 'up', visualization: 'line' },
        { label: 'ARR GROWTH', value: '+$1.2M', unit: '▲ $120K MRR', trend: 'up', visualization: 'line' }
      ]
    },
    {
      category: 'QUALITY',
      color: '#7c3aed',
      metrics: [
        { label: 'GROSS MARGIN', value: '44%', trend: 'up', visualization: 'gauge', visualData: 44 },
        { label: 'RISE SCORE', value: '38/100', visualization: 'score', visualData: 38 },
        { label: 'ENTERPRISE VALUE', value: '$4.3M', unit: 'IMPLIED VEV', visualization: 'line' }
      ]
    }
  ];

  return (
    <div 
      className={`kpi-header-container ${isVisible ? 'visible' : 'hidden'} ${isAnimating ? 'animating' : ''}`}
      style={{
        maxHeight: isVisible ? '240px' : '0',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(-30px)',
        marginBottom: isVisible ? '24px' : '0',
        overflow: 'hidden',
        transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        pointerEvents: isVisible ? 'auto' : 'none'
      }}
    >
      <div className="kpi-header-content" style={{
        display: 'flex',
        gap: '16px',
        padding: '0 32px',
        width: '100%'
      }}>
        {/* Active Scenario Selector */}
        <div className="active-scenario-box" style={{
          flex: '0 0 180px',
          background: 'linear-gradient(135deg, rgba(10, 14, 26, 0.95) 0%, rgba(13, 17, 23, 0.98) 100%)',
          border: '1px solid rgba(0, 212, 255, 0.3)',
          borderRadius: '12px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          backdropFilter: 'blur(10px)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Animated background effect */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 50% 50%, rgba(0, 212, 255, 0.1) 0%, transparent 70%)',
            animation: 'pulse 3s ease-in-out infinite'
          }} />
          
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: '10px',
              fontWeight: '600',
              letterSpacing: '0.1em',
              marginBottom: '12px',
              textTransform: 'uppercase'
            }}>
              ACTIVE SCENARIO
            </div>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '8px'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#00d4ff',
                boxShadow: '0 0 10px #00d4ff',
                animation: 'blink 2s ease-in-out infinite'
              }} />
              <select
                value={activeScenario}
                onChange={(e) => onScenarioChange?.(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#00d4ff',
                  fontSize: '16px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  outline: 'none',
                  appearance: 'none',
                  textShadow: '0 0 15px rgba(0, 212, 255, 0.5)'
                }}
              >
                <option value="base">Base Case</option>
                <option value="growth">Growth</option>
                <option value="stress">Stress Test</option>
                <option value="survival">Survival</option>
              </select>
            </div>
            
            <div style={{
              color: 'rgba(255, 255, 255, 0.4)',
              fontSize: '11px',
              marginTop: '4px'
            }}>
              Current trajectory
            </div>
          </div>
        </div>

        {/* KPI Boxes */}
        {kpiData.map((kpi, index) => (
          <KPIBox key={kpi.category} data={kpi} index={index} />
        ))}
      </div>
    </div>
  );
};

// Individual KPI Box Component
const KPIBox: React.FC<{ data: KPIBoxData; index: number }> = ({ data, index }) => {
  return (
    <div 
      className="kpi-box"
      style={{
        flex: 1,
        background: 'linear-gradient(135deg, rgba(10, 14, 26, 0.95) 0%, rgba(13, 17, 23, 0.98) 100%)',
        border: `1px solid ${data.color}40`,
        borderRadius: '12px',
        padding: '20px',
        backdropFilter: 'blur(10px)',
        position: 'relative',
        overflow: 'hidden',
        animation: `slideInDown 0.6s ease-out ${index * 0.1}s both`
      }}
    >
      {/* Top glow effect */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '2px',
        background: `linear-gradient(90deg, transparent 0%, ${data.color} 50%, transparent 100%)`,
        opacity: 0.6
      }} />

      {/* Category Header */}
      <div style={{
        color: data.color,
        fontSize: '11px',
        fontWeight: '700',
        letterSpacing: '0.1em',
        marginBottom: '16px',
        textTransform: 'uppercase',
        textShadow: `0 0 10px ${data.color}60`
      }}>
        {data.category}
      </div>

      {/* Metrics Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: data.metrics.length === 2 ? '1fr 1fr' : 'repeat(3, 1fr)',
        gap: '16px'
      }}>
        {data.metrics.map((metric, idx) => (
          <MetricDisplay key={idx} metric={metric} color={data.color} />
        ))}
      </div>
    </div>
  );
};

// Individual Metric Display
const MetricDisplay: React.FC<{ metric: any; color: string }> = ({ metric, color }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <div style={{
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: '9px',
        fontWeight: '600',
        letterSpacing: '0.05em',
        textTransform: 'uppercase'
      }}>
        {metric.label}
      </div>
      
      <div style={{
        color: '#fff',
        fontSize: '20px',
        fontWeight: '700',
        textShadow: `0 0 10px ${color}40`,
        display: 'flex',
        alignItems: 'baseline',
        gap: '4px'
      }}>
        {metric.value}
        {metric.unit && (
          <span style={{
            fontSize: '10px',
            color: 'rgba(255, 255, 255, 0.5)',
            fontWeight: '500'
          }}>
            {metric.unit}
          </span>
        )}
      </div>

      {/* Mini Visualization */}
      {metric.visualization === 'gauge' && metric.visualData && (
        <MiniGauge value={metric.visualData} color={color} />
      )}
      
      {metric.visualization === 'chart' && (
        <MiniBarChart color={color} />
      )}
      
      {metric.visualization === 'line' && (
        <MiniLineChart trend={metric.trend} color={color} />
      )}
      
      {metric.visualization === 'score' && metric.visualData && (
        <MiniScoreRing value={metric.visualData} color={color} />
      )}
    </div>
  );
};

// Mini Gauge Component
const MiniGauge: React.FC<{ value: number; color: string }> = ({ value, color }) => {
  return (
    <div style={{ width: '100%', height: '40px', position: 'relative', marginTop: '8px' }}>
      <svg width="100%" height="40" viewBox="0 0 100 50">
        {/* Background arc */}
        <path
          d="M 10 45 A 40 40 0 0 1 90 45"
          fill="none"
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth="8"
          strokeLinecap="round"
        />
        {/* Value arc */}
        <path
          d="M 10 45 A 40 40 0 0 1 90 45"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${(value / 100) * 125} 125`}
          style={{
            filter: `drop-shadow(0 0 6px ${color})`,
            transition: 'stroke-dasharray 1s ease-out'
          }}
        />
      </svg>
    </div>
  );
};

// Mini Bar Chart Component
const MiniBarChart: React.FC<{ color: string }> = ({ color }) => {
  const bars = [0.4, 0.7, 0.5, 0.9, 0.6, 0.8];
  
  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-end',
      gap: '3px',
      height: '40px',
      marginTop: '8px'
    }}>
      {bars.map((height, idx) => (
        <div
          key={idx}
          style={{
            flex: 1,
            height: `${height * 100}%`,
            background: `linear-gradient(180deg, ${color} 0%, ${color}80 100%)`,
            borderRadius: '2px',
            boxShadow: `0 0 8px ${color}60`,
            animation: `barGrow 0.6s ease-out ${idx * 0.1}s both`
          }}
        />
      ))}
    </div>
  );
};

// Mini Line Chart Component
const MiniLineChart: React.FC<{ trend?: 'up' | 'down' | 'neutral'; color: string }> = ({ trend, color }) => {
  const points = trend === 'up' 
    ? [20, 35, 25, 40, 30, 45, 35, 50]
    : trend === 'down'
    ? [50, 45, 48, 40, 42, 35, 38, 30]
    : [40, 35, 40, 38, 40, 37, 40, 39];

  const pathData = points.map((y, x) => `${x * 12},${y}`).join(' ');

  return (
    <div style={{ width: '100%', height: '40px', marginTop: '8px' }}>
      <svg width="100%" height="40" viewBox="0 0 100 60">
        {/* Grid lines */}
        <line x1="0" y1="30" x2="100" y2="30" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1" />
        
        {/* Line path */}
        <polyline
          points={pathData}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            filter: `drop-shadow(0 0 4px ${color})`,
            animation: 'drawLine 1s ease-out'
          }}
        />
        
        {/* Trend arrow */}
        {trend === 'up' && (
          <polygon
            points="90,5 95,10 85,10"
            fill={color}
            style={{ animation: 'fadeIn 1s ease-out' }}
          />
        )}
        {trend === 'down' && (
          <polygon
            points="90,55 95,50 85,50"
            fill="#ff4757"
            style={{ animation: 'fadeIn 1s ease-out' }}
          />
        )}
      </svg>
    </div>
  );
};

// Mini Score Ring Component
const MiniScoreRing: React.FC<{ value: number; color: string }> = ({ value, color }) => {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div style={{
      width: '48px',
      height: '48px',
      position: 'relative',
      marginTop: '8px'
    }}>
      <svg width="48" height="48" viewBox="0 0 48 48">
        {/* Background circle */}
        <circle
          cx="24"
          cy="24"
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth="6"
        />
        {/* Progress circle */}
        <circle
          cx="24"
          cy="24"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 24 24)"
          style={{
            filter: `drop-shadow(0 0 6px ${color})`,
            transition: 'stroke-dashoffset 1s ease-out'
          }}
        />
        {/* Center value */}
        <text
          x="24"
          y="28"
          textAnchor="middle"
          fill="#fff"
          fontSize="12"
          fontWeight="700"
        >
          {value}
        </text>
      </svg>
    </div>
  );
};

export default KPIHeader;

