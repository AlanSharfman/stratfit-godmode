// src/components/valuation/ValuationTab.tsx
// STRATFIT — Valuation Framework (God Mode)
// Capital Markets Framing: 4 probability bands + composite
// Translates simulation outcomes into defensible valuation bands.

import { useMemo } from 'react';
import { useScenarioStore, type ScenarioId } from '@/state/scenarioStore';
import { useSimulationStore } from '@/state/simulationStore';
import { useEngineStore } from '@/state/engineStore';
import './ValuationStyles.css';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface Band {
  label: string;
  method: string;
  low: number;
  mid: number;
  high: number;
  note: string;
  color: string;
  weight: number; // for probability-weighted composite
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function fmt$(v: number): string {
  if (Math.abs(v) >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(1)}B`;
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

function pctOf(val: number, low: number, high: number): number {
  if (high <= low) return 50;
  return Math.max(0, Math.min(100, ((val - low) / (high - low)) * 100));
}

// ═══════════════════════════════════════════════════════════════════════════════
// BAND BUILDER (from engine data)
// ═══════════════════════════════════════════════════════════════════════════════

function buildBands(
  arrCurrent: number,
  evMetric: number,
  growthPct: number,
  runwayMonths: number,
  grossMargin: number,
  mcP10: number | null,
  mcP50: number | null,
  mcP90: number | null,
): Band[] {
  // 1) DCF Band — simplified startup DCF
  // Uses terminal ARR multiple with growth and risk discounting
  const wacc = 0.25; // early stage weighted average cost of capital
  const terminalMultiple = Math.max(3, Math.min(15, growthPct * 0.15 + 5));
  const projectedArr = arrCurrent * (1 + growthPct);
  const terminalValue = projectedArr * terminalMultiple;
  const dcfMid = terminalValue / Math.pow(1 + wacc, 3); // 3-year discount
  const dcfLow = dcfMid * 0.6;
  const dcfHigh = dcfMid * 1.5;

  // 2) Revenue Multiple Band
  const baseMultiple = growthPct >= 0.5 ? 12 : growthPct >= 0.3 ? 8 : growthPct >= 0.15 ? 6 : 4;
  const marginAdj = grossMargin >= 0.75 ? 1.15 : grossMargin >= 0.6 ? 1.0 : 0.85;
  const runwayAdj = runwayMonths >= 24 ? 1.1 : runwayMonths >= 12 ? 1.0 : 0.75;
  const revMultiple = baseMultiple * marginAdj * runwayAdj;
  const revMid = arrCurrent * revMultiple;
  const revLow = arrCurrent * (revMultiple * 0.6);
  const revHigh = arrCurrent * (revMultiple * 1.4);

  // 3) Monte Carlo Band (from simulation if available)
  const mcLow = mcP10 ?? dcfLow * 0.7;
  const mcMid = mcP50 ?? dcfMid * 0.9;
  const mcHigh = mcP90 ?? dcfHigh * 1.1;

  // 4) Comparable Spread
  // Sector median multiple range
  const compMultLow = 4;
  const compMultMid = 7;
  const compMultHigh = 12;
  const compLow = arrCurrent * compMultLow;
  const compMid = arrCurrent * compMultMid;
  const compHigh = arrCurrent * compMultHigh;

  return [
    {
      label: "DCF BAND",
      method: "Discounted Cash Flow",
      low: dcfLow,
      mid: dcfMid,
      high: dcfHigh,
      note: `${terminalMultiple.toFixed(1)}x terminal · ${(wacc * 100).toFixed(0)}% WACC · 3yr horizon`,
      color: "#8b5cf6",
      weight: 0.25,
    },
    {
      label: "REVENUE MULTIPLE",
      method: "ARR Multiple",
      low: revLow,
      mid: revMid,
      high: revHigh,
      note: `${revMultiple.toFixed(1)}x ARR · Margin adj ${marginAdj.toFixed(2)}x · Runway adj ${runwayAdj.toFixed(2)}x`,
      color: "#22d3ee",
      weight: 0.30,
    },
    {
      label: "MONTE CARLO",
      method: "Simulation P10–P90",
      low: mcLow,
      mid: mcMid,
      high: mcHigh,
      note: mcP50 != null ? `From ${1000}-run simulation` : "Estimated (no simulation run yet)",
      color: "#10b981",
      weight: 0.25,
    },
    {
      label: "COMPARABLE SPREAD",
      method: "Sector Benchmarks",
      low: compLow,
      mid: compMid,
      high: compHigh,
      note: `${compMultLow}x–${compMultHigh}x sector range · Median ${compMultMid}x`,
      color: "#f59e0b",
      weight: 0.20,
    },
  ];
}

// ═══════════════════════════════════════════════════════════════════════════════
// BAND ROW COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

function BandRow({ band, globalLow, globalHigh }: { band: Band; globalLow: number; globalHigh: number }) {
  const leftPct = pctOf(band.low, globalLow, globalHigh);
  const midPct = pctOf(band.mid, globalLow, globalHigh);
  const rightPct = pctOf(band.high, globalLow, globalHigh);
  const widthPct = Math.max(2, rightPct - leftPct);

  return (
    <div className="sf-val-band">
      <div className="sf-val-band-header">
        <span className="sf-val-band-label" style={{ color: band.color }}>{band.label}</span>
        <span className="sf-val-band-method">{band.method}</span>
      </div>
      <div className="sf-val-band-track">
        {/* Range bar */}
        <div
          className="sf-val-band-range"
          style={{
            left: `${leftPct}%`,
            width: `${widthPct}%`,
            background: `${band.color}20`,
            borderColor: `${band.color}40`,
          }}
        />
        {/* Mid marker */}
        <div
          className="sf-val-band-mid"
          style={{ left: `${midPct}%`, background: band.color }}
        />
      </div>
      <div className="sf-val-band-values">
        <span className="sf-val-band-low">{fmt$(band.low)}</span>
        <span className="sf-val-band-mid-val" style={{ color: band.color }}>{fmt$(band.mid)}</span>
        <span className="sf-val-band-high">{fmt$(band.high)}</span>
      </div>
      <div className="sf-val-band-note">{band.note}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════════

export default function ValuationTab() {
  const engineResults = useScenarioStore((s) => s.engineResults);
  const activeScenarioId = useScenarioStore((s) => s.activeScenarioId);
  const simulation = useSimulationStore((s) => s.summary);
  const engineStatus = useEngineStore((s) => s.status);
  const confidencePct = useEngineStore((s) => s.confidencePct);

  const sid: ScenarioId = activeScenarioId || "base";
  const kpis = engineResults?.[sid]?.kpis;

  // ── Extract engine values ─────────────────────────────────────────────────
  const arrCurrent = kpis?.arrCurrent?.value ?? 2_000_000;
  const evMetric = kpis?.enterpriseValue?.value ?? 50;
  const growthRaw = (kpis?.arrGrowthPct as any)?.value ?? 0.08;
  const growthPct = growthRaw > 1 ? growthRaw / 100 : growthRaw;
  const runwayMonths = kpis?.runway?.value ?? 18;
  const grossMargin = 0.74; // from engine constants

  // Monte Carlo data (if available)
  const mcP10 = simulation ? simulation.arrP10 * 4 : null; // rough EV = 4x ARR
  const mcP50 = simulation ? simulation.arrMedian * 5 : null;
  const mcP90 = simulation ? simulation.arrP90 * 6 : null;

  // ── Build bands ───────────────────────────────────────────────────────────
  const bands = useMemo(
    () => buildBands(arrCurrent, evMetric, growthPct, runwayMonths, grossMargin, mcP10, mcP50, mcP90),
    [arrCurrent, evMetric, growthPct, runwayMonths, grossMargin, mcP10, mcP50, mcP90]
  );

  // ── Global scale (for consistent track width) ─────────────────────────────
  const globalLow = useMemo(() => Math.min(...bands.map(b => b.low)) * 0.8, [bands]);
  const globalHigh = useMemo(() => Math.max(...bands.map(b => b.high)) * 1.1, [bands]);

  // ── Composite valuation (probability-weighted) ────────────────────────────
  const composite = useMemo(() => {
    const weightedSum = bands.reduce((sum, b) => sum + b.mid * b.weight, 0);
    const totalWeight = bands.reduce((sum, b) => sum + b.weight, 0);
    return weightedSum / totalWeight;
  }, [bands]);

  const compositeRange = useMemo(() => {
    const low = bands.reduce((sum, b) => sum + b.low * b.weight, 0) / bands.reduce((sum, b) => sum + b.weight, 0);
    const high = bands.reduce((sum, b) => sum + b.high * b.weight, 0) / bands.reduce((sum, b) => sum + b.weight, 0);
    return { low, high };
  }, [bands]);

  return (
    <div className="sf-val-root">
      {/* ═══ HEADER ═══ */}
      <header className="sf-val-header">
        <div className="sf-val-header-left">
          <span className="sf-val-badge">VALUATION</span>
          <span className="sf-val-title">CAPITAL MARKETS FRAMING</span>
        </div>
        <div className="sf-val-header-right">
          {engineStatus === "Complete" && confidencePct != null && (
            <span className="sf-val-conf">
              <span className="sf-val-conf-dot" />
              Confidence: {confidencePct}%
            </span>
          )}
        </div>
      </header>

      {/* ═══ COMPOSITE RESULT ═══ */}
      <section className="sf-val-composite">
        <div className="sf-val-composite-label">COMPOSITE VALUATION (PROBABILITY-WEIGHTED)</div>
        <div className="sf-val-composite-value">{fmt$(composite)}</div>
        <div className="sf-val-composite-range">
          Range: {fmt$(compositeRange.low)} — {fmt$(compositeRange.high)}
        </div>
        <div className="sf-val-composite-basis">
          Based on {bands.length} independent valuation methods
        </div>
      </section>

      {/* ═══ 4 PROBABILITY BANDS ═══ */}
      <section className="sf-val-bands">
        {bands.map((band) => (
          <BandRow key={band.label} band={band} globalLow={globalLow} globalHigh={globalHigh} />
        ))}
      </section>

      {/* ═══ METHODOLOGY NOTE ═══ */}
      <footer className="sf-val-footer">
        <div className="sf-val-footer-text">
          Valuations derived from engine KPIs ({fmt$(arrCurrent)} ARR, {(growthPct * 100).toFixed(0)}% growth, {runwayMonths}mo runway).
          {simulation ? " Monte Carlo band sourced from simulation results." : " Run simulation for Monte Carlo precision."}
        </div>
      </footer>
    </div>
  );
}
