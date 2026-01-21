// src/components/BurnTrendBars.tsx
// Premium "Burn Trend Columns" micro bar chart for BURN RATE KPI
// Purple history bars, final bar always grey

import React, { useEffect, useState, useMemo } from "react";

interface BurnTrendBarsProps {
  series?: number[];  // Array of 6-8 burn values (optional, will derive if not provided)
  value: number;      // Current burn value
  trend?: "positive" | "negative" | "neutral"; // Trend direction (positive = burn decreasing = good)
}

// ============================================================================
// HELPER: Generate deterministic placeholder series from current value
// This can be swapped out for real data later
// ============================================================================
function generatePlaceholderSeries(currentValue: number, length: number = 7): number[] {
  // Use current value as seed for deterministic variance
  const seed = Math.floor(currentValue * 100) % 1000;
  const series: number[] = [];
  
  for (let i = 0; i < length; i++) {
    // Deterministic pseudo-random variance based on index and seed
    const variance = Math.sin(seed + i * 1.7) * 0.15 + Math.cos(seed * 0.3 + i * 2.3) * 0.1;
    // Trend slightly upward toward current value
    const trendFactor = 0.85 + (i / (length - 1)) * 0.15;
    const barValue = currentValue * trendFactor * (1 + variance);
    series.push(Math.max(10, barValue)); // Minimum value of 10
  }
  
  // Last bar is always the current value
  series[length - 1] = currentValue;
  
  return series;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function BurnTrendBars({ series, value, trend = "neutral" }: BurnTrendBarsProps) {
  const [mounted, setMounted] = useState(false);
  
  // Generate series data
  const barData = useMemo(() => {
    if (series && series.length >= 6) {
      return series.slice(-8); // Take last 8 items max
    }
    return generatePlaceholderSeries(value, 7);
  }, [series, value]);
  
  
  // Normalize bars to height range (6px to 28px)
  const normalizedBars = useMemo(() => {
    const maxVal = Math.max(...barData, 1);
    const minVal = Math.min(...barData);
    const range = maxVal - minVal || 1;
    
    return barData.map((val, idx) => {
      // Normalize to 0-1, then scale to 6-28px range
      const normalized = (val - minVal) / range;
      const height = 6 + normalized * 22;
      return {
        height,
        value: val,
        isLatest: idx === barData.length - 1
      };
    });
  }, [barData]);
  
  // Mount animation
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);
  
  const barCount = normalizedBars.length;
  const barWidth = 5;
  const gap = 4;
  const totalWidth = barCount * barWidth + (barCount - 1) * gap;
  const viewBoxWidth = totalWidth + 8; // Padding
  const viewBoxHeight = 36;
  
  // CYAN bars - no status badge
  const scaledViewBoxWidth = viewBoxWidth + 20;
  const scaledViewBoxHeight = viewBoxHeight + 8;
  
  return (
    <svg 
      viewBox={`0 0 ${scaledViewBoxWidth} ${scaledViewBoxHeight}`} 
      className="burn-trend-bars"
      style={{ width: '100%', height: 'auto', maxHeight: '50px', overflow: 'visible' }}
    >
      <defs>
        {/* Cyan gradient for bars - brighter */}
        <linearGradient id="burn-bar-cyan" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(0,255,255,0.4)" />
          <stop offset="50%" stopColor="rgba(0,255,255,0.85)" />
          <stop offset="100%" stopColor="rgba(0,255,255,0.4)" />
        </linearGradient>
        
        {/* Latest bar gradient - brighter */}
        <linearGradient id="burn-bar-latest" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(0,255,255,0.5)" />
          <stop offset="50%" stopColor="rgba(0,255,255,1)" />
          <stop offset="100%" stopColor="rgba(0,255,255,0.5)" />
        </linearGradient>
        
        {/* Glow filter */}
        <filter id="burn-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="1.5" result="blur"/>
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Cyan brackets - brighter */}
      <g stroke="rgba(0,255,255,0.7)" strokeWidth="0.5" fill="none">
        <path d="M 2 6 L 2 2 L 6 2"/>
        <path d={`M ${scaledViewBoxWidth - 8} 2 L ${scaledViewBoxWidth - 2} 2 L ${scaledViewBoxWidth - 2} 6`}/>
        <path d={`M 2 ${scaledViewBoxHeight - 8} L 2 ${scaledViewBoxHeight - 2} L 6 ${scaledViewBoxHeight - 2}`}/>
        <path d={`M ${scaledViewBoxWidth - 8} ${scaledViewBoxHeight - 2} L ${scaledViewBoxWidth - 2} ${scaledViewBoxHeight - 2} L ${scaledViewBoxWidth - 2} ${scaledViewBoxHeight - 8}`}/>
      </g>
      
      {/* Cyan baseline - brighter */}
      <line 
        x1="6" 
        y1={scaledViewBoxHeight - 6} 
        x2={scaledViewBoxWidth - 6} 
        y2={scaledViewBoxHeight - 6}
        stroke="rgba(0,255,255,0.45)"
        strokeWidth="0.5"
      />
      
      {/* Cyan tick marks - brighter */}
      {normalizedBars.map((_, idx) => (
        <line 
          key={`tick-${idx}`}
          x1={6 + idx * (barWidth + gap) + barWidth / 2}
          y1={scaledViewBoxHeight - 5}
          x2={6 + idx * (barWidth + gap) + barWidth / 2}
          y2={scaledViewBoxHeight - 3}
          stroke="rgba(0,255,255,0.55)"
          strokeWidth="0.5"
        />
      ))}
      
      {/* Cyan bars - brighter */}
      {normalizedBars.map((bar, idx) => {
        const x = 6 + idx * (barWidth + gap);
        const scaledHeight = bar.height * 0.9;
        const y = scaledViewBoxHeight - 6 - scaledHeight;
        const opacity = bar.isLatest ? 1 : 0.6 + (idx / barCount) * 0.3;
        const delay = idx * 20;
        
        return (
          <rect
            key={idx}
            x={x}
            y={mounted ? y : scaledViewBoxHeight - 6}
            width={barWidth}
            height={mounted ? scaledHeight : 0}
            rx="1"
            ry="1"
            fill={bar.isLatest ? "url(#burn-bar-latest)" : "url(#burn-bar-cyan)"}
            filter={bar.isLatest ? "url(#burn-glow)" : undefined}
            opacity={opacity}
            style={{
              transition: `y 80ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms, height 80ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms`,
            }}
          />
        );
      })}
      
      {/* No status badge - removed per user request */}
    </svg>
  );
}

