// src/core/command/generateCommandBriefing.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Deterministic Command Briefing Generator
//
// Produces a structured 60–75s documentary-style briefing from valuation,
// risk, dispersion, waterfall, and provenance data.
//
// Input: scenario analytics (all from existing selectors)
// Output: { sections[], plainText, durationSec }
//
// RULES:
//   - Deterministic: same input → same output (no randomness)
//   - Probability-first language only
//   - FORBIDDEN: recommend, guarantee, certainty, should
//   - ALLOWED: probability, likelihood, signal, scenario indicator,
//              dispersion, range, suggests, indicates
// ═══════════════════════════════════════════════════════════════════════════

// ── Types ──

export interface BriefingSection {
  /** Start timestamp in seconds */
  t: number;
  /** Section title */
  title: string;
  /** Narrative lines within this section */
  lines: string[];
}

export interface CommandBriefing {
  sections: BriefingSection[];
  plainText: string;
  durationSec: number;
}

export interface BriefingInputs {
  /** Scenario display name */
  scenarioName: string;
  /** Baseline display name */
  baselineName: string;
  /** Blended EV (P50 median) */
  evP50: number | null;
  /** DCF enterprise value */
  evDCF: number | null;
  /** Revenue multiple EV */
  evRevMultiple: number | null;
  /** EBITDA multiple EV */
  evEbitdaMultiple: number | null;
  /** P10 pessimistic EV (derived or synthetic) */
  evP10: number | null;
  /** P90 optimistic EV (derived or synthetic) */
  evP90: number | null;
  /** Risk index (0-100, higher = healthier) */
  riskIndex: number | null;
  /** Runway in months */
  runwayMonths: number | null;
  /** Dispersion width (max EV - min EV) */
  dispersionWidth: number | null;
  /** Volatility factor (0-1) */
  volatility: number | null;
  /** Waterfall steps (if available) */
  waterfallSteps: Array<{ label: string; delta: number; direction: string }> | null;
  /** Dashboard probability zones (optional) */
  probZones: { upside: number; base: number; stress: number } | null;
  /** Provenance data */
  provenance: {
    runId: string | number;
    seed: string | number | null;
    engineVersion: string;
  } | null;
}

// ── Formatting Helpers ──

function fmtEV(val: number | null): string {
  if (val == null || !isFinite(val)) return "—";
  const abs = Math.abs(val);
  if (abs >= 1_000_000_000) return `$${(val / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
  return `$${val.toFixed(0)}`;
}

function fmtPct(val: number | null, decimals = 0): string {
  if (val == null || !isFinite(val)) return "—";
  return `${val.toFixed(decimals)}%`;
}

function riskBand(idx: number | null): string {
  if (idx == null) return "undetermined";
  if (idx >= 70) return "low structural risk";
  if (idx >= 40) return "moderate structural risk";
  return "elevated structural risk";
}

function runwaySignal(months: number | null): string {
  if (months == null) return "Runway data unavailable.";
  if (months >= 24) return `Capital runway of ${Math.round(months)} months indicates a stable buffer.`;
  if (months >= 12) return `Capital runway of ${Math.round(months)} months signals a narrowing buffer — monitoring is indicated.`;
  return `Capital runway of ${Math.round(months)} months signals near-term capital pressure.`;
}

// ── Generator ──

export function generateCommandBriefing(inputs: BriefingInputs): CommandBriefing {
  const {
    scenarioName,
    baselineName,
    evP50,
    evDCF,
    evRevMultiple,
    evEbitdaMultiple,
    evP10,
    evP90,
    riskIndex,
    runwayMonths,
    dispersionWidth,
    volatility,
    waterfallSteps,
    probZones,
    provenance,
  } = inputs;

  const sections: BriefingSection[] = [];

  // ── Section 1: Situation (0–8s) ──
  sections.push({
    t: 0,
    title: "Situation",
    lines: [
      `This is a probabilistic analysis of scenario "${scenarioName}" evaluated against the "${baselineName}" baseline.`,
      `The terrain model represents the strategic landscape as derived from simulation parameters. All figures are model-derived estimates — not forecasts.`,
    ],
  });

  // ── Section 2: Value Range (8–18s) ──
  const evLines: string[] = [];
  if (evP50 != null) {
    evLines.push(`The blended enterprise value estimate (P50 median) is ${fmtEV(evP50)}.`);
  }
  if (evDCF != null || evRevMultiple != null || evEbitdaMultiple != null) {
    const methods: string[] = [];
    if (evDCF != null) methods.push(`DCF at ${fmtEV(evDCF)}`);
    if (evRevMultiple != null) methods.push(`revenue multiple at ${fmtEV(evRevMultiple)}`);
    if (evEbitdaMultiple != null) methods.push(`EBITDA multiple at ${fmtEV(evEbitdaMultiple)}`);
    evLines.push(`Methodology breakdown: ${methods.join(", ")}.`);
  }
  if (evP10 != null && evP90 != null) {
    evLines.push(
      `The probability range spans from P10 (${fmtEV(evP10)}) to P90 (${fmtEV(evP90)}), representing the 10th to 90th percentile of modelled outcomes.`,
    );
  }
  if (evLines.length === 0) {
    evLines.push("Valuation data is not yet available. Run a simulation to populate the value range.");
  }
  sections.push({ t: 8, title: "Value Range", lines: evLines });

  // ── Section 3: Drivers (18–32s) ──
  const driverLines: string[] = [];
  if (waterfallSteps && waterfallSteps.length > 0) {
    const positives = waterfallSteps.filter((s) => s.delta > 0).sort((a, b) => b.delta - a.delta);
    const negatives = waterfallSteps.filter((s) => s.delta < 0).sort((a, b) => a.delta - b.delta);

    if (positives.length > 0) {
      const top2 = positives.slice(0, 2);
      driverLines.push(
        `Primary value drivers: ${top2.map((s) => `${s.label} (+${fmtEV(s.delta)})`).join(" and ")}.`,
      );
    }
    if (negatives.length > 0) {
      const top2 = negatives.slice(0, 2);
      driverLines.push(
        `Offsetting factors: ${top2.map((s) => `${s.label} (${fmtEV(s.delta)})`).join(" and ")}.`,
      );
    }
    driverLines.push(
      `The waterfall attribution shows ${waterfallSteps.length} driver groups with sequential marginal impact on enterprise value.`,
    );
  } else {
    driverLines.push(
      "Waterfall attribution data is not available for this scenario. Driver analysis requires both baseline and scenario simulation results.",
    );
  }
  sections.push({ t: 18, title: "Drivers", lines: driverLines });

  // ── Section 4: Risk Weather (32–45s) ──
  const riskLines: string[] = [];
  riskLines.push(`The model indicates ${riskBand(riskIndex)} with a risk index of ${fmtPct(riskIndex)}.`);
  riskLines.push(runwaySignal(runwayMonths));
  if (volatility != null) {
    if (volatility > 0.6) {
      riskLines.push(`Outcome volatility is elevated (${fmtPct(volatility * 100)}), indicating wider dispersion across probability bands.`);
    } else if (volatility > 0.3) {
      riskLines.push(`Outcome volatility is moderate (${fmtPct(volatility * 100)}), consistent with typical early-stage uncertainty.`);
    } else {
      riskLines.push(`Outcome volatility is contained (${fmtPct(volatility * 100)}), suggesting relatively concentrated probability mass.`);
    }
  }
  sections.push({ t: 32, title: "Risk Weather", lines: riskLines });

  // ── Section 5: Robustness (45–58s) ──
  const robustLines: string[] = [];
  if (dispersionWidth != null) {
    robustLines.push(
      `Methodology dispersion is ${fmtEV(dispersionWidth)} — this measures the spread between the highest and lowest valuation approaches.`,
    );
    if (dispersionWidth > 5_000_000) {
      robustLines.push(
        `Wide dispersion signals significant model sensitivity to methodology choice. Interpret the blended figure with appropriate caution.`,
      );
    } else {
      robustLines.push(
        `Contained dispersion suggests reasonable convergence across valuation approaches.`,
      );
    }
  }
  if (probZones) {
    robustLines.push(
      `Probability zone distribution: upside scenario ${fmtPct(probZones.upside)}, base case ${fmtPct(probZones.base)}, stress case ${fmtPct(probZones.stress)}.`,
    );
  }
  if (evP10 != null && evP50 != null && evP90 != null) {
    const iqr = evP90 - evP10;
    const iqrRatio = evP50 > 0 ? iqr / evP50 : 0;
    robustLines.push(
      `Interquartile probability range: ${fmtEV(iqr)} (${fmtPct(iqrRatio * 100, 0)} of P50 median). ${iqrRatio > 0.5 ? "This indicates material outcome uncertainty." : "This indicates moderate outcome concentration."}`,
    );
  }
  if (robustLines.length === 0) {
    robustLines.push("Robustness analysis requires valuation data from a completed simulation.");
  }
  sections.push({ t: 45, title: "Robustness", lines: robustLines });

  // ── Section 6: Implications (58–75s) ──
  const implLines: string[] = [];
  implLines.push(
    `This analysis presents scenario indicators — not directives. The model quantifies probability-weighted outcomes under stated assumptions.`,
  );
  if (evP50 != null && riskIndex != null) {
    if (riskIndex >= 60 && evP50 > 0) {
      implLines.push(
        `Scenario indicators suggest a constructive trajectory with manageable structural risk. The probability mass is concentrated in positive territory.`,
      );
    } else if (riskIndex >= 30) {
      implLines.push(
        `Mixed signals across risk and value dimensions indicate a transitional landscape. Monitoring key inflection points is appropriate.`,
      );
    } else {
      implLines.push(
        `Elevated risk signals combined with the current value range indicate structural pressure. The probability distribution skews toward caution.`,
      );
    }
  }
  implLines.push(
    `Next review points: re-run analysis when baseline assumptions change materially, at scheduled board intervals, or upon significant market developments.`,
  );
  if (provenance) {
    implLines.push(
      `Provenance — Run: ${provenance.runId}${provenance.seed != null ? `, Seed: ${provenance.seed}` : ""}, Engine: ${provenance.engineVersion}. All outputs are subject to stated assumptions.`,
    );
  }
  sections.push({ t: 58, title: "Implications", lines: implLines });

  // ── Build plain text for audio ──
  const plainText = sections
    .map((s) => s.lines.join(" "))
    .join("\n\n");

  // ── Total duration ──
  const durationSec = 70; // target 60–75s

  return { sections, plainText, durationSec };
}
