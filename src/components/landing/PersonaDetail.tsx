// src/components/landing/PersonaDetail.tsx
// STRATFIT — Persona Detail View
// Expanded view when user clicks a persona card

import React from 'react';
import { Persona } from './personaData';
import './PersonaDetail.css';

interface PersonaDetailProps {
  persona: Persona;
  onBack: () => void;
  onStart: () => void;
}

export default function PersonaDetail({ persona, onBack, onStart }: PersonaDetailProps) {
  return (
    <div 
      className="persona-detail"
      style={{
        '--persona-color': persona.color,
        '--persona-gradient': persona.gradient,
      } as React.CSSProperties}
    >
      {/* ═══════════════════════════════════════════════════════════════════════
          BACKGROUND EFFECTS
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="detail-bg">
        <div className="bg-gradient" />
        <div className="bg-grid" />
        <div className="bg-glow persona-glow" />
        <div className="bg-particles" />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          CONTENT
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="detail-content">
        {/* Back Button */}
        <button className="back-button" onClick={onBack}>
          <span className="back-arrow">←</span>
          <span className="back-text">Back to all roles</span>
        </button>

        {/* Header */}
        <header className="detail-header">
          <div className="header-icon-wrap">
            <div className="header-icon">{persona.icon}</div>
            <div className="icon-glow" />
          </div>
          <div className="header-text">
            <div className="header-badge">STRATFIT FOR</div>
            <h1 className="header-title">{persona.title}</h1>
            <p className="header-question">{persona.painQuestion}</p>
          </div>
        </header>

        {/* Description */}
        <section className="detail-description">
          <p>{persona.description}</p>
        </section>

        {/* Two Column Layout */}
        <div className="detail-columns">
          {/* Challenges Column */}
          <section className="challenges-section">
            <h2 className="column-title">
              <span className="title-icon">😤</span>
              Your Challenges
            </h2>
            <ul className="challenges-list">
              {persona.challenges.map((challenge, index) => (
                <li key={index} className="challenge-item" style={{ animationDelay: `${index * 0.1}s` }}>
                  <span className="challenge-x">✗</span>
                  <span className="challenge-text">{challenge}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* How STRATFIT Helps Column */}
          <section className="helps-section">
            <h2 className="column-title">
              <span className="title-icon">✨</span>
              How STRATFIT Helps
            </h2>
            <ul className="helps-list">
              {persona.stratfitHelps.map((help, index) => (
                <li key={index} className="help-item" style={{ animationDelay: `${index * 0.1}s` }}>
                  <span className="help-check">✓</span>
                  <div className="help-content">
                    <strong className="help-title">{help.title}</strong>
                    <span className="help-description">{help.description}</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* CTA Section */}
        <section className="detail-cta">
          <button className="cta-button persona-cta" onClick={onStart}>
            <span className="cta-icon">🚀</span>
            <span className="cta-text">{persona.ctaText}</span>
            <span className="cta-arrow">→</span>
          </button>
          <span className="cta-note">No signup required • See results in 2 minutes</span>
        </section>

        {/* What You'll See Preview */}
        <section className="preview-section">
          <h3 className="preview-title">What you'll discover:</h3>
          <div className="preview-cards">
            <div className="preview-card">
              <span className="preview-icon">📊</span>
              <span className="preview-label">Survival Probability</span>
            </div>
            <div className="preview-card">
              <span className="preview-icon">💰</span>
              <span className="preview-label">Revenue Projections</span>
            </div>
            <div className="preview-card">
              <span className="preview-icon">⚠️</span>
              <span className="preview-label">Top Risks</span>
            </div>
            <div className="preview-card">
              <span className="preview-icon">💎</span>
              <span className="preview-label">Valuation Range</span>
            </div>
            <div className="preview-card">
              <span className="preview-icon">🎯</span>
              <span className="preview-label">Strategic Path</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
