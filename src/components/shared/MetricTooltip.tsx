// src/components/shared/MetricTooltip.tsx
// STRATFIT — Metric Tooltip Component
// Hover/click to see plain-English definitions of SaaS metrics

import React, { useState, useRef, useEffect } from 'react';
import { getMetric, type MetricDefinition, METRIC_CATEGORIES } from '../../data/metricsGlossary';
import './MetricTooltip.css';

// ═══════════════════════════════════════════════════════════════════════════════
// METRIC LABEL — Use this to wrap any metric term
// ═══════════════════════════════════════════════════════════════════════════════

interface MetricLabelProps {
  /** The display text (e.g., "CAC", "LTV:CAC Ratio") */
  label: string;
  /** The glossary key to look up (e.g., "cac", "ltv-cac") */
  term: string;
  /** Optional: override the tooltip position */
  position?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  /** Optional: show full name instead of short */
  showFullName?: boolean;
  /** Optional: custom class */
  className?: string;
  /** Optional: size variant */
  size?: 'small' | 'medium' | 'large';
}

export function MetricLabel({
  label,
  term,
  position = 'auto',
  showFullName = false,
  className = '',
  size = 'medium',
}: MetricLabelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState(position);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  
  const metric = getMetric(term);
  
  // Auto-position tooltip based on available space
  useEffect(() => {
    if (position !== 'auto' || !isOpen || !triggerRef.current) return;
    
    const rect = triggerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    
    // Prefer top, but flip if not enough space
    if (rect.top < 250) {
      setTooltipPosition('bottom');
    } else if (rect.bottom > viewportHeight - 250) {
      setTooltipPosition('top');
    } else if (rect.left < 200) {
      setTooltipPosition('right');
    } else if (rect.right > viewportWidth - 200) {
      setTooltipPosition('left');
    } else {
      setTooltipPosition('top');
    }
  }, [isOpen, position]);
  
  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    
    const handleClick = (e: MouseEvent) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target as Node) &&
        tooltipRef.current && !tooltipRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);
  
  // Close on escape
  useEffect(() => {
    if (!isOpen) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);
  
  if (!metric) {
    // No definition found, just render the label
    return <span className={className}>{label}</span>;
  }
  
  const categoryInfo = METRIC_CATEGORIES[metric.category];
  
  return (
    <span 
      className={`metric-label ${size} ${className}`}
      ref={triggerRef}
    >
      <span className="metric-label-text">
        {showFullName ? metric.fullName : label}
      </span>
      <button
        className="metric-info-btn"
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        aria-label={`Learn about ${metric.fullName}`}
        type="button"
      >
        <span className="info-icon">ⓘ</span>
      </button>
      
      {isOpen && (
        <div 
          className={`metric-tooltip ${tooltipPosition}`}
          ref={tooltipRef}
          role="tooltip"
        >
          <MetricTooltipContent metric={metric} categoryInfo={categoryInfo} />
        </div>
      )}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STANDALONE TOOLTIP — For custom implementations
// ═══════════════════════════════════════════════════════════════════════════════

interface MetricTooltipProps {
  term: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function MetricTooltip({ term, children, position = 'top' }: MetricTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const metric = getMetric(term);
  
  if (!metric) return <>{children}</>;
  
  const categoryInfo = METRIC_CATEGORIES[metric.category];
  
  return (
    <span 
      className="metric-tooltip-wrapper"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      {children}
      {isOpen && (
        <div className={`metric-tooltip ${position}`} role="tooltip">
          <MetricTooltipContent metric={metric} categoryInfo={categoryInfo} />
        </div>
      )}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TOOLTIP CONTENT — The actual tooltip card
// ═══════════════════════════════════════════════════════════════════════════════

interface TooltipContentProps {
  metric: MetricDefinition;
  categoryInfo: { label: string; icon: string; color: string };
}

function MetricTooltipContent({ metric, categoryInfo }: TooltipContentProps) {
  return (
    <div className="tooltip-content">
      {/* Header */}
      <div className="tooltip-header">
        <div className="tooltip-title">
          <span className="tooltip-short">{metric.shortName}</span>
          <span className="tooltip-full">{metric.fullName}</span>
        </div>
        <span 
          className="tooltip-category"
          style={{ '--category-color': categoryInfo.color } as React.CSSProperties}
        >
          {categoryInfo.icon} {categoryInfo.label}
        </span>
      </div>
      
      {/* Definition */}
      <p className="tooltip-definition">{metric.definition}</p>
      
      {/* Formula */}
      {metric.formula && (
        <div className="tooltip-formula">
          <span className="formula-label">Formula:</span>
          <code className="formula-code">{metric.formula}</code>
        </div>
      )}
      
      {/* Example */}
      {metric.example && (
        <div className="tooltip-example">
          <span className="example-label">Example:</span>
          <span className="example-text">{metric.example}</span>
        </div>
      )}
      
      {/* Good/Bad Indicators */}
      {metric.goodBad && (
        <div className="tooltip-benchmarks">
          <div className="benchmark good">
            <span className="benchmark-icon">✓</span>
            <span className="benchmark-text">{metric.goodBad.good}</span>
          </div>
          <div className="benchmark bad">
            <span className="benchmark-icon">✗</span>
            <span className="benchmark-text">{metric.goodBad.bad}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// METRIC BADGE — Compact inline badge with tooltip
// ═══════════════════════════════════════════════════════════════════════════════

interface MetricBadgeProps {
  term: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}

export function MetricBadge({ term, value, unit, trend, className = '' }: MetricBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const metric = getMetric(term);
  
  if (!metric) {
    return (
      <span className={`metric-badge ${className}`}>
        <span className="badge-value">{value}{unit}</span>
      </span>
    );
  }
  
  const categoryInfo = METRIC_CATEGORIES[metric.category];
  
  return (
    <span 
      className={`metric-badge ${trend || ''} ${className}`}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <span className="badge-label">{metric.shortName}</span>
      <span className="badge-value">
        {value}{unit}
        {trend && (
          <span className={`badge-trend ${trend}`}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
          </span>
        )}
      </span>
      
      {isOpen && (
        <div className="metric-tooltip bottom" role="tooltip">
          <MetricTooltipContent metric={metric} categoryInfo={categoryInfo} />
        </div>
      )}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export { getMetric, getMetricsByCategory, searchMetrics } from '../../data/metricsGlossary';
export type { MetricDefinition } from '../../data/metricsGlossary';

