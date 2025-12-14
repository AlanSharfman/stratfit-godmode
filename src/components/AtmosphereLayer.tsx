// src/components/AtmosphereLayer.tsx
// STRATFIT — Restrained Atmospheric Depth Above Mountain

import React, { useEffect, useState } from "react";
import { ScenarioId, SCENARIO_COLORS } from "@/state/scenarioStore";

interface AtmosphereLayerProps {
  scenario: ScenarioId;
}

export default function AtmosphereLayer({ scenario }: AtmosphereLayerProps) {
  const [prevScenario, setPrevScenario] = useState(scenario);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const colors = SCENARIO_COLORS[scenario];

  // Handle scenario transitions
  useEffect(() => {
    if (scenario !== prevScenario) {
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setPrevScenario(scenario);
        setIsTransitioning(false);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [scenario, prevScenario]);

  return (
    <div className={`atmosphere-layer ${isTransitioning ? 'transitioning' : ''}`}>
      {/* Vertical gradient haze — fades from top */}
      <div 
        className="atmosphere-gradient"
        style={{
          ['--tint' as string]: colors.primary,
          ['--glow' as string]: colors.glow,
        }}
      />
      
      {/* Sparse data stars — very faint, slow drift */}
      <div className="atmosphere-stars">
        {[...Array(12)].map((_, i) => (
          <div 
            key={i}
            className="data-star"
            style={{
              left: `${8 + (i * 7.5) + Math.sin(i * 2.1) * 3}%`,
              top: `${5 + (i % 4) * 8 + Math.cos(i * 1.7) * 4}%`,
              animationDelay: `${i * 0.8}s`,
              opacity: 0.02 + (i % 3) * 0.015,
            }}
          />
        ))}
      </div>

      {/* Scenario-tinted mist band */}
      <div 
        className="atmosphere-mist"
        style={{ background: `linear-gradient(90deg, transparent 5%, ${colors.glow} 50%, transparent 95%)` }}
      />

      <style>{`
        .atmosphere-layer {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 45%;
          pointer-events: none;
          z-index: 0;
          overflow: hidden;
          transition: opacity 0.7s ease;
        }

        .atmosphere-layer.transitioning {
          opacity: 0.6;
        }

        /* ============================================
           VERTICAL GRADIENT HAZE
           ============================================ */
        .atmosphere-gradient {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to bottom,
            rgba(12, 18, 28, 0.06) 0%,
            rgba(14, 22, 34, 0.04) 25%,
            rgba(16, 24, 38, 0.02) 50%,
            transparent 80%
          );
          opacity: 0.8;
        }

        .atmosphere-gradient::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 40%;
          background: radial-gradient(
            ellipse 80% 100% at 50% 0%,
            var(--glow) 0%,
            transparent 70%
          );
          opacity: 0.03;
        }

        /* ============================================
           SPARSE DATA STARS — Very Faint
           ============================================ */
        .atmosphere-stars {
          position: absolute;
          inset: 0;
        }

        .data-star {
          position: absolute;
          width: 2px;
          height: 2px;
          background: rgba(180, 200, 220, 0.8);
          border-radius: 50%;
          animation: star-drift 45s ease-in-out infinite;
          box-shadow: 0 0 4px rgba(180, 200, 220, 0.3);
        }

        @keyframes star-drift {
          0%, 100% { 
            transform: translate(0, 0); 
            opacity: var(--star-opacity, 0.03);
          }
          25% { 
            transform: translate(3px, 2px); 
            opacity: calc(var(--star-opacity, 0.03) * 1.3);
          }
          50% { 
            transform: translate(-2px, 4px); 
            opacity: var(--star-opacity, 0.03);
          }
          75% { 
            transform: translate(2px, -2px); 
            opacity: calc(var(--star-opacity, 0.03) * 0.8);
          }
        }

        /* ============================================
           SCENARIO-TINTED MIST BAND
           ============================================ */
        .atmosphere-mist {
          position: absolute;
          top: 35%;
          left: 0;
          right: 0;
          height: 15%;
          opacity: 0.025;
          filter: blur(30px);
          transition: background 0.7s ease, opacity 0.7s ease;
        }

        .atmosphere-layer.transitioning .atmosphere-mist {
          opacity: 0.04;
        }

        /* ============================================
           GRID FADE (upward dissolve)
           ============================================ */
        .atmosphere-layer::before {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 30%;
          background: linear-gradient(
            to top,
            rgba(10, 16, 24, 0.08) 0%,
            transparent 100%
          );
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}

