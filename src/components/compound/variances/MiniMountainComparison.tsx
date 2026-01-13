// src/components/compound/variances/MiniMountainComparison.tsx
// Mini Mountain Comparison - Visual scenario posture comparison

import { useMemo } from "react";
import type { ScenarioId } from "@/state/scenarioStore";
import styles from "./MiniMountainComparison.module.css";

interface MiniMountainProps {
  scenarioId: ScenarioId;
  scenarioName: string;
  color: string;
  metrics: {
    growth: number; // 0-100 (affects peak height)
    efficiency: number; // 0-100 (affects base width)
    risk: number; // 0-100 (affects cracks/stress)
  };
  isActive?: boolean;
}

function MiniMountain({ scenarioId, scenarioName, color, metrics, isActive }: MiniMountainProps) {
  const terrainPath = useMemo(() => {
    const { growth, efficiency, risk } = metrics;
    
    // Map metrics to visual characteristics
    const peakHeight = 30 + (growth / 100) * 40; // 30-70
    const baseWidth = 60 + (efficiency / 100) * 30; // 60-90
    const stress = risk / 100; // 0-1

    // Generate simplified mountain silhouette
    const cx = 60; // center
    const baseY = 90;
    
    // Left slope
    const leftX = cx - baseWidth / 2;
    const leftMidX = cx - baseWidth / 4;
    const leftMidY = baseY - peakHeight * 0.4;
    
    // Peak
    const peakY = baseY - peakHeight;
    
    // Right slope
    const rightMidX = cx + baseWidth / 4;
    const rightMidY = baseY - peakHeight * 0.4;
    const rightX = cx + baseWidth / 2;

    // Smooth mountain path
    const path = `
      M ${leftX},${baseY}
      Q ${leftMidX},${leftMidY} ${cx},${peakY}
      Q ${rightMidX},${rightMidY} ${rightX},${baseY}
      Z
    `;

    return { path, peakY, stress };
  }, [metrics]);

  const { path, peakY, stress } = terrainPath;

  // Stress indicators (cracks)
  const showCracks = stress > 0.5;
  const crackOpacity = Math.min((stress - 0.5) * 2, 0.6);

  return (
    <div className={`${styles.mountainCard} ${isActive ? styles.active : ""}`}>
      <div className={styles.cardHeader}>
        <span className={styles.scenarioName}>{scenarioName}</span>
      </div>
      
      <svg 
        viewBox="0 0 120 100" 
        className={styles.mountainSvg}
        style={{ ['--scenario-color' as string]: color }}
      >
        {/* Background grid (subtle) */}
        <defs>
          <linearGradient id={`grad-${scenarioId}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.6" />
            <stop offset="100%" stopColor={color} stopOpacity="0.15" />
          </linearGradient>
        </defs>

        {/* Horizon line */}
        <line x1="0" y1="90" x2="120" y2="90" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />

        {/* Mountain silhouette */}
        <path
          d={path}
          fill={`url(#grad-${scenarioId})`}
          stroke={color}
          strokeWidth="1.5"
        />

        {/* Peak highlight */}
        <circle 
          cx="60" 
          cy={peakY} 
          r="2" 
          fill={color}
          opacity="0.8"
        />

        {/* Stress cracks (if high risk) */}
        {showCracks && (
          <g opacity={crackOpacity}>
            <line x1="45" y1="85" x2="48" y2="70" stroke="#ff6b6b" strokeWidth="1" strokeDasharray="2,1" />
            <line x1="72" y1="82" x2="70" y2="68" stroke="#ff6b6b" strokeWidth="1" strokeDasharray="2,1" />
            <line x1="60" y1="88" x2="62" y2="75" stroke="#ff6b6b" strokeWidth="0.8" strokeDasharray="2,1" />
          </g>
        )}
      </svg>

      <div className={styles.cardFooter}>
        <div className={styles.metricDot} style={{ background: color }} />
        <span className={styles.metricLabel}>
          {metrics.growth > 70 ? "Growth" : metrics.risk > 70 ? "High Risk" : metrics.efficiency > 70 ? "Efficient" : "Balanced"}
        </span>
      </div>
    </div>
  );
}

interface Props {
  scenarios: Array<{
    id: ScenarioId;
    name: string;
    color: string;
    metrics: {
      growth: number;
      efficiency: number;
      risk: number;
    };
  }>;
  activeScenario?: ScenarioId;
}

export default function MiniMountainComparison({ scenarios, activeScenario }: Props) {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Mountain Shape Comparison</h3>
        <p className={styles.subtitle}>Visual scenario posture at a glance</p>
      </div>
      
      <div className={styles.mountainGrid}>
        {scenarios.map((s) => (
          <MiniMountain
            key={s.id}
            scenarioId={s.id}
            scenarioName={s.name}
            color={s.color}
            metrics={s.metrics}
            isActive={s.id === activeScenario}
          />
        ))}
      </div>
    </div>
  );
}

