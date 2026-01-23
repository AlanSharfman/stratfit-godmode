// src/components/ui/GodModeCursor.tsx
// STRATFIT GOD MODE — Custom Tactical Cursor
// Cyan crosshair with trailing glow, bracket hover state

import React, { useEffect, useState, useCallback } from 'react';

interface CursorPosition {
  x: number;
  y: number;
}

export default function GodModeCursor() {
  const [position, setPosition] = useState<CursorPosition>({ x: 0, y: 0 });
  const [trailPosition, setTrailPosition] = useState<CursorPosition>({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Track mouse movement
  const handleMouseMove = useCallback((e: MouseEvent) => {
    setPosition({ x: e.clientX, y: e.clientY });
    setIsVisible(true);
    
    // Delayed trail for smooth follow effect
    requestAnimationFrame(() => {
      setTrailPosition({ x: e.clientX, y: e.clientY });
    });
  }, []);

  // Track hover state on interactive elements
  const handleMouseOver = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const isInteractive = 
      target.tagName === 'BUTTON' ||
      target.tagName === 'A' ||
      target.tagName === 'INPUT' ||
      target.tagName === 'SELECT' ||
      target.tagName === 'TEXTAREA' ||
      target.getAttribute('role') === 'button' ||
      target.getAttribute('tabindex') !== null ||
      target.classList.contains('kpi-instrument') ||
      target.classList.contains('slider-track') ||
      target.closest('button') !== null ||
      target.closest('a') !== null ||
      target.closest('[role="button"]') !== null ||
      target.closest('.kpi-instrument') !== null;
    
    setIsHovering(isInteractive);
  }, []);

  // Hide cursor when mouse leaves window
  const handleMouseLeave = useCallback(() => {
    setIsVisible(false);
  }, []);

  const handleMouseEnter = useCallback(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [handleMouseMove, handleMouseOver, handleMouseLeave, handleMouseEnter]);

  if (!isVisible) return null;

  return (
    <div 
      className={`god-mode-cursor ${isHovering ? 'cursor-hover' : ''}`}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
      }}
    >
      {/* Trailing glow (follows with delay) */}
      <div 
        className="cursor-trail"
        style={{
          transform: `translate(${trailPosition.x - position.x}px, ${trailPosition.y - position.y}px)`,
        }}
      />
      
      {/* Crosshair */}
      <div className="cursor-crosshair">
        <div className="cursor-dot" />
      </div>
      
      {/* Bracket (shown on hover) */}
      <div className="cursor-bracket" />
    </div>
  );
}

