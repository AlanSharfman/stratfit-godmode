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
  const [showSheen, setShowSheen] = useState(false);
  
  // Generate series data
  const barData = useMemo(() => {
    if (series && series.length >= 6) {
      return series.slice(-8); // Take last 8 items max
    }
    return generatePlaceholderSeries(value, 7);
  }, [series, value]);
  
  // Determine trend from series if not provided
  const effectiveTrend = useMemo(() => {
    if (trend !== "neutral") return trend;
    // Calculate trend from first vs last bar
    if (barData.length >= 2) {
      const first = barData[0];
      const last = barData[barData.length - 1];
      const diff = last - first;
      if (Math.abs(diff) < first * 0.05) return "neutral"; // Less than 5% change
      return diff > 0 ? "negative" : "positive"; // Higher burn = negative, lower burn = positive
    }
    return "neutral";
  }, [barData, trend]);
  
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
  
  // Sheen animation on value change
  useEffect(() => {
    setShowSheen(true);
    const timer = setTimeout(() => setShowSheen(false), 600);
    return () => clearTimeout(timer);
  }, [value]);
  
  const barCount = normalizedBars.length;
  const barWidth = 5;
  const gap = 4;
  const totalWidth = barCount * barWidth + (barCount - 1) * gap;
  const viewBoxWidth = totalWidth + 8; // Padding
  const viewBoxHeight = 36;
  
  // Get last bar color - always grey (neutral tone)
  const getLastBarColor = () => {
    // Clean grey for the final bar - no green, no orange
    return {
      gradient: ["rgba(148,163,184,0.9)", "rgba(120,135,155,0.75)"], // Slate grey
      glow: "rgba(148,163,184,0.25)"
    };
  };
  
  const lastBarColors = getLastBarColor();
  
  return (
    <svg 
      viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`} 
      className="burn-trend-bars"
      style={{ width: '100%', height: 'auto', maxHeight: '55px' }}
    >
      <defs>
        {/* Purple gradient for regular bars */}
        <linearGradient id="burn-bar-purple" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(168,85,247,0.85)" />
          <stop offset="100%" stopColor="rgba(139,92,246,0.7)" />
        </linearGradient>
        
        {/* Last bar gradient - changes based on trend */}
        <linearGradient id="burn-bar-latest" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={lastBarColors.gradient[0]} />
          <stop offset="100%" stopColor={lastBarColors.gradient[1]} />
        </linearGradient>
        
        {/* Sheen sweep gradient */}
        <linearGradient id="burn-sheen" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(255,255,255,0)" />
          <stop offset="50%" stopColor="rgba(255,255,255,0.08)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
      </defs>
      
      {/* Baseline grid line */}
      <line 
        x1="4" 
        y1={viewBoxHeight - 4} 
        x2={viewBoxWidth - 4} 
        y2={viewBoxHeight - 4}
        stroke="rgba(80,90,110,0.2)"
        strokeWidth="1"
        strokeDasharray="2 3"
      />
      
      {/* Reference line at mid-height */}
      <line 
        x1="4" 
        y1={viewBoxHeight - 18} 
        x2={viewBoxWidth - 4} 
        y2={viewBoxHeight - 18}
        stroke="rgba(80,90,110,0.1)"
        strokeWidth="0.5"
      />
      
      {/* Bars - all purple except last one */}
      {normalizedBars.map((bar, idx) => {
        const x = 4 + idx * (barWidth + gap);
        const y = viewBoxHeight - 4 - bar.height;
        // Regular bars fade in opacity, last bar is full
        const opacity = bar.isLatest ? 1 : 0.5 + (idx / barCount) * 0.35;
        const delay = idx * 40; // Staggered animation
        
        return (
          <rect
            key={idx}
            x={x}
            y={mounted ? y : viewBoxHeight - 4}
            width={barWidth}
            height={mounted ? bar.height : 0}
            rx="1.5"
            ry="1.5"
            fill={bar.isLatest ? "url(#burn-bar-latest)" : "url(#burn-bar-purple)"}
            opacity={opacity}
            style={{
              transition: `y 350ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms, height 350ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms, fill 300ms ease`,
            }}
          />
        );
      })}
      
      {/* Latest bar glow effect */}
      {mounted && (
        <rect
          x={4 + (barCount - 1) * (barWidth + gap) - 1}
          y={viewBoxHeight - 4 - normalizedBars[barCount - 1].height - 1}
          width={barWidth + 2}
          height={normalizedBars[barCount - 1].height + 2}
          rx="2"
          ry="2"
          fill="none"
          stroke={lastBarColors.glow}
          strokeWidth="1"
          style={{
            transition: 'y 350ms cubic-bezier(0.22, 1, 0.36, 1), height 350ms cubic-bezier(0.22, 1, 0.36, 1), stroke 300ms ease',
          }}
        />
      )}
      
      {/* Scan sheen overlay */}
      {showSheen && (
        <rect
          x="0"
          y="0"
          width={viewBoxWidth}
          height={viewBoxHeight}
          fill="url(#burn-sheen)"
          style={{
            animation: 'burn-sheen-sweep 0.5s ease-out',
          }}
        />
      )}
      
      <style>{`
        @keyframes burn-sheen-sweep {
          0% { 
            transform: translateX(-100%);
            opacity: 1;
          }
          100% { 
            transform: translateX(100%);
            opacity: 0;
          }
        }
      `}</style>
    </svg>
  );
}
