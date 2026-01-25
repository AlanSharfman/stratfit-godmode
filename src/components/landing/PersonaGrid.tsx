// src/components/landing/PersonaGrid.tsx
// STRATFIT — Persona Grid Component
// 8 persona cards in a responsive grid with God Mode styling

import React from 'react';
import { Persona } from './personaData';
import './PersonaGrid.css';

interface PersonaGridProps {
  personas: Persona[];
  onPersonaClick: (personaId: string) => void;
}

export default function PersonaGrid({ personas, onPersonaClick }: PersonaGridProps) {
  const primaryPersonas = personas.filter(p => p.category === 'primary');
  const secondaryPersonas = personas.filter(p => p.category === 'secondary');

  return (
    <div className="persona-grid">
      {/* Primary Row - 4 columns */}
      <div className="persona-row primary">
        {primaryPersonas.map((persona) => (
          <PersonaCard
            key={persona.id}
            persona={persona}
            onClick={() => onPersonaClick(persona.id)}
          />
        ))}
      </div>
      
      {/* Secondary Row - 4 columns */}
      <div className="persona-row secondary">
        {secondaryPersonas.map((persona) => (
          <PersonaCard
            key={persona.id}
            persona={persona}
            onClick={() => onPersonaClick(persona.id)}
          />
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PERSONA CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface PersonaCardProps {
  persona: Persona;
  onClick: () => void;
}

function PersonaCard({ persona, onClick }: PersonaCardProps) {
  return (
    <button
      className="persona-card"
      onClick={onClick}
      style={{
        '--persona-color': persona.color,
        '--persona-gradient': persona.gradient,
      } as React.CSSProperties}
    >
      {/* Background Effects */}
      <div className="card-bg">
        <div className="bg-glow" />
        <div className="bg-grid" />
      </div>
      
      {/* Content */}
      <div className="card-content">
        {/* Icon */}
        <div className="card-icon">
          <span className="icon-emoji">{persona.icon}</span>
          <div className="icon-ring" />
        </div>
        
        {/* Title */}
        <h3 className="card-title">{persona.shortTitle}</h3>
        
        {/* Pain Question */}
        <p className="card-question">{persona.painQuestion}</p>
        
        {/* Learn More */}
        <div className="card-action">
          <span className="action-text">Learn More</span>
          <span className="action-arrow">→</span>
        </div>
      </div>
      
      {/* Hover Border Effect */}
      <div className="card-border" />
    </button>
  );
}

export { PersonaCard };
