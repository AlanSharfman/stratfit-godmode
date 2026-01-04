// src/components/ViewTabsGodMode.tsx
// STRATFIT — GOD-MODE View Tabs (The Full Stack)
// Features: Particles, magnetic snap, hover previews, adaptive glow, sound-ready

import React, { useState, useEffect, useRef } from 'react';

export type ViewMode = 'terrain' | 'variances' | 'actuals';

interface ViewTabsGodModeProps {
  activeView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  scenarioHealth?: number;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

export default function ViewTabsGodMode({ 
  activeView, 
  onViewChange,
  scenarioHealth = 75 
}: ViewTabsGodModeProps) {
  
  const [hoveredTab, setHoveredTab] = useState<ViewMode | null>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [magneticOffset, setMagneticOffset] = useState({ x: 0, y: 0 });
  const [clickRipple, setClickRipple] = useState<{ x: number; y: number; show: boolean } | null>(null);
  const particleIdRef = useRef(0);

  const tabs = [
    { 
      id: 'terrain' as ViewMode, 
      label: 'Terrain', 
      icon: '🏔️',
      preview: '3D scenario visualization',
      color: '#00E5FF'
    },
    { 
      id: 'variances' as ViewMode, 
      label: 'Variances', 
      icon: '📊',
      preview: 'Delta analysis & trends',
      color: '#8b5cf6'
    },
    { 
      id: 'actuals' as ViewMode, 
      label: 'Actuals', 
      icon: '📈',
      preview: 'Real-time metrics',
      color: '#22c55e'
    }
  ];

  const getHealthGlow = () => {
    if (scenarioHealth >= 70) return '#22c55e';
    if (scenarioHealth >= 40) return '#00E5FF';
    return '#ef4444';
  };

  useEffect(() => {
    if (particles.length === 0) return;
    const interval = setInterval(() => {
      setParticles(prev => 
        prev.map(p => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          vy: p.vy + 0.2,
          life: p.life - 1
        })).filter(p => p.life > 0)
      );
    }, 16);
    return () => clearInterval(interval);
  }, [particles]);

  const createParticleBurst = (tabElement: HTMLElement, color: string) => {
    const rect = tabElement.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const newParticles: Particle[] = Array.from({ length: 15 }, () => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 3;
      return {
        id: particleIdRef.current++,
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        life: 60,
        color
      };
    });
    setParticles(prev => [...prev, ...newParticles]);
  };

  const handleTabClick = (tab: ViewMode, event: React.MouseEvent<HTMLButtonElement>) => {
    const tabElement = event.currentTarget;
    const tabData = tabs.find(t => t.id === tab);
    if (tabData) createParticleBurst(tabElement, tabData.color);
    const rect = tabElement.getBoundingClientRect();
    setClickRipple({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      show: true
    });
    setTimeout(() => setClickRipple(null), 600);
    setMagneticOffset({ x: 0, y: 0 });
    onViewChange(tab);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (hoveredTab && hoveredTab !== activeView) {
      const rect = e.currentTarget.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const deltaX = (e.clientX - centerX) / 10;
      const deltaY = (e.clientY - centerY) / 10;
      setMagneticOffset({ x: deltaX, y: deltaY });
    }
  };

  const healthGlow = getHealthGlow();

  return (
    <div className="god-mode-tabs-container">
      <div className="particles-overlay">
        {particles.map(p => (
          <div
            key={p.id}
            className="particle"
            style={{
              left: p.x,
              top: p.y,
              background: p.color,
              opacity: p.life / 60
            }}
          />
        ))}
      </div>
      <div className="god-mode-tabs">
        {tabs.map((tab) => {
          const isActive = activeView === tab.id;
          const isHovered = hoveredTab === tab.id;
          return (
            <div key={tab.id} className="tab-wrapper">
              <button
                className={`god-tab ${isActive ? 'active' : ''} ${isHovered ? 'hovered' : ''}`}
                onClick={(e) => handleTabClick(tab.id, e)}
                onMouseEnter={() => setHoveredTab(tab.id)}
                onMouseLeave={() => {
                  setHoveredTab(null);
                  setMagneticOffset({ x: 0, y: 0 });
                }}
                onMouseMove={handleMouseMove}
                style={{
                  transform: isHovered && !isActive ? `translate(${magneticOffset.x}px, ${magneticOffset.y}px) scale(1.02)` : isActive ? 'scale(1.05)' : 'scale(1)',
                  '--tab-color': isActive ? healthGlow : tab.color
                } as React.CSSProperties}
              >
                {clickRipple?.show && isActive && (
                  <span className="click-ripple" style={{ left: clickRipple.x, top: clickRipple.y }} />
                )}
                <span className="tab-glow" />
                <span className="tab-icon">{tab.icon}</span>
                <span className="tab-label">{tab.label}</span>
                {isActive && <span className="active-bar" style={{ background: healthGlow }} />}
              </button>
              {isHovered && !isActive && (
                <div className="preview-panel">
                  <div className="preview-content">
                    <span className="preview-icon">{tab.icon}</span>
                    <span className="preview-text">{tab.preview}</span>
                  </div>
                  <div className="preview-arrow" />
                </div>
              )}
            </div>
          );
        })}
      </div>
      <style>{`
        .god-mode-tabs-container { position: relative; display: flex; justify-content: center; width: 100%; padding: 20px 0 28px; }
        .particles-overlay { position: fixed; inset: 0; pointer-events: none; z-index: 9999; }
        .particle { position: absolute; width: 4px; height: 4px; border-radius: 50%; box-shadow: 0 0 8px currentColor; pointer-events: none; }
        .god-mode-tabs { display: flex; gap: 6px; padding: 6px; background: linear-gradient(135deg, rgba(15, 20, 30, 0.98), rgba(20, 25, 35, 0.95)); border: 2px solid rgba(0, 229, 255, 0.2); border-radius: 14px; backdrop-filter: blur(20px); box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05) inset, 0 0 40px rgba(0, 229, 255, 0.1); position: relative; overflow: visible; }
        .tab-wrapper { position: relative; }
        .god-tab { position: relative; display: flex; align-items: center; gap: 10px; padding: 14px 28px; background: rgba(25, 30, 40, 0.6); border: 2px solid rgba(255, 255, 255, 0.06); border-radius: 10px; color: rgba(255, 255, 255, 0.5); font-size: 14px; font-weight: 700; letter-spacing: 0.8px; text-transform: uppercase; cursor: pointer; transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); overflow: hidden; box-shadow: 0 2px 12px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.03); }
        .tab-glow { position: absolute; inset: -50%; background: radial-gradient(circle, var(--tab-color) 0%, transparent 70%); opacity: 0; transition: opacity 0.6s ease; animation: breathe 3s ease-in-out infinite; }
        @keyframes breathe { 0%, 100% { opacity: 0.1; transform: scale(1); } 50% { opacity: 0.3; transform: scale(1.1); } }
        .god-tab.hovered .tab-glow { opacity: 0.4; }
        .god-tab.active .tab-glow { opacity: 0.6; animation: breathe 2s ease-in-out infinite; }
        .god-tab:hover { color: rgba(255, 255, 255, 0.95); background: rgba(40, 48, 60, 0.9); border-color: var(--tab-color); box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5), 0 0 30px var(--tab-color), inset 0 1px 0 rgba(255, 255, 255, 0.1); }
        .god-tab.active { background: linear-gradient(135deg, rgba(0, 229, 255, 0.12), rgba(0, 180, 220, 0.08)); border: 2px solid var(--tab-color); color: #FFFFFF; box-shadow: 0 8px 32px var(--tab-color), 0 0 60px var(--tab-color), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 0 30px rgba(255, 255, 255, 0.05); }
        .click-ripple { position: absolute; width: 0; height: 0; border-radius: 50%; background: radial-gradient(circle, rgba(255, 255, 255, 0.8), transparent 70%); animation: ripple 0.6s ease-out; pointer-events: none; }
        @keyframes ripple { to { width: 300px; height: 300px; margin: -150px 0 0 -150px; opacity: 0; } }
        .active-bar { position: absolute; bottom: -6px; left: 50%; transform: translateX(-50%); width: 70%; height: 4px; border-radius: 2px; box-shadow: 0 0 16px currentColor; animation: barPulse 2s ease-in-out infinite; }
        @keyframes barPulse { 0%, 100% { opacity: 0.8; } 50% { opacity: 1; box-shadow: 0 0 24px currentColor; } }
        .tab-icon { font-size: 20px; transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); filter: grayscale(0.4); }
        .god-tab:hover .tab-icon { transform: scale(1.2) rotate(5deg); filter: grayscale(0) drop-shadow(0 0 12px var(--tab-color)); }
        .god-tab.active .tab-icon { transform: scale(1.15); filter: grayscale(0) drop-shadow(0 0 16px var(--tab-color)); animation: iconFloat 3s ease-in-out infinite; }
        @keyframes iconFloat { 0%, 100% { transform: scale(1.15) translateY(0); } 50% { transform: scale(1.15) translateY(-3px); } }
        .tab-label { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; position: relative; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.6); }
        .god-tab.active .tab-label { text-shadow: 0 0 20px var(--tab-color), 0 2px 8px rgba(0, 0, 0, 0.8); }
        .preview-panel { position: absolute; top: calc(100% + 12px); left: 50%; transform: translateX(-50%); padding: 12px 18px; background: rgba(10, 15, 25, 0.98); border: 1px solid rgba(0, 229, 255, 0.3); border-radius: 8px; backdrop-filter: blur(16px); box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6); animation: previewSlide 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); z-index: 100; white-space: nowrap; }
        @keyframes previewSlide { from { opacity: 0; transform: translateX(-50%) translateY(-10px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
        .preview-content { display: flex; align-items: center; gap: 8px; }
        .preview-icon { font-size: 16px; }
        .preview-text { font-size: 11px; font-weight: 600; color: rgba(255, 255, 255, 0.8); letter-spacing: 0.3px; }
        .preview-arrow { position: absolute; top: -4px; left: 50%; transform: translateX(-50%) rotate(45deg); width: 8px; height: 8px; background: rgba(10, 15, 25, 0.98); border-left: 1px solid rgba(0, 229, 255, 0.3); border-top: 1px solid rgba(0, 229, 255, 0.3); }
      `}</style>
    </div>
  );
}
