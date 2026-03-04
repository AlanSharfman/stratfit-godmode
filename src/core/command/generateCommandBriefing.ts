// src/core/command/generateCommandBriefing.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Deterministic Command Briefing Generator (Terrain-Aware v2)
//
// Produces a structured ~90s documentary-style briefing across 8 cinematic
// beats covering terrain difficulty, risk concentration, path viability,
// milestone friction, and robustness — all from existing selectors.
//
// Input: scenario analytics + terrainSignals + pathSignals + riskHotspots
// Output: { sections[], plainText, durationSec }
//
// RULES:
//   - Deterministic: same input → same output (no randomness)
//   - Probability-first language only
//   - FORBIDDEN: recommend, guarantee, certainty, should
//   - ALLOWED: probability, dispersion, robustness, likelihood, signal,
//              scenario indicator, range, suggests, indicates
// ═══════════════════════════════════════════════════════════════════════════

// ── Types ──

export interface BriefingSection {
  /** Start timestamp in seconds */
  t: number;
  /** Section title */
  title: string;
  /** Narrative lines within this section */
  lines: string[];
  /** Camera target key for director integration */
  cameraTarget: string | null;
  /** Marker keys to highlight during this section */
  highlightMarkers: string[];
  /** Suggested dwell time in ms before advancing */
  pauseMs: number;
}

export interface CommandBriefing {
  sections: BriefingSection[];
  plainText: string;
  durationSec: number;
}

/** Terrain shape signals derived from simulation (via selectors only) */
export interface TerrainSignals {
  elevationScale: number;
  roughness: number;
  ridgeIntensity: number;
  volatility: number;
}

/** Strategic path viability signals */
export interface PathSignals {
  pathPointCount: number;
  stressProbability: number;
  growthRate: number;
  churnRate: number;
}

/** Localised risk hotspot from terrain events */
export interface RiskHotspot {
  id: string;
  type: string;
  severity: number;
  description: string;
  month: number;
}

export interface BriefingInputs {
  scenarioName: string;
  baselineName: string;
  evP50: number | null;
  evDCF: number | null;
  evRevMultiple: number | null;
  evEbitdaMultiple: number | null;
  evP10: number | null;
  evP90: number | null;
  riskIndex: number | null;
  runwayMonths: number | null;
  dispersionWidth: number | null;
  volatility: number | null;
  waterfallSteps: Array<{ label: string; delta: number; direction: string }> | null;
  probZones: { upside: number; base: number; stress: number } | null;
  provenance: {
    runId: string | number;
    seed: string | number | null;
    engineVersion: string;
  } | null;
  terrainSignals: TerrainSignals | null;
  pathSignals: PathSignals | null;
  riskHotspots: RiskHotspot[];
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

function terrainDifficultyLabel(roughness: number): string {
  if (roughness >= 3) return "severe";
  if (roughness >= 2) return "elevated";
  if (roughness >= 1) return "moderate";
  return "contained";
}

function elevationLabel(scale: number): string {
  if (scale >= 2.5) return "high-altitude";
  if (scale >= 1.5) return "mid-altitude";
  return "low-altitude";
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
    terrainSignals,
    pathSignals,
    riskHotspots,
  } = inputs;

  const sections: BriefingSection[] = [];

  // ── Beat 1: Strategic Orientation (0–10s) ──
  const orientLines: string[] = [
    `This is a probabilistic terrain analysis of scenario "${scenarioName}" evaluated against the "${baselineName}" baseline.`,
    `The landscape you see is derived from simulation parameters — elevation encodes growth trajectory, roughness reflects operational friction, and ridge structures represent strategic leverage points.`,
  ];
  if (terrainSignals) {
    orientLines.push(
      `The terrain presents as a ${elevationLabel(terrainSignals.elevationScale)} landscape with ${terrainDifficultyLabel(terrainSignals.roughness)} surface conditions.`,
    );
  }
  orientLines.push(`All figures are model-derived probability indicators — not forecasts.`);
  sections.push({
    t: 0,
    title: "Strategic Orientation",
    lines: orientLines,
    cameraTarget: "wide_overview",
    highlightMarkers: [],
    pauseMs: 10000,
  });

  // ── Beat 2: Terrain Difficulty (10–22s) ──
  const terrainLines: string[] = [];
  if (terrainSignals) {
    terrainLines.push(
      `Terrain roughness is ${terrainDifficultyLabel(terrainSignals.roughness)} at ${terrainSignals.roughness.toFixed(2)} — ` +
      `this encodes the operational friction embedded in the scenario's burn structure and margin dynamics.`,
    );
    terrainLines.push(
      `Ridge intensity registers at ${(terrainSignals.ridgeIntensity * 100).toFixed(0)}%, ` +
      `indicating ${terrainSignals.ridgeIntensity > 0.5 ? "pronounced" : "moderate"} leverage divergence between growth and margin assumptions.`,
    );
    terrainLines.push(
      `Surface volatility of ${(terrainSignals.volatility * 100).toFixed(0)}% signals ` +
      `${terrainSignals.volatility > 0.3 ? "material" : "contained"} dispersion in the growth-to-margin trajectory.`,
    );
  } else {
    terrainLines.push("Terrain signal data is not yet available. Run a simulation to populate the terrain analysis.");
  }
  sections.push({
    t: 10,
    title: "Terrain Difficulty",
    lines: terrainLines,
    cameraTarget: "terrain_surface",
    highlightMarkers: ["roughness_zone"],
    pauseMs: 12000,
  });

  // ── Beat 3: Risk Concentration (22–33s) ──
  const riskLines: string[] = [];
  riskLines.push(`The model indicates ${riskBand(riskIndex)} with a composite risk index of ${fmtPct(riskIndex)}.`);
  riskLines.push(runwaySignal(runwayMonths));
  if (riskHotspots.length > 0) {
    const topHotspots = riskHotspots.slice(0, 3);
    riskLines.push(
      `${riskHotspots.length} risk hotspot${riskHotspots.length > 1 ? "s" : ""} detected on the terrain surface. ` +
      `The highest-severity concentration: ${topHotspots.map((h) => `${h.description} (month ${h.month}, severity ${(h.severity * 100).toFixed(0)}%)`).join("; ")}.`,
    );
  } else {
    riskLines.push("No localised risk hotspots detected in the current simulation horizon.");
  }
  if (volatility != null) {
    riskLines.push(
      `Outcome volatility is ${volatility > 0.6 ? "elevated" : volatility > 0.3 ? "moderate" : "contained"} ` +
      `at ${fmtPct(volatility * 100)}, indicating ${volatility > 0.6 ? "wider" : "narrower"} dispersion across probability bands.`,
    );
  }
  sections.push({
    t: 22,
    title: "Risk Concentration",
    lines: riskLines,
    cameraTarget: "risk_peak",
    highlightMarkers: riskHotspots.slice(0, 3).map((h) => h.id),
    pauseMs: 11000,
  });

  // ── Beat 4: Valuation Trajectory (33–44s) ──
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
  if (waterfallSteps && waterfallSteps.length > 0) {
    const positives = waterfallSteps.filter((s) => s.delta > 0).sort((a, b) => b.delta - a.delta);
    if (positives.length > 0) {
      const top = positives.slice(0, 2);
      evLines.push(
        `Primary value drivers: ${top.map((s) => `${s.label} (+${fmtEV(s.delta)})`).join(" and ")}.`,
      );
    }
  }
  if (evLines.length === 0) {
    evLines.push("Valuation data is not yet available. Run a simulation to populate the value trajectory.");
  }
  sections.push({
    t: 33,
    title: "Valuation Trajectory",
    lines: evLines,
    cameraTarget: "valuation_peak",
    highlightMarkers: ["ev_trajectory"],
    pauseMs: 11000,
  });

  // ── Beat 5: Strategic Path Viability (44–54s) ──
  const pathLines: string[] = [];
  if (pathSignals) {
    const stressPct = (pathSignals.stressProbability * 100).toFixed(0);
    pathLines.push(
      `The strategic path traverses ${pathSignals.pathPointCount} modelled trajectory points across the terrain surface.`,
    );
    pathLines.push(
      `Path stress probability is ${stressPct}% — ` +
      `${pathSignals.stressProbability > 0.5
        ? "indicating elevated likelihood of trajectory deviation under current assumptions"
        : pathSignals.stressProbability > 0.25
          ? "suggesting moderate resilience with sensitivity to assumption changes"
          : "indicating robust path stability under the modelled parameter envelope"}.`,
    );
    const growthPct = (pathSignals.growthRate * 100).toFixed(0);
    const churnPct = (pathSignals.churnRate * 100).toFixed(1);
    pathLines.push(
      `Growth trajectory of ${growthPct}% against ${churnPct}% churn pressure ` +
      `${pathSignals.growthRate > pathSignals.churnRate * 3
        ? "suggests the path maintains positive net momentum"
        : "signals friction between expansion and retention forces"}.`,
    );
  } else {
    pathLines.push("Path viability signals require a completed simulation to evaluate.");
  }
  sections.push({
    t: 44,
    title: "Strategic Path Viability",
    lines: pathLines,
    cameraTarget: "path_trajectory",
    highlightMarkers: ["revenue_engine", "inflection_point"],
    pauseMs: 10000,
  });

  // ── Beat 6: Milestone Friction (54–63s) ──
  const milestoneLines: string[] = [];
  if (waterfallSteps && waterfallSteps.length > 0) {
    const negatives = waterfallSteps.filter((s) => s.delta < 0).sort((a, b) => a.delta - b.delta);
    if (negatives.length > 0) {
      milestoneLines.push(
        `Milestone friction detected across ${negatives.length} driver group${negatives.length > 1 ? "s" : ""}: ` +
        `${negatives.map((s) => `${s.label} (${fmtEV(s.delta)})`).join(", ")}.`,
      );
      milestoneLines.push(
        `These represent headwinds that the strategic path must absorb. The probability of reaching downstream milestones is modulated by these friction points.`,
      );
    } else {
      milestoneLines.push(
        `No milestone friction detected — all ${waterfallSteps.length} modelled driver groups exhibit positive or neutral contribution to enterprise value.`,
      );
    }
    milestoneLines.push(
      `The waterfall attribution shows ${waterfallSteps.length} driver groups with sequential marginal impact on the trajectory.`,
    );
  } else {
    milestoneLines.push("Milestone friction analysis requires waterfall attribution data from both baseline and scenario simulations.");
  }
  if (terrainSignals && terrainSignals.ridgeIntensity > 0.4) {
    milestoneLines.push(
      `The terrain ridge structure suggests concentrated leverage at key transition points — milestone timing is likely to be non-linear.`,
    );
  }
  sections.push({
    t: 54,
    title: "Milestone Friction",
    lines: milestoneLines,
    cameraTarget: "margin_expansion",
    highlightMarkers: ["leverage_nodes"],
    pauseMs: 9000,
  });

  // ── Beat 7: Robustness Envelope (63–76s) ──
  const robustLines: string[] = [];
  if (dispersionWidth != null) {
    robustLines.push(
      `Methodology dispersion is ${fmtEV(dispersionWidth)} — the spread between the highest and lowest valuation approaches.`,
    );
    robustLines.push(
      dispersionWidth > 5_000_000
        ? `Wide dispersion signals significant model sensitivity to methodology choice. The robustness envelope is broad — interpret the blended figure with appropriate caution.`
        : `Contained dispersion suggests reasonable convergence across valuation approaches. The robustness envelope is narrow.`,
    );
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
      `Interquartile probability range: ${fmtEV(iqr)} (${fmtPct(iqrRatio * 100, 0)} of P50 median). ` +
      `${iqrRatio > 0.5 ? "This indicates material outcome uncertainty within the robustness envelope." : "This indicates moderate outcome concentration — the robustness envelope is supportive."}`,
    );
  }
  if (pathSignals && terrainSignals) {
    const combinedScore = (1 - pathSignals.stressProbability) * (1 / Math.max(1, terrainSignals.roughness));
    robustLines.push(
      `Combined path-terrain robustness score: ${(combinedScore * 100).toFixed(0)}% — ` +
      `${combinedScore > 0.6 ? "the scenario shows structural resilience" : combinedScore > 0.3 ? "moderate sensitivity to assumption drift" : "elevated fragility under parameter perturbation"}.`,
    );
  }
  if (robustLines.length === 0) {
    robustLines.push("Robustness analysis requires valuation data from a completed simulation.");
  }
  sections.push({
    t: 63,
    title: "Robustness Envelope",
    lines: robustLines,
    cameraTarget: "probability_band",
    highlightMarkers: ["capital_efficiency"],
    pauseMs: 13000,
  });

  // ── Beat 8: Executive Implication (76–90s) ──
  const implLines: string[] = [];
  implLines.push(
    `This analysis presents scenario indicators — not directives. The model quantifies probability-weighted outcomes under stated assumptions.`,
  );
  if (evP50 != null && riskIndex != null) {
    if (riskIndex >= 60 && evP50 > 0) {
      implLines.push(
        `Scenario indicators suggest a constructive trajectory with manageable structural risk. The probability mass is concentrated in positive territory across the terrain surface.`,
      );
    } else if (riskIndex >= 30) {
      implLines.push(
        `Mixed signals across risk and value dimensions indicate a transitional landscape. Monitoring key inflection points along the strategic path is appropriate.`,
      );
    } else {
      implLines.push(
        `Elevated risk signals combined with the current value range indicate structural pressure. The probability distribution across the terrain surface skews toward caution.`,
      );
    }
  }
  if (terrainSignals && pathSignals) {
    const terrainSummary = terrainSignals.roughness >= 2 ? "difficult terrain" : "navigable terrain";
    const pathSummary = pathSignals.stressProbability > 0.5 ? "elevated path stress" : "contained path stress";
    implLines.push(
      `The terrain-path synthesis indicates ${terrainSummary} with ${pathSummary} — the likelihood of achieving modelled milestones is best interpreted within this combined context.`,
    );
  }
  implLines.push(
    `Next review points: re-run analysis when baseline assumptions change materially, at scheduled board intervals, or upon significant market developments.`,
  );
  if (provenance) {
    implLines.push(
      `Provenance — Run: ${provenance.runId}${provenance.seed != null ? `, Seed: ${provenance.seed}` : ""}, Engine: ${provenance.engineVersion}. All outputs are subject to stated assumptions.`,
    );
  }
  sections.push({
    t: 76,
    title: "Executive Implication",
    lines: implLines,
    cameraTarget: "wide_overview",
    highlightMarkers: [],
    pauseMs: 14000,
  });

  // ── Build plain text for audio ──
  const plainText = sections
    .map((s) => s.lines.join(" "))
    .join("\n\n");

  // ── Total duration ──
  const durationSec = 90;

  return { sections, plainText, durationSec };
}
