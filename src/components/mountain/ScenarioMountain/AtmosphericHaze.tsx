import React from "react";
import { clamp01 } from "./helpers";
import type { ScenarioId } from "@/state/scenarioStore";

export interface AtmosphericHazeProps {
  riskLevel: number;
  viewMode: "data" | "terrain" | "operator" | "investor";
  scenario: ScenarioId;
  isSeismicActive?: boolean;
  opacityMultiplier?: number;
}

export default function AtmosphericHaze({ riskLevel, viewMode, scenario, isSeismicActive = false, opacityMultiplier = 1 }: AtmosphericHazeProps) {
  const riskFactor = clamp01(riskLevel / 100);
  const viewFactor = (viewMode === "investor" || viewMode === "data") ? 0.5 : 0.7;
  
  const scenarioTone = scenario === "stress" ? 1.1 : 
                       scenario === "downside" ? 1.0 : 
                       scenario === "upside" ? 0.7 : 0.85;
  
  // BRIGHTENED: Reduced base opacity significantly
  const baseOpacity = 0.08 + (riskFactor * 0.05 * scenarioTone);
  const finalOpacity = baseOpacity * viewFactor * opacityMultiplier;
  
  // Altitude haze opacity (above mountain) - reduced
  const altitudeOpacity = 0.04 * viewFactor * opacityMultiplier;
  
  // SEISMIC: Amber warning overlay when risk is being actively manipulated
  const seismicIntensity = isSeismicActive ? Math.min(1, riskFactor * 1.5) : 0;

  return (
    <div className="atmospheric-haze">
      {/* SEISMIC OVERLAY - Amber warning pulse when risk sliders active */}
      {isSeismicActive && (
        <div 
          className="haze-layer haze-seismic"
          style={{ 
            opacity: seismicIntensity * 0.4,
            animation: 'seismic-pulse 150ms ease-in-out infinite'
          }}
        />
      )}
      
      {/* ALTITUDE HAZE - Above mountain (new) */}
      <div 
        className="haze-layer haze-altitude"
        style={{ opacity: altitudeOpacity }}
      />
      {/* PRESSURE BAND - Subtle horizontal band above peak */}
      <div 
        className="haze-layer haze-pressure-band"
        style={{ opacity: altitudeOpacity * 0.6 }}
      />
      {/* MINIMAL bottom haze layers - brightened */}
      <div 
        className="haze-layer haze-deep"
        style={{ opacity: finalOpacity * 0.2 }}
      />
      <div 
        className="haze-layer haze-mid"
        style={{ opacity: finalOpacity * 0.15 }}
      />

      <style>{`
        .atmospheric-haze {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          overflow: hidden;
        }

        .haze-layer {
          position: absolute;
          inset: 0;
        }

        /* ALTITUDE HAZE - lighter vertical gradient above mountain */
        .haze-altitude {
          background: linear-gradient(
            to bottom,
            rgba(20, 35, 55, 0.15) 0%,
            rgba(18, 30, 48, 0.08) 20%,
            transparent 40%
          );
        }

        /* PRESSURE BAND - very subtle horizontal band */
        .haze-pressure-band {
          background: linear-gradient(
            to bottom,
            transparent 20%,
            rgba(30, 50, 70, 0.06) 28%,
            transparent 38%
          );
          filter: blur(6px);
        }

        /* BRIGHTENED: Bottom haze layers - much lighter */
        .haze-deep {
          background: radial-gradient(
            ellipse 120% 60% at 50% 75%,
            rgba(15, 30, 50, 0.2) 0%,
            rgba(12, 25, 40, 0.08) 40%,
            transparent 60%
          );
        }

        .haze-mid {
          background: radial-gradient(
            ellipse 100% 50% at 45% 70%,
            rgba(20, 38, 58, 0.12) 0%,
            rgba(15, 30, 48, 0.05) 35%,
            transparent 50%
          );
        }
        
        /* SEISMIC OVERLAY - Amber warning when risk active */
        .haze-seismic {
          background: radial-gradient(
            ellipse 100% 80% at 50% 60%,
            rgba(245, 158, 11, 0.25) 0%,
            rgba(245, 158, 11, 0.1) 40%,
            transparent 70%
          );
          mix-blend-mode: screen;
        }
        
        @keyframes seismic-pulse {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(-2px, 1px); }
          50% { transform: translate(1px, -1px); }
          75% { transform: translate(2px, 1px); }
        }
      `}</style>
    </div>
  );
}
