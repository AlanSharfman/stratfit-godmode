// src/core/command/generateCommandBriefing.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Intelligence Briefing Generator (Terrain-Aware v4)
//
// Produces a structured ~60–90s cinematic briefing.
// Voice: confident, perceptive American female analyst — precise, curious,
// human. Thinks in probabilities but communicates in plain insight.
//
// VOICE RULES:
//   - Conversational American English, contractions, natural cadence
//   - Lead with the headline insight, then explain why
//   - Show genuine curiosity when data reveals something unexpected
//   - Probability-first language, but make it feel like a person talking
//   - FORBIDDEN: recommend, guarantee, certainty, should, "pursuant to"
//   - ALLOWED: probability, dispersion, signals, suggests, indicates
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
  if (idx == null) return "unquantified at this point";
  if (idx >= 70) return "well-contained — structural pressure is low";
  if (idx >= 40) return "moderate — there are pressure points but nothing systemic";
  if (idx >= 20) return "elevated — several structural risks are compounding";
  return "critical — the risk concentration is significant";
}

function runwayNarrative(months: number | null): string {
  if (months == null) return "";
  if (months >= 24) return `With ${Math.round(months)} months of runway, there's meaningful strategic optionality here — time to execute without forced capital events.`;
  if (months >= 12) return `Runway sits at ${Math.round(months)} months. That's workable, but the window for capital-intensive moves is narrowing.`;
  if (months >= 6) return `At ${Math.round(months)} months of runway, capital timing becomes the dominant constraint. Every burn decision carries real weight.`;
  return `Only ${Math.round(months)} months of runway remain. This is survival-mode territory — burn discipline isn't optional, it's existential.`;
}

function terrainDifficultyLabel(roughness: number): string {
  if (roughness >= 3) return "severe";
  if (roughness >= 2) return "substantial";
  if (roughness >= 1) return "moderate";
  return "mild";
}

function elevationLabel(scale: number): string {
  if (scale >= 2.5) return "high-altitude";
  if (scale >= 1.5) return "elevated";
  return "low-altitude";
}

function overallVerdict(riskIndex: number | null, evP50: number | null, pathStress: number | null): string {
  const rOk = riskIndex != null && riskIndex >= 50;
  const vOk = evP50 != null && evP50 > 0;
  const pOk = pathStress != null && pathStress < 0.4;
  const score = [rOk, vOk, pOk].filter(Boolean).length;
  if (score === 3) return "constructive";
  if (score === 2) return "mixed-positive";
  if (score === 1) return "cautious";
  return "under pressure";
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

  const verdict = overallVerdict(riskIndex, evP50, pathSignals?.stressProbability ?? null);
  const sections: BriefingSection[] = [];

  // ── Beat 1: The Headline (0s) — lead with the punchline ──
  const headlineLines: string[] = [];
  if (evP50 != null && riskIndex != null) {
    headlineLines.push(
      `Here's the bottom line on "${scenarioName}": the model reads this as ${verdict}. ` +
      `Enterprise value probability centres at ${fmtEV(evP50)}, with structural risk at ${fmtPct(riskIndex)}.`,
    );
  } else {
    headlineLines.push(
      `This is the intelligence briefing for "${scenarioName}", mapped against your "${baselineName}" baseline. Let's walk through what the model sees.`,
    );
  }
  if (runwayMonths != null && evP50 != null) {
    const runwayContext = runwayMonths >= 18
      ? `With ${Math.round(runwayMonths)} months of runway, there's room to be strategic.`
      : runwayMonths >= 9
        ? `At ${Math.round(runwayMonths)} months of runway, timing matters.`
        : `With only ${Math.round(runwayMonths)} months of runway, every decision carries existential weight.`;
    headlineLines.push(runwayContext);
  }
  headlineLines.push(`Let me take you through the terrain and show you why.`);
  sections.push({
    t: 0,
    title: "The Headline",
    lines: headlineLines,
    cameraTarget: "wide_overview",
    highlightMarkers: [],
    pauseMs: 8000,
  });

  // ── Beat 2: Reading the Landscape (8s) — what the terrain encodes ──
  const landscapeLines: string[] = [];
  if (terrainSignals) {
    const elev = elevationLabel(terrainSignals.elevationScale);
    const diff = terrainDifficultyLabel(terrainSignals.roughness);
    landscapeLines.push(
      `The terrain you're seeing is a ${elev} landscape with ${diff} surface friction. ` +
      `Elevation maps to growth trajectory — higher peaks mean stronger value creation. Surface roughness encodes operational drag from burn rate and margin compression.`,
    );
    if (terrainSignals.ridgeIntensity > 0.5) {
      landscapeLines.push(
        `Notice the prominent ridge structures — at ${(terrainSignals.ridgeIntensity * 100).toFixed(0)}% intensity, they signal a significant divergence between revenue growth and margin expansion. ` +
        `That gap creates both opportunity and fragility.`,
      );
    } else {
      landscapeLines.push(
        `The ridges are relatively subdued at ${(terrainSignals.ridgeIntensity * 100).toFixed(0)}% intensity, suggesting growth and margins are moving in reasonable alignment.`,
      );
    }
    landscapeLines.push(
      `Surface volatility reads ${(terrainSignals.volatility * 100).toFixed(0)}% — ` +
      `${terrainSignals.volatility > 0.4 ? "the model sees meaningful turbulence ahead in the growth-to-profitability transition" : "the path through this terrain looks relatively stable"}.`,
    );
  } else {
    landscapeLines.push(`Terrain signals aren't populated yet. Once you run a simulation, the landscape will encode your company's growth dynamics, operational friction, and strategic leverage in 3D.`);
  }
  sections.push({
    t: 8,
    title: "Reading the Landscape",
    lines: landscapeLines,
    cameraTarget: "terrain_surface",
    highlightMarkers: ["roughness_zone"],
    pauseMs: 8000,
  });

  // ── Beat 3: Where Risk Concentrates (16s) — the danger zones ──
  const riskLines: string[] = [];
  riskLines.push(
    `Structural risk is ${riskBand(riskIndex)}, composite index ${fmtPct(riskIndex)}.`,
  );
  const rwyText = runwayNarrative(runwayMonths);
  if (rwyText) riskLines.push(rwyText);

  if (riskHotspots.length > 0) {
    const top = riskHotspots.slice(0, 3);
    riskLines.push(
      `The model flags ${riskHotspots.length} concentrated risk zone${riskHotspots.length > 1 ? "s" : ""} on the terrain. ` +
      `${top.map((h) => `${h.description} near month ${h.month} at ${(h.severity * 100).toFixed(0)}% severity`).join("; ")}. ` +
      `These are the points where multiple structural pressures converge — they deserve the closest attention.`,
    );
  } else {
    riskLines.push(`No concentrated risk clusters within the simulation horizon — that's a positive structural signal.`);
  }
  if (volatility != null) {
    riskLines.push(
      volatility > 0.5
        ? `Outcome dispersion is wide at ${fmtPct(volatility * 100)} — there's a significant gap between the best and worst case trajectories. The model is saying: this scenario is assumption-sensitive.`
        : `Outcome dispersion is ${fmtPct(volatility * 100)}, which means probability mass is reasonably concentrated — the scenario isn't wildly sensitive to assumption changes.`,
    );
  }
  sections.push({
    t: 16,
    title: "Where Risk Concentrates",
    lines: riskLines,
    cameraTarget: "risk_peak",
    highlightMarkers: riskHotspots.slice(0, 3).map((h) => h.id),
    pauseMs: 8000,
  });

  // ── Beat 4: Value Architecture (24s) — how value is structured ──
  const valLines: string[] = [];
  if (evP50 != null) {
    valLines.push(
      `The blended enterprise value — the P50 probability centre — is ${fmtEV(evP50)}. That's where the weight of evidence sits across all valuation methods.`,
    );
  }
  if (evDCF != null || evRevMultiple != null || evEbitdaMultiple != null) {
    const methods: string[] = [];
    if (evDCF != null) methods.push(`DCF at ${fmtEV(evDCF)}`);
    if (evRevMultiple != null) methods.push(`revenue multiple at ${fmtEV(evRevMultiple)}`);
    if (evEbitdaMultiple != null) methods.push(`EBITDA multiple at ${fmtEV(evEbitdaMultiple)}`);
    valLines.push(`The individual lenses: ${methods.join(", ")}.`);
    if (dispersionWidth != null) {
      valLines.push(
        dispersionWidth > 5_000_000
          ? `There's a ${fmtEV(dispersionWidth)} spread between methods — that's significant. It tells us the value conclusion is method-dependent, which usually means the business is in a transitional phase.`
          : `The methods converge within ${fmtEV(dispersionWidth)} — a relatively tight consensus, which increases confidence in the blended figure.`,
      );
    }
  }
  if (evP10 != null && evP90 != null) {
    valLines.push(
      `The full probability range runs from ${fmtEV(evP10)} at P10 to ${fmtEV(evP90)} at P90. That's the envelope — the space where outcomes will most likely resolve.`,
    );
  }
  if (waterfallSteps && waterfallSteps.length > 0) {
    const positives = waterfallSteps.filter((s) => s.delta > 0).sort((a, b) => b.delta - a.delta);
    const negatives = waterfallSteps.filter((s) => s.delta < 0).sort((a, b) => a.delta - b.delta);
    if (positives.length > 0) {
      const top = positives.slice(0, 2);
      valLines.push(`The primary value drivers: ${top.map((s) => `${s.label} contributing ${fmtEV(s.delta)}`).join(" and ")}.`);
    }
    if (negatives.length > 0) {
      const worst = negatives.slice(0, 2);
      valLines.push(`Working against that: ${worst.map((s) => `${s.label} at ${fmtEV(s.delta)}`).join(" and ")} — these are the headwinds embedded in the trajectory.`);
    }
  }
  if (valLines.length === 0) {
    valLines.push(`Valuation data isn't available yet. Once a simulation runs, this section will break down how value is constructed and where it's fragile.`);
  }
  sections.push({
    t: 24,
    title: "Value Architecture",
    lines: valLines,
    cameraTarget: "valuation_peak",
    highlightMarkers: ["ev_trajectory"],
    pauseMs: 8000,
  });

  // ── Beat 5: The Strategic Path (32s) — can the business get there? ──
  const pathLines: string[] = [];
  if (pathSignals) {
    const stressPct = (pathSignals.stressProbability * 100).toFixed(0);
    const growthPct = (pathSignals.growthRate * 100).toFixed(0);
    const churnPct = (pathSignals.churnRate * 100).toFixed(1);
    pathLines.push(
      `The strategic path traces ${pathSignals.pathPointCount} trajectory points across the terrain — this is the most likely execution route given your assumptions.`,
    );
    pathLines.push(
      pathSignals.stressProbability > 0.5
        ? `Path stress is elevated at ${stressPct}%. This means the route is sensitive — relatively small changes in assumptions could redirect the trajectory significantly.`
        : pathSignals.stressProbability > 0.25
          ? `Path stress reads ${stressPct}% — moderate. The path holds under current assumptions but has identifiable sensitivity zones.`
          : `Path stress is low at ${stressPct}%, which signals genuine resilience. This path doesn't easily break under reasonable perturbation.`,
    );
    const netEngine = pathSignals.growthRate - pathSignals.churnRate;
    pathLines.push(
      `Growth engine: ${growthPct}% acquisition against ${churnPct}% churn, netting ${(netEngine * 100).toFixed(1)}% effective expansion. ` +
      `${netEngine > 0.15 ? "That's strong forward momentum." : netEngine > 0 ? "Positive but the margin is thin — churn is eating into growth." : "The growth engine is losing to churn. That's the single biggest structural concern."}`,
    );
  } else {
    pathLines.push(`Path analysis requires a completed simulation. It'll show you the most probable execution route and where it's vulnerable.`);
  }
  sections.push({
    t: 32,
    title: "The Strategic Path",
    lines: pathLines,
    cameraTarget: "path_trajectory",
    highlightMarkers: ["revenue_engine", "inflection_point"],
    pauseMs: 7000,
  });

  // ── Beat 6: Probability Architecture (39s) — how confident is the model? ──
  const probLines: string[] = [];
  if (probZones) {
    probLines.push(
      `The probability architecture: ${fmtPct(probZones.upside)} upside, ${fmtPct(probZones.base)} base case, ${fmtPct(probZones.stress)} stress.`,
    );
    if (probZones.upside > 30) {
      probLines.push(`There's meaningful upside mass here — the model sees a real possibility of outperformance under favourable conditions.`);
    } else if (probZones.stress > 40) {
      probLines.push(`The stress tail is heavy. More than ${fmtPct(probZones.stress)} of probability mass sits in adverse territory — that's worth sitting with.`);
    } else {
      probLines.push(`The distribution is relatively balanced, with the bulk of probability centred on the base case.`);
    }
  }
  if (evP10 != null && evP50 != null && evP90 != null) {
    const iqr = evP90 - evP10;
    const iqrRatio = evP50 > 0 ? iqr / evP50 : 0;
    probLines.push(
      `The interquartile range spans ${fmtEV(iqr)}, about ${fmtPct(iqrRatio * 100, 0)} of the median. ` +
      `${iqrRatio > 0.5 ? "That's wide — outcomes are genuinely uncertain, and the model is telling you precision isn't available here." : "That's reasonably concentrated — outcomes cluster around the central estimate."}`,
    );
  }
  if (pathSignals && terrainSignals) {
    const robustness = (1 - pathSignals.stressProbability) * (1 / Math.max(1, terrainSignals.roughness));
    probLines.push(
      `Combined robustness — factoring path stability against terrain friction — comes to ${(robustness * 100).toFixed(0)}%. ` +
      `${robustness > 0.6 ? "That's a solid structural foundation." : robustness > 0.3 ? "Workable, but with identifiable fragility." : "Fragile — the scenario's outcome is highly dependent on getting the assumptions right."}`,
    );
  }
  if (probLines.length === 0) {
    probLines.push(`Probability architecture will populate once a simulation completes.`);
  }
  sections.push({
    t: 39,
    title: "Probability Architecture",
    lines: probLines,
    cameraTarget: "probability_band",
    highlightMarkers: ["capital_efficiency"],
    pauseMs: 8000,
  });

  // ── Beat 7: What the Model Sees (47s) — interpretation ──
  const interpLines: string[] = [];
  if (evP50 != null && riskIndex != null) {
    if (verdict === "constructive") {
      interpLines.push(
        `Putting it all together, the model reads this scenario as constructive. Value trajectory, risk structure, and path resilience are all signalling in the same direction. ` +
        `That kind of alignment doesn't happen by default — it reflects something structurally sound in the underlying assumptions.`,
      );
    } else if (verdict === "mixed-positive") {
      interpLines.push(
        `The overall read is mixed-positive. Most indicators point in a constructive direction, but there are pockets of tension — ` +
        `usually between growth ambition and the operational friction required to get there. The inflection points on the terrain are where those tensions resolve.`,
      );
    } else if (verdict === "cautious") {
      interpLines.push(
        `The model's posture here is cautious. There are signals pulling in opposing directions, and the probability distribution reflects that uncertainty. ` +
        `This is a scenario that could break either way depending on which assumptions prove closest to reality.`,
      );
    } else {
      interpLines.push(
        `The structural signals are under pressure. Multiple risk dimensions are compounding, and the path through this terrain has limited margin for error. ` +
        `The model isn't saying this can't work — it's saying the probability of the base case is lower than you might want.`,
      );
    }
  }
  if (terrainSignals && pathSignals) {
    const terrainSummary = terrainSignals.roughness >= 2 ? "high-friction terrain" : "navigable terrain";
    const pathSummary = pathSignals.stressProbability > 0.5 ? "elevated path sensitivity" : "contained path risk";
    interpLines.push(
      `The terrain-path combination: ${terrainSummary} with ${pathSummary}. That's the lens through which every milestone probability should be read.`,
    );
  }
  if (interpLines.length === 0) {
    interpLines.push(`Scenario interpretation will be available once simulation data populates the terrain.`);
  }
  sections.push({
    t: 47,
    title: "What the Model Sees",
    lines: interpLines,
    cameraTarget: "wide_overview",
    highlightMarkers: [],
    pauseMs: 7000,
  });

  // ── Beat 8: Next Moves (54s) — what to do with this ──
  const nextLines: string[] = [];
  nextLines.push(
    `These are probability indicators, not instructions. The model quantifies outcomes under the assumptions you've set — change the inputs and the landscape shifts.`,
  );
  if (riskIndex != null && riskIndex < 40 && runwayMonths != null && runwayMonths < 12) {
    nextLines.push(`Given the risk concentration and runway constraints, the highest-leverage move is stress-testing capital timing — when you raise, and how much runway buffer that creates.`);
  } else if (pathSignals && pathSignals.stressProbability > 0.5) {
    nextLines.push(`The path sensitivity suggests testing the key assumptions — try adjusting growth rate and churn independently to see which one moves the terrain more.`);
  } else if (dispersionWidth != null && dispersionWidth > 5_000_000) {
    nextLines.push(`The wide valuation spread means methodology choice matters. It's worth exploring which assumptions drive the divergence between DCF and multiples approaches.`);
  } else {
    nextLines.push(`Consider re-running this when your baseline assumptions shift, after a board review, or if market conditions change materially.`);
  }
  if (provenance) {
    nextLines.push(
      `Analysis reference: run ${provenance.runId}${provenance.seed != null ? `, seed ${provenance.seed}` : ""}, ${provenance.engineVersion} engine.`,
    );
  }
  sections.push({
    t: 54,
    title: "Next Moves",
    lines: nextLines,
    cameraTarget: "wide_overview",
    highlightMarkers: [],
    pauseMs: 6000,
  });

  // ── Build plain text for audio ──
  const plainText = sections
    .map((s) => s.lines.join(" "))
    .join("\n\n");

  const durationSec = 60;

  return { sections, plainText, durationSec };
}
