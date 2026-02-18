// src/components/strategy-studio/LeverStack.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Lever Stack 2.0 (Structured Domain Groups)
// Growth · Pricing · Cost · Capital · Operations
// Each lever: Label, Baseline→Scenario, Delta Badge, Slider
// Institutional slider: 1px track, solid #00E0FF fill, 10px handle, no glow
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState, useCallback, memo } from "react";
import type { LeverState } from "@/logic/calculateMetrics";
import Slider from "@/components/ui/Slider";

// ── Domain definitions ──────────────────────────────────────────────────

interface LeverDef {
  key: keyof LeverState;
  label: string;
}

interface DomainDef {
  id: string;
  title: string;
  levers: LeverDef[];
}

const DOMAINS: DomainDef[] = [
  {
    id: "growth",
    title: "Growth",
    levers: [
      { key: "demandStrength", label: "Demand Strength" },
      { key: "expansionVelocity", label: "Expansion Velocity" },
    ],
  },
  {
    id: "pricing",
    title: "Pricing",
    levers: [
      { key: "pricingPower", label: "Pricing Power" },
    ],
  },
  {
    id: "cost",
    title: "Cost",
    levers: [
      { key: "costDiscipline", label: "Cost Discipline" },
      { key: "operatingDrag", label: "Operating Drag" },
    ],
  },
  {
    id: "capital",
    title: "Capital",
    levers: [
      { key: "marketVolatility", label: "Market Volatility" },
      { key: "executionRisk", label: "Execution Risk" },
      { key: "fundingPressure", label: "Funding Pressure" },
    ],
  },
  {
    id: "operations",
    title: "Operations",
    levers: [
      { key: "hiringIntensity", label: "Hiring Intensity" },
    ],
  },
];

// ── Main Component ──────────────────────────────────────────────────────

interface LeverStackProps {
  levers: LeverState;
  onLeverChange: (key: keyof LeverState, value: number) => void;
  onLeverDragStart?: (key: keyof LeverState) => void;
  onLeverDragEnd?: (key: keyof LeverState, finalValue: number) => void;
  readOnly?: boolean;
}

export const LeverStack: React.FC<LeverStackProps> = memo(({
  levers,
  onLeverChange,
  onLeverDragStart,
  onLeverDragEnd,
  readOnly = false,
}) => {
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(DOMAINS.map((d) => d.id))
  );

  const toggleDomain = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const domains = DOMAINS;

  return (
    <div className={`sf-leverpanel ${readOnly ? "sf-readonly" : ""}`}>
      <div className="sf-bezel">
        <div className="sf-bezel-inner">
          {domains.map((domain) => {
            const isOpen = expanded.has(domain.id);
            return (
              <section key={domain.id} className="sf-section">
                <header className="sf-section-hdr" onClick={() => toggleDomain(domain.id)}>
                  <div className="sf-section-title">{domain.title}</div>
                  <div className="sf-section-hdr-right">
                    <div className="sf-led" />
                    <div className={`sf-chev ${isOpen ? "open" : ""}`}>▾</div>
                  </div>
                </header>

                {isOpen && (
                  <div className="sf-section-body">
                    {domain.levers.map((lever) => {
                      const v = levers[lever.key] ?? 0;
                      return (
                        <div key={String(lever.key)} className="sf-row">
                          <div className="sf-row-top">
                            <div className="sf-label">
                              {lever.label}
                              <span
                                className="sf-info"
                                title="Info (hook up later)"
                                onMouseEnter={() => onLeverDragStart?.(lever.key)}
                                onMouseLeave={() => onLeverDragEnd?.(lever.key, v)}
                              >
                                i
                              </span>
                            </div>

                            <div className="sf-readout">
                              <span className="sf-readout-val">{Math.round(v)}</span>
                              <span className="sf-readout-unit">%</span>
                              <span className="sf-readout-underline" />
                            </div>
                          </div>

                          <div className="sf-row-slider">
                            <Slider
                              value={v}
                              min={0}
                              max={100}
                              step={1}
                              onStart={() => onLeverDragStart?.(lever.key)}
                              onEnd={() => onLeverDragEnd?.(lever.key, v)}
                              onChange={(nv) => onLeverChange(lever.key, nv)}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </div>

      <style>{`
        /* ═══════════════════════════════════════════════════════════════
           PANEL BEZEL (matches reference: rounded titanium shell)
           ═══════════════════════════════════════════════════════════════ */

        .sf-leverpanel {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: stretch;
          justify-content: stretch;
          padding: 10px;
          box-sizing: border-box;
        }

        .sf-readonly {
          opacity: 0.9;
          pointer-events: none;
          filter: saturate(0.9);
        }

        .sf-bezel {
          width: 100%;
          height: 100%;
          border-radius: 22px;
          padding: 10px;
          background:
            radial-gradient(120% 80% at 30% 10%, rgba(34,211,238,0.18), transparent 55%),
            linear-gradient(180deg, rgba(15,23,42,0.95), rgba(2,6,23,0.98));
          box-shadow:
            0 18px 50px rgba(0,0,0,0.55),
            inset 0 1px 0 rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.06);
          position: relative;
        }

        .sf-bezel::before {
          content: "";
          position: absolute;
          inset: 6px;
          border-radius: 18px;
          border: 1px solid rgba(34,211,238,0.10);
          pointer-events: none;
        }

        .sf-bezel-inner {
          width: 100%;
          height: 100%;
          border-radius: 16px;
          padding: 10px;
          background:
            linear-gradient(180deg, rgba(3,10,24,0.86), rgba(2,6,23,0.94));
          border: 1px solid rgba(255,255,255,0.04);
          box-shadow: inset 0 8px 30px rgba(0,0,0,0.55);
          overflow: auto;
        }

        .sf-bezel-inner::-webkit-scrollbar { width: 6px; }
        .sf-bezel-inner::-webkit-scrollbar-thumb {
          background: rgba(34,211,238,0.18);
          border-radius: 6px;
        }

        /* ═══════════════════════════════════════════════════════════════
           SECTIONS (Growth Vector / Operational Engine / Risk Pressure)
           ═══════════════════════════════════════════════════════════════ */

        .sf-section {
          border-radius: 14px;
          margin-bottom: 12px;
          background:
            linear-gradient(180deg, rgba(10,22,40,0.55), rgba(2,6,23,0.40));
          border: 1px solid rgba(255,255,255,0.05);
          box-shadow:
            0 10px 30px rgba(0,0,0,0.35),
            inset 0 1px 0 rgba(255,255,255,0.04);
          overflow: hidden;
        }

        .sf-section-hdr {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 14px 10px;
          cursor: pointer;
          user-select: none;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          background: linear-gradient(180deg, rgba(15,23,42,0.30), transparent);
        }

        .sf-section-title {
          font-size: 11px;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          font-weight: 800;
          color: rgba(34,211,238,0.95);
          text-shadow: 0 0 14px rgba(34,211,238,0.28);
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
        }

        .sf-section-hdr-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .sf-led {
          width: 8px;
          height: 8px;
          border-radius: 99px;
          background: rgba(34,211,238,0.95);
          box-shadow:
            0 0 10px rgba(34,211,238,0.55),
            0 0 24px rgba(34,211,238,0.22);
          opacity: 0.9;
        }

        .sf-chev {
          font-size: 12px;
          color: rgba(148,163,184,0.7);
          transform: translateY(-1px);
          transition: transform 140ms ease, color 140ms ease;
        }
        .sf-chev.open { transform: rotate(180deg) translateY(1px); color: rgba(34,211,238,0.7); }

        .sf-section-body {
          padding: 10px 12px 12px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        /* ═══════════════════════════════════════════════════════════════
           ROWS (label + info + slider + % readout)
           ═══════════════════════════════════════════════════════════════ */

        .sf-row {
          border-radius: 12px;
          padding: 10px 10px 12px;
          background:
            linear-gradient(180deg, rgba(2,6,23,0.72), rgba(2,6,23,0.46));
          border: 1px solid rgba(255,255,255,0.04);
          box-shadow:
            inset 0 8px 20px rgba(0,0,0,0.35);
        }

        .sf-row-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 8px;
        }

        .sf-label {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(226,232,240,0.78);
        }

        .sf-info {
          width: 18px;
          height: 18px;
          border-radius: 99px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-style: italic;
          font-family: Georgia, serif;
          color: rgba(34,211,238,0.75);
          border: 1px solid rgba(34,211,238,0.30);
          background: rgba(34,211,238,0.08);
          box-shadow: 0 0 10px rgba(34,211,238,0.12);
          cursor: help;
        }

        .sf-readout {
          display: flex;
          align-items: baseline;
          gap: 3px;
          min-width: 72px;
          justify-content: flex-end;
          position: relative;
        }

        .sf-readout-val {
          font-size: 22px;
          font-weight: 800;
          color: rgba(241,245,249,0.96);
          text-shadow: 0 0 16px rgba(34,211,238,0.10);
          font-variant-numeric: tabular-nums;
        }

        .sf-readout-unit {
          font-size: 12px;
          font-weight: 700;
          color: rgba(148,163,184,0.65);
          transform: translateY(-2px);
        }

        .sf-readout-underline {
          position: absolute;
          right: 0;
          bottom: -6px;
          width: 56px;
          height: 2px;
          background: rgba(34,211,238,0.55);
          box-shadow: 0 0 14px rgba(34,211,238,0.22);
          border-radius: 2px;
        }

        .sf-row-slider {
          padding: 0 2px;
        }
      `}</style>
    </div>
  );
});

LeverStack.displayName = "LeverStack";
