// src/components/valuation/ValuationPage.tsx
// STRATFIT — Valuation Page GOD MODE Orchestrator
// Probability-first: p50 headline · p25–p75 operating range · p10–p90 stress range
// Winsorised outliers. Tight, decision-grade display. Board-ready.

import { useState, useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import styles from "./ValuationPage.module.css";

// Sub-components
import ValuationOutcomeBlock from "./ValuationOutcomeBlock";
import ValuationMethodSelector, { type ValuationMethodId } from "./ValuationMethodSelector";
import ValuationSensitivity from "./ValuationSensitivity";
import ValuationDriverSpider from "./ValuationDriverSpider";
import ValuationMarketPosition from "./ValuationMarketPosition";
import ValuationEngineTransparency from "./ValuationEngineTransparency";
import ValuationDisclosure from "./ValuationDisclosure";

// Stores
import { useSimulationStore } from "@/state/simulationStore";
import { useLeverStore } from "@/state/leverStore";
import { useValuationStore } from "@/state/valuationStore";

// Valuation distribution logic
import {
  summarizeFromSamples,
  summarizeFromPercentiles,
  summarizeFromSingleEV,
  getSaneBounds,
  clampMultiple,
  type ValuationDistributionSummary,
  type PercentileInput,
} from "@/logic/valuation/summarizeValuationDistribution";

// ============================================================================
// HELPER: Format money
// ============================================================================

const fmtM = (v: number): string => {
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
};

// ============================================================================
// VALUATION CALCULATION (local, derived from inputs)
// ============================================================================

interface ValInputs {
  arr: number;
  growth: number;
  nrr: number;
  grossMargin: number;
  rule40: number;
  stage: "pre-seed" | "seed" | "series-a" | "series-b" | "growth";
}

function calcMultiple(inputs: ValInputs, method: ValuationMethodId) {
  const bounds = getSaneBounds(inputs.stage);

  // Base multiple from growth
  let baseMultiple = 5;
  if (inputs.growth >= 100) baseMultiple = 15;
  else if (inputs.growth >= 75) baseMultiple = 12;
  else if (inputs.growth >= 50) baseMultiple = 9;
  else if (inputs.growth >= 30) baseMultiple = 7;

  // NRR adjustment
  let nrrMult = 1;
  if (inputs.nrr >= 130) nrrMult = 1.3;
  else if (inputs.nrr >= 120) nrrMult = 1.2;
  else if (inputs.nrr >= 110) nrrMult = 1.1;
  else if (inputs.nrr < 100) nrrMult = 0.8;

  // Gross margin adjustment
  let marginMult = 1;
  if (inputs.grossMargin >= 80) marginMult = 1.15;
  else if (inputs.grossMargin >= 70) marginMult = 1.05;
  else if (inputs.grossMargin < 60) marginMult = 0.85;

  // Rule of 40
  let r40Mult = 1;
  if (inputs.rule40 >= 60) r40Mult = 1.25;
  else if (inputs.rule40 >= 40) r40Mult = 1.1;
  else if (inputs.rule40 < 20) r40Mult = 0.8;

  // Stage
  const stageMults: Record<string, number> = {
    "pre-seed": 0.7,
    seed: 0.85,
    "series-a": 1.0,
    "series-b": 1.1,
    growth: 1.15,
  };

  // Method adjustments
  let methodMod = 1;
  if (method === "dcf") methodMod = 0.92;
  else if (method === "revenue-multiple") methodMod = 1.05;
  else if (method === "comparables") methodMod = 0.97;

  const rawMultiple =
    baseMultiple * nrrMult * marginMult * r40Mult * (stageMults[inputs.stage] ?? 1) * methodMod;

  // Clamp to sane bounds
  const finalMultiple = clampMultiple(rawMultiple, bounds.minARRMultiple, bounds.maxARRMultiple);

  return {
    multiple: finalMultiple,
    components: {
      base: baseMultiple,
      nrr: nrrMult,
      margin: marginMult,
      rule40: r40Mult,
      stage: stageMults[inputs.stage] ?? 1,
    },
  };
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ValuationPage() {
  // ── Local input state ──
  const [inputs, setInputs] = useState<ValInputs>({
    arr: 4_000_000,
    growth: 45,
    nrr: 115,
    grossMargin: 75,
    rule40: 50,
    stage: "seed",
  });

  const [method, setMethod] = useState<ValuationMethodId>("stratfit");

  // ── Store data ──
  const fullResult = useSimulationStore((s) => s.fullResult);
  const assessmentPayload = useSimulationStore((s) => s.assessmentPayload);
  const simulation = useSimulationStore((s) => s.summary);
  const hasSimulated = useSimulationStore((s) => s.hasSimulated);
  const levers = useLeverStore(useShallow((s) => s.levers));
  const valStoreSnapshot = useValuationStore((s) => s.snapshot);

  // ── Derive multiple from local inputs + method ──
  const { multiple, components } = useMemo(() => calcMultiple(inputs, method), [inputs, method]);

  // ── Derive EV distribution (best available source) ──
  const dist: ValuationDistributionSummary = useMemo(() => {
    // PRIORITY 1: Full Monte Carlo result in memory → real EV samples
    if (fullResult?.allSimulations && fullResult.allSimulations.length >= 100) {
      const evSamples = fullResult.allSimulations.map((s) => s.finalARR * multiple);
      return summarizeFromSamples(evSamples);
    }

    // PRIORITY 2: Persisted assessment payload (percentiles only) → percentile-based summary
    if (assessmentPayload?.arrPercentiles) {
      const arrP = assessmentPayload.arrPercentiles;
      const evPctls: PercentileInput = {
        p10: arrP.p10 * multiple,
        p25: (arrP.p10 + arrP.p50) / 2 * multiple, // approximate p25
        p50: arrP.p50 * multiple,
        p75: (arrP.p50 + arrP.p90) / 2 * multiple, // approximate p75
        p90: arrP.p90 * multiple,
      };
      return summarizeFromPercentiles(evPctls);
    }

    // PRIORITY 3: No simulation data → synthetic from single EV
    const singleEV = inputs.arr * multiple;
    // Use tighter uncertainty (0.15) for synthetic — don't pretend we know more than we do
    return summarizeFromSingleEV(singleEV, 0.20);
  }, [fullResult, assessmentPayload, inputs.arr, multiple]);

  // ── Confidence: derived from data quality score ──
  const confidence = useMemo(() => {
    let c = 55; // base
    if (dist.isFromRealDistribution) c += 20;
    else if (assessmentPayload) c += 10;
    if (hasSimulated && simulation) {
      c += 10;
      if ((simulation.survivalRate ?? 0) > 0.5) c += 5;
    }
    if (inputs.nrr >= 110) c += 3;
    if (inputs.grossMargin >= 70) c += 3;
    return Math.min(95, c);
  }, [dist.isFromRealDistribution, assessmentPayload, hasSimulated, simulation, inputs.nrr, inputs.grossMargin]);

  // ── Volatility: derived from operating range width ──
  const volatility = useMemo((): "Low" | "Medium" | "High" => {
    if (dist.p50 <= 0) return "High";
    const spread = (dist.p75 - dist.p25) / dist.p50;
    if (spread > 0.5) return "High";
    if (spread > 0.25) return "Medium";
    return "Low";
  }, [dist]);

  // ── Sensitivity drivers (same as before, from local calc) ──
  const sensitivityDrivers = useMemo(() => {
    const baseEV = dist.p50;
    if (baseEV <= 0) return [];
    const drivers = [
      {
        name: "Revenue Growth",
        deltaEV: baseEV * (components.base >= 9 ? 0.15 : 0.25) * (inputs.growth >= 50 ? 1 : -1),
        impact: 0.9,
      },
      {
        name: "Net Revenue Retention",
        deltaEV: baseEV * (components.nrr - 1) * 0.8,
        impact: Math.abs(components.nrr - 1) * 4,
      },
      {
        name: "Gross Margin",
        deltaEV: baseEV * (components.margin - 1) * 0.6,
        impact: Math.abs(components.margin - 1) * 3,
      },
      {
        name: "Rule of 40",
        deltaEV: baseEV * (components.rule40 - 1) * 0.5,
        impact: Math.abs(components.rule40 - 1) * 3,
      },
      {
        name: "Stage Premium",
        deltaEV: baseEV * (components.stage - 1) * 0.4,
        impact: Math.abs(components.stage - 1) * 3,
      },
    ];
    const maxImpact = Math.max(...drivers.map((d) => d.impact), 0.01);
    return drivers.map((d) => ({ ...d, impact: Math.min(1, d.impact / maxImpact) }));
  }, [dist.p50, components, inputs.growth]);

  // ── Spider axes ──
  const spiderAxes = useMemo(() => {
    const l = levers;
    const growthScore = Math.round(((l.demandStrength ?? 50) + (l.expansionVelocity ?? 50)) / 2);
    const marginScore = Math.round(((l.costDiscipline ?? 50) + (100 - (l.operatingDrag ?? 50))) / 2);
    const retentionScore = Math.min(100, Math.round((inputs.nrr / 180) * 100));
    const capitalScore = Math.round(((l.costDiscipline ?? 50) + (100 - (l.operatingDrag ?? 50))) / 2);
    const marketScore = Math.round(((100 - (l.marketVolatility ?? 50)) + (l.pricingPower ?? 50)) / 2);
    const riskScore = Math.round(((100 - (l.executionRisk ?? 50)) + (100 - (l.marketVolatility ?? 50))) / 2);

    return [
      { label: "Growth", baseline: 50, scenario: growthScore },
      { label: "Margin", baseline: 50, scenario: marginScore },
      { label: "Retention", baseline: 50, scenario: retentionScore },
      { label: "Capital Eff.", baseline: 50, scenario: capitalScore },
      { label: "Market Pos.", baseline: 50, scenario: marketScore },
      { label: "Risk Stability", baseline: 50, scenario: riskScore },
    ];
  }, [levers, inputs.nrr]);

  // ── Market position ──
  const marketMultiples = useMemo(() => {
    const yourMultiple = multiple;
    const comps = valStoreSnapshot?.comparables;
    if (comps && comps.length > 0) {
      const sorted = [...comps].sort((a, b) => a.arrMultiple - b.arrMultiple);
      const medianIdx = Math.floor(sorted.length / 2);
      const upperIdx = Math.floor(sorted.length * 0.75);
      return {
        your: yourMultiple,
        median: sorted[medianIdx].arrMultiple,
        upper: sorted[upperIdx]?.arrMultiple ?? sorted[medianIdx].arrMultiple * 1.35,
      };
    }
    return { your: yourMultiple, median: 6.9, upper: 9.2 };
  }, [multiple, valStoreSnapshot?.comparables]);

  // ── Input updater ──
  const update = <K extends keyof ValInputs>(key: K, val: ValInputs[K]) =>
    setInputs((prev) => ({ ...prev, [key]: val }));

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {/* ═══ LAYER 1: PROBABILITY-FIRST OUTCOME BLOCK ═══ */}
        <ValuationOutcomeBlock
          dist={dist}
          confidence={confidence}
          volatility={volatility}
          multiple={multiple}
        />

        {/* ═══ LAYER 2: METHOD SELECTOR ═══ */}
        <ValuationMethodSelector value={method} onChange={setMethod} />

        {/* ═══ INPUT CONTROLS (compact institutional strip) ═══ */}
        <div className={styles.methodBar} style={{ flexWrap: "wrap", gap: 16 }}>
          <InputField
            label="ARR"
            value={inputs.arr}
            onChange={(v) => update("arr", v)}
            min={100_000}
            max={50_000_000}
            step={100_000}
            format={fmtM}
          />
          <InputField
            label="Growth"
            value={inputs.growth}
            onChange={(v) => update("growth", v)}
            min={0}
            max={200}
            step={5}
            suffix="%"
          />
          <InputField
            label="NRR"
            value={inputs.nrr}
            onChange={(v) => update("nrr", v)}
            min={60}
            max={180}
            step={5}
            suffix="%"
          />
          <InputField
            label="Margin"
            value={inputs.grossMargin}
            onChange={(v) => update("grossMargin", v)}
            min={30}
            max={95}
            step={5}
            suffix="%"
          />
          <InputField
            label="Rule 40"
            value={inputs.rule40}
            onChange={(v) => update("rule40", v)}
            min={-20}
            max={100}
            step={5}
            suffix="%"
          />
          <StageSelect value={inputs.stage} onChange={(v) => update("stage", v)} />
        </div>

        {/* ═══ LAYERS 3 + 4: SENSITIVITY + SPIDER (side by side) ═══ */}
        <div className={styles.dualGrid}>
          <ValuationSensitivity drivers={sensitivityDrivers} />
          <ValuationDriverSpider axes={spiderAxes} />
        </div>

        {/* ═══ LAYER 5: MARKET POSITION ═══ */}
        <ValuationMarketPosition
          yourMultiple={marketMultiples.your}
          medianMultiple={marketMultiples.median}
          upperQuartile={marketMultiples.upper}
        />

        {/* ═══ LAYER 6: ENGINE TRANSPARENCY + RANGE DISCIPLINE ═══ */}
        <ValuationEngineTransparency
          iterations={fullResult?.iterations ?? 10_000}
          horizonMonths={fullResult?.timeHorizonMonths ?? 36}
          discountRate={12.0}
          terminalGrowth={3.0}
          seed="deterministic"
          isFromRealDistribution={dist.isFromRealDistribution}
          winsorisationApplied={dist.winsorisationApplied}
          winsorLow={dist.winsorLow}
          winsorHigh={dist.winsorHigh}
          displayPercentiles="p10–p90 (stress) · p25–p75 (operating)"
        />

        {/* ═══ LAYER 7: LEGAL DISCLOSURE ═══ */}
        <ValuationDisclosure />
      </div>
    </div>
  );
}

// ============================================================================
// COMPACT INPUT FIELDS (inline, institutional)
// ============================================================================

function InputField({
  label,
  value,
  onChange,
  min,
  max,
  step,
  suffix,
  format,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  format?: (v: number) => string;
}) {
  const display = format ? format(value) : `${value}${suffix ?? ""}`;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span
        style={{
          fontSize: 10,
          color: "rgba(255,255,255,0.5)",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
      <button
        onClick={() => onChange(Math.max(min, value - step))}
        style={{
          background: "none",
          border: "none",
          color: "rgba(255,255,255,0.5)",
          cursor: "pointer",
          fontSize: 14,
          padding: "2px 4px",
        }}
      >
        −
      </button>
      <span
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 13,
          color: "#00E0FF",
          minWidth: 50,
          textAlign: "center",
        }}
      >
        {display}
      </span>
      <button
        onClick={() => onChange(Math.min(max, value + step))}
        style={{
          background: "none",
          border: "none",
          color: "rgba(255,255,255,0.5)",
          cursor: "pointer",
          fontSize: 14,
          padding: "2px 4px",
        }}
      >
        +
      </button>
    </div>
  );
}

function StageSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: "pre-seed" | "seed" | "series-a" | "series-b" | "growth") => void;
}) {
  const stages = [
    { id: "pre-seed", label: "Pre-Seed" },
    { id: "seed", label: "Seed" },
    { id: "series-a", label: "Series A" },
    { id: "series-b", label: "Series B" },
    { id: "growth", label: "Growth" },
  ] as const;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span
        style={{
          fontSize: 10,
          color: "rgba(255,255,255,0.5)",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        Stage
      </span>
      {stages.map((s) => (
        <button
          key={s.id}
          onClick={() => onChange(s.id)}
          style={{
            background: value === s.id ? "rgba(0,224,255,0.1)" : "transparent",
            border: value === s.id ? "1px solid rgba(0,224,255,0.3)" : "1px solid transparent",
            borderRadius: 4,
            padding: "3px 8px",
            color: value === s.id ? "#00E0FF" : "rgba(255,255,255,0.5)",
            fontSize: 10,
            cursor: "pointer",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
