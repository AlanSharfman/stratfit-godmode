// src/components/shared/GodModeUI.tsx
// STRATFIT — Reusable God Mode UI Components
// Premium UI elements with consistent God Mode styling

import React, { ReactNode } from 'react';
import './GodModeUI.css';

// ═══════════════════════════════════════════════════════════════════════════════
// GLOW BUTTON
// ═══════════════════════════════════════════════════════════════════════════════

interface GlowButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  icon?: string;
  className?: string;
}

export function GlowButton({
  children,
  onClick,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  icon,
  className = '',
}: GlowButtonProps) {
  return (
    <button
      className={`glow-button ${variant} ${size} ${disabled ? 'disabled' : ''} ${className}`}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
    >
      {icon && <span className="button-icon">{icon}</span>}
      <span className="button-text">{children}</span>
      <div className="button-glow" />
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// GOD MODE CARD
// ═══════════════════════════════════════════════════════════════════════════════

interface GodModeCardProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  icon?: string;
  accentColor?: string;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export function GodModeCard({
  children,
  title,
  subtitle,
  icon,
  accentColor = 'var(--gm-cyan)',
  className = '',
  onClick,
  hoverable = false,
}: GodModeCardProps) {
  return (
    <div
      className={`godmode-card ${hoverable ? 'hoverable' : ''} ${className}`}
      style={{ '--card-accent': accentColor } as React.CSSProperties}
      onClick={onClick}
    >
      <div className="card-glow" />
      <div className="card-border" />
      
      {(title || icon) && (
        <div className="card-header">
          {icon && <span className="card-icon">{icon}</span>}
          <div className="card-titles">
            {title && <h3 className="card-title">{title}</h3>}
            {subtitle && <p className="card-subtitle">{subtitle}</p>}
          </div>
        </div>
      )}
      
      <div className="card-content">
        {children}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ANIMATED BADGE
// ═══════════════════════════════════════════════════════════════════════════════

interface AnimatedBadgeProps {
  icon?: string;
  text: string;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'purple';
}

export function AnimatedBadge({
  icon,
  text,
  variant = 'default',
}: AnimatedBadgeProps) {
  return (
    <div className={`animated-badge ${variant}`}>
      {icon && <span className="badge-icon">{icon}</span>}
      <span className="badge-text">{text}</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STAT DISPLAY
// ═══════════════════════════════════════════════════════════════════════════════

interface StatDisplayProps {
  label: string;
  value: string | number;
  icon?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: string;
}

export function StatDisplay({
  label,
  value,
  icon,
  trend,
  trendValue,
  color = 'var(--gm-cyan)',
}: StatDisplayProps) {
  return (
    <div className="stat-display" style={{ '--stat-color': color } as React.CSSProperties}>
      {icon && <span className="stat-icon">{icon}</span>}
      <div className="stat-content">
        <span className="stat-label">{label}</span>
        <span className="stat-value">{value}</span>
        {trend && trendValue && (
          <span className={`stat-trend ${trend}`}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendValue}
          </span>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROGRESS RING
// ═══════════════════════════════════════════════════════════════════════════════

interface ProgressRingProps {
  value: number; // 0-100
  size?: number;
  strokeWidth?: number;
  color?: string;
  showLabel?: boolean;
  label?: string;
}

export function ProgressRing({
  value,
  size = 100,
  strokeWidth = 8,
  color = 'var(--gm-cyan)',
  showLabel = true,
  label,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className="progress-ring" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`}>
        <circle
          className="ring-bg"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
        />
        <circle
          className="ring-fill"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ stroke: color }}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      {showLabel && (
        <div className="ring-label">
          <span className="ring-value" style={{ color }}>{value}</span>
          {label && <span className="ring-text">{label}</span>}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHIMMER TEXT
// ═══════════════════════════════════════════════════════════════════════════════

interface ShimmerTextProps {
  children: ReactNode;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span';
  className?: string;
}

export function ShimmerText({
  children,
  as: Component = 'span',
  className = '',
}: ShimmerTextProps) {
  return (
    <Component className={`shimmer-text ${className}`}>
      {children}
    </Component>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LOADING SPINNER
// ═══════════════════════════════════════════════════════════════════════════════

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
}

export function LoadingSpinner({
  size = 'medium',
  color = 'var(--gm-cyan)',
}: LoadingSpinnerProps) {
  return (
    <div className={`loading-spinner ${size}`} style={{ '--spinner-color': color } as React.CSSProperties}>
      <div className="spinner-ring" />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TOOLTIP
// ═══════════════════════════════════════════════════════════════════════════════

interface TooltipProps {
  children: ReactNode;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function Tooltip({
  children,
  content,
  position = 'top',
}: TooltipProps) {
  return (
    <div className={`tooltip-wrapper ${position}`}>
      {children}
      <div className="tooltip-content">
        {content}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION DIVIDER
// ═══════════════════════════════════════════════════════════════════════════════

interface SectionDividerProps {
  label?: string;
}

export function SectionDivider({ label }: SectionDividerProps) {
  return (
    <div className="section-divider">
      <div className="divider-line" />
      {label && <span className="divider-label">{label}</span>}
      <div className="divider-line" />
    </div>
  );
}
