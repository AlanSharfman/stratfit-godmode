// src/components/landing/LandingPage.tsx
// STRATFIT — GOD MODE Landing Page
// Comprehensive, production-ready landing experience

import React, { useState } from 'react';
import PersonaGrid from './PersonaGrid';
import PersonaDetail from './PersonaDetail';
import ThreeFutures from './ThreeFutures';
import FlowDiagram from './FlowDiagram';
import ConceptDiagrams from './ConceptDiagrams';
import DecisionArchitecture from './DecisionArchitecture';
import { Persona, PERSONAS, getPersonaById } from './personaData';
import './LandingPage.css';

interface LandingPageProps {
  onStart: () => void;
  onStartWithPersona?: (personaId: string) => void;
}

export default function LandingPage({ onStart, onStartWithPersona }: LandingPageProps) {
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [showPersonaDetail, setShowPersonaDetail] = useState(false);

  const handlePersonaClick = (personaId: string) => {
    const persona = getPersonaById(personaId);
    if (persona) {
      setSelectedPersona(persona);
      setShowPersonaDetail(true);
    }
  };

  const handlePersonaBack = () => {
    setShowPersonaDetail(false);
    setTimeout(() => setSelectedPersona(null), 300);
  };

  const handlePersonaStart = () => {
    if (selectedPersona && onStartWithPersona) {
      onStartWithPersona(selectedPersona.id);
    } else {
      onStart();
    }
  };

  // If showing persona detail, render that view
  if (showPersonaDetail && selectedPersona) {
    return (
      <PersonaDetail
        persona={selectedPersona}
        onBack={handlePersonaBack}
        onStart={handlePersonaStart}
      />
    );
  }

  return (
    <div className="landing-page">
      {/* ═══════════════════════════════════════════════════════════════════════
          BACKGROUND EFFECTS
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="landing-bg">
        <div className="bg-gradient" />
        <div className="bg-grid" />
        <div className="bg-glow glow-1" />
        <div className="bg-glow glow-2" />
        <div className="bg-particles" />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          GOD MODE HEADER BANNER
      ═══════════════════════════════════════════════════════════════════════ */}
      <header className="landing-header">
        <div className="god-mode-banner">
          <div className="banner-glow" />
          <span className="banner-icon">✦</span>
          <span className="banner-text">STRATFIT: GOD MODE ACTIVATED</span>
          <span className="banner-icon">✦</span>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════════
          HERO SECTION
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-pulse" />
            <span className="badge-text">SCENARIO INTELLIGENCE PLATFORM</span>
          </div>
          
          <h1 className="hero-title">
            <span className="title-line">Stress Test Your</span>
            <span className="title-line title-gradient">Business Strategy</span>
            <span className="title-line">Before Execution</span>
          </h1>
          
          <p className="hero-subtitle">
            Run 10,000 Monte Carlo simulations. See every possible future. 
            Make decisions with <span className="highlight">probability</span>, not guesswork.
          </p>
          
          <div className="hero-stats">
            <div className="stat-item">
              <span className="stat-number">10,000</span>
              <span className="stat-label">Simulations</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-number">2 min</span>
              <span className="stat-label">To Clarity</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-number">1</span>
              <span className="stat-label">Clear Focus</span>
            </div>
          </div>
          
          <div className="hero-cta">
            <button className="cta-primary" onClick={onStart}>
              <span className="cta-icon">🚀</span>
              <span className="cta-text">Test Your Strategy</span>
              <span className="cta-arrow">→</span>
            </button>
            <span className="cta-note">No signup required • See results in 2 minutes</span>
          </div>
        </div>
        
        <div className="hero-visual">
          <div className="visual-frame">
            <div className="frame-corner tl" />
            <div className="frame-corner tr" />
            <div className="frame-corner bl" />
            <div className="frame-corner br" />
            <div className="mountain-preview">
              <svg viewBox="0 0 400 200" className="mountain-svg">
                <defs>
                  <linearGradient id="mountainGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#0891b2" stopOpacity="0.2" />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                <path
                  d="M0,200 L50,140 L100,160 L150,80 L200,40 L250,90 L300,70 L350,110 L400,200 Z"
                  fill="url(#mountainGrad)"
                  filter="url(#glow)"
                  className="mountain-path"
                />
                <path
                  d="M0,200 L50,140 L100,160 L150,80 L200,40 L250,90 L300,70 L350,110 L400,200"
                  fill="none"
                  stroke="#22d3ee"
                  strokeWidth="2"
                  filter="url(#glow)"
                  className="mountain-line"
                />
                {/* Grid lines */}
                {[40, 80, 120, 160].map(y => (
                  <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="#22d3ee" strokeOpacity="0.1" strokeDasharray="4 4" />
                ))}
              </svg>
              <div className="preview-badge">
                <span className="preview-stat">78%</span>
                <span className="preview-label">SURVIVAL</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          WHO IS STRATFIT FOR — PERSONA GRID
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="personas-section">
        <div className="section-header">
          <h2 className="section-title">
            <span className="title-icon">👥</span>
            Who Is STRATFIT For?
          </h2>
          <p className="section-subtitle">
            Whether you're a founder, CFO, investor, or board member — 
            STRATFIT speaks your language.
          </p>
        </div>
        
        <PersonaGrid 
          personas={PERSONAS} 
          onPersonaClick={handlePersonaClick}
        />
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          YOUR 3 POSSIBLE FUTURES
      ═══════════════════════════════════════════════════════════════════════ */}
      <ThreeFutures />

      {/* ═══════════════════════════════════════════════════════════════════════
          HOW IT WORKS — FLOW DIAGRAM
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="flow-section">
        <div className="section-header">
          <h2 className="section-title">
            <span className="title-icon">⚡</span>
            How It Works
          </h2>
          <p className="section-subtitle">
            From raw assumptions to strategic clarity in 30 seconds
          </p>
        </div>
        
        <FlowDiagram />
        
        <div className="flow-summary">
          <div className="summary-item">
            <span className="summary-number">7</span>
            <span className="summary-label">Screens</span>
          </div>
          <div className="summary-dot" />
          <div className="summary-item">
            <span className="summary-number">2</span>
            <span className="summary-label">Minutes</span>
          </div>
          <div className="summary-dot" />
          <div className="summary-item">
            <span className="summary-number">1</span>
            <span className="summary-label">Clear Focus</span>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          CONCEPT DIAGRAMS — BEFORE/AFTER, PROBABILITY CONE, SENSITIVITY MATRIX
      ═══════════════════════════════════════════════════════════════════════ */}
      <ConceptDiagrams />

      {/* ═══════════════════════════════════════════════════════════════════════
          INTELLIGENCE ENGINE ARCHITECTURE
      ═══════════════════════════════════════════════════════════════════════ */}
      <DecisionArchitecture />

      {/* ═══════════════════════════════════════════════════════════════════════
          FINAL CTA
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="final-cta-section">
        <div className="final-cta-content">
          <h2 className="final-title">Ready to See Your Future?</h2>
          <p className="final-subtitle">
            The spreadsheet era is over. The <span className="highlight">probability era</span> starts now.
          </p>
          
          <button className="cta-primary cta-large" onClick={onStart}>
            <span className="cta-icon">🎯</span>
            <span className="cta-text">Test Your Strategy Now</span>
            <span className="cta-arrow">→</span>
          </button>
          
          <div className="trust-badges">
            <span className="badge">✓ No signup required</span>
            <span className="badge">✓ 2-minute setup</span>
            <span className="badge">✓ Instant insights</span>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════════════════════════════════════ */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-logo">
            <img src="/logo.svg" alt="STRATFIT Logo" width="24" height="24" style={{ display: 'block' }} />
            <span className="logo-text">STRATFIT</span>
          </div>
          <p className="footer-tagline">Scenario Intelligence for Strategic Decisions</p>
          <p className="footer-copyright">© 2025 STRATFIT. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
