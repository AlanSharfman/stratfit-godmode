// src/core/command/generateCommandBriefing.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Warm Conversational Briefing Generator (Terrain-Aware v3)
//
// Produces a structured ~90s briefing with a warm, engaging American voice
// character — like a 30-year-old woman who's genuinely fascinated by what
// the data reveals. Not stiff. Not formal. Curious and in awe.
//
// CRITICAL VOICE RULES:
//   - Conversational American English — contractions, natural rhythm
//   - Show wonder and curiosity ("what's really interesting here…")
//   - Keep it intelligent but accessible — not a whitepaper
//   - Probability-first language, but make it feel human
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
  if (idx == null) return "hard to pin down right now";
  if (idx >= 70) return "actually looking pretty manageable";
  if (idx >= 40) return "sitting in that moderate zone";
  return "running a bit hot";
}

function runwaySignal(months: number | null): string {
  if (months == null) return "We don't have runway data just yet.";
  if (months >= 24) return `There's a solid ${Math.round(months)}-month runway here, which gives a really comfortable buffer.`;
  if (months >= 12) return `The runway sits at about ${Math.round(months)} months — it's okay, but it's worth keeping an eye on.`;
  return `At just ${Math.round(months)} months of runway, there's some real near-term capital pressure to be aware of.`;
}

function terrainDifficultyLabel(roughness: number): string {
  if (roughness >= 3) return "really challenging";
  if (roughness >= 2) return "pretty rough";
  if (roughness >= 1) return "somewhat bumpy";
  return "fairly smooth";
}

function elevationLabel(scale: number): string {
  if (scale >= 2.5) return "high-altitude";
  if (scale >= 1.5) return "mid-range";
  return "lower-altitude";
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
    `Okay, so here's what we're looking at — this is the terrain for "${scenarioName}", mapped against your "${baselineName}" baseline.`,
    `The landscape you see isn't just decoration. The elevation shows growth trajectory, the roughness reflects how much friction's baked into the operations, and those ridge formations? Those are your strategic leverage points.`,
  ];
  if (terrainSignals) {
    orientLines.push(
      `What's interesting is we're seeing a ${elevationLabel(terrainSignals.elevationScale)} landscape with ${terrainDifficultyLabel(terrainSignals.roughness)} surface conditions.`,
    );
  }
  orientLines.push(`Just a heads up — everything here is probability-based, not a forecast. These are indicators, not promises.`);
  sections.push({
    t: 0,
    title: "Strategic Orientation",
    lines: orientLines,
    cameraTarget: "wide_overview",
    highlightMarkers: [],
    pauseMs: 7000,
  });

  // ── Beat 2: Terrain Difficulty (10–22s) ──
  const terrainLines: string[] = [];
  if (terrainSignals) {
    terrainLines.push(
      `Now let's look at the terrain itself. The roughness is ${terrainDifficultyLabel(terrainSignals.roughness)}, sitting at ${terrainSignals.roughness.toFixed(2)} — ` +
      `that's essentially encoding how much operational friction is built into the burn rate and margin dynamics.`,
    );
    terrainLines.push(
      `The ridge intensity is at ${(terrainSignals.ridgeIntensity * 100).toFixed(0)}%, ` +
      `which tells us there's ${terrainSignals.ridgeIntensity > 0.5 ? "a pretty pronounced divergence" : "a moderate gap"} between the growth and margin assumptions.`,
    );
    terrainLines.push(
      `And surface volatility? It's running at ${(terrainSignals.volatility * 100).toFixed(0)}%, ` +
      `so we're seeing ${terrainSignals.volatility > 0.3 ? "some real movement" : "relatively contained patterns"} in the growth-to-margin trajectory.`,
    );
  } else {
    terrainLines.push("We don't have terrain signals yet — once you run a simulation, this whole landscape will come alive with data.");
  }
  sections.push({
    t: 7,
    title: "Terrain Difficulty",
    lines: terrainLines,
    cameraTarget: "terrain_surface",
    highlightMarkers: ["roughness_zone"],
    pauseMs: 8000,
  });

  // ── Beat 3: Risk Concentration (22–33s) ──
  const riskLines: string[] = [];
  riskLines.push(`So here's where risk comes in. The structural risk is ${riskBand(riskIndex)}, with a composite index of ${fmtPct(riskIndex)}.`);
  riskLines.push(runwaySignal(runwayMonths));
  if (riskHotspots.length > 0) {
    const topHotspots = riskHotspots.slice(0, 3);
    riskLines.push(
      `We've picked up ${riskHotspots.length} risk hotspot${riskHotspots.length > 1 ? "s" : ""} on the surface. ` +
      `The most intense ones: ${topHotspots.map((h) => `${h.description} around month ${h.month}, at ${(h.severity * 100).toFixed(0)}% severity`).join("; ")}.`,
    );
  } else {
    riskLines.push("The good news? No concentrated risk hotspots showing up within the simulation horizon.");
  }
  if (volatility != null) {
    riskLines.push(
      `Outcome volatility is ${volatility > 0.6 ? "noticeably elevated" : volatility > 0.3 ? "in the moderate range" : "fairly contained"} ` +
      `at ${fmtPct(volatility * 100)}, which means the spread across probability bands is ${volatility > 0.6 ? "wider than you'd want" : "within a reasonable range"}.`,
    );
  }
  sections.push({
    t: 15,
    title: "Risk Concentration",
    lines: riskLines,
    cameraTarget: "risk_peak",
    highlightMarkers: riskHotspots.slice(0, 3).map((h) => h.id),
    pauseMs: 7000,
  });

  // ── Beat 4: Valuation Trajectory (33–44s) ──
  const evLines: string[] = [];
  if (evP50 != null) {
    evLines.push(`Now this is where it gets fascinating. The blended enterprise value — that's the P50 median — comes in at ${fmtEV(evP50)}.`);
  }
  if (evDCF != null || evRevMultiple != null || evEbitdaMultiple != null) {
    const methods: string[] = [];
    if (evDCF != null) methods.push(`DCF gives us ${fmtEV(evDCF)}`);
    if (evRevMultiple != null) methods.push(`revenue multiple points to ${fmtEV(evRevMultiple)}`);
    if (evEbitdaMultiple != null) methods.push(`EBITDA multiple lands at ${fmtEV(evEbitdaMultiple)}`);
    evLines.push(`Breaking that down by method: ${methods.join(", ")}.`);
  }
  if (evP10 != null && evP90 != null) {
    evLines.push(
      `The probability range stretches from ${fmtEV(evP10)} at the P10 to ${fmtEV(evP90)} at the P90 — so that's the full spread of where things could land.`,
    );
  }
  if (waterfallSteps && waterfallSteps.length > 0) {
    const positives = waterfallSteps.filter((s) => s.delta > 0).sort((a, b) => b.delta - a.delta);
    if (positives.length > 0) {
      const top = positives.slice(0, 2);
      evLines.push(
        `The biggest value drivers? ${top.map((s) => `${s.label}, adding ${fmtEV(s.delta)}`).join(", and ")}.`,
      );
    }
  }
  if (evLines.length === 0) {
    evLines.push("We're still waiting on valuation data — run a simulation and this section will light up with the value trajectory.");
  }
  sections.push({
    t: 22,
    title: "Valuation Trajectory",
    lines: evLines,
    cameraTarget: "valuation_peak",
    highlightMarkers: ["ev_trajectory"],
    pauseMs: 7000,
  });

  // ── Beat 5: Strategic Path Viability (44–54s) ──
  const pathLines: string[] = [];
  if (pathSignals) {
    const stressPct = (pathSignals.stressProbability * 100).toFixed(0);
    pathLines.push(
      `Let's trace the strategic path. It runs through ${pathSignals.pathPointCount} trajectory points across the terrain.`,
    );
    pathLines.push(
      `Path stress probability sits at ${stressPct}% — ` +
      `${pathSignals.stressProbability > 0.5
        ? "that's elevated, meaning the path could shift if the underlying assumptions move"
        : pathSignals.stressProbability > 0.25
          ? "it's moderate, showing some sensitivity but decent resilience"
          : "which is really solid — this path holds up well under the current assumptions"}.`,
    );
    const growthPct = (pathSignals.growthRate * 100).toFixed(0);
    const churnPct = (pathSignals.churnRate * 100).toFixed(1);
    pathLines.push(
      `Growth is running at ${growthPct}% against ${churnPct}% churn, ` +
      `${pathSignals.growthRate > pathSignals.churnRate * 3
        ? "and the path's maintaining positive momentum — that's encouraging"
        : "and there's some real friction between the growth engine and retention"}.`,
    );
  } else {
    pathLines.push("We'll need a completed simulation to show you the path viability — it's worth the wait, trust me.");
  }
  sections.push({
    t: 29,
    title: "Strategic Path Viability",
    lines: pathLines,
    cameraTarget: "path_trajectory",
    highlightMarkers: ["revenue_engine", "inflection_point"],
    pauseMs: 7000,
  });

  // ── Beat 6: Milestone Friction (54–63s) ──
  const milestoneLines: string[] = [];
  if (waterfallSteps && waterfallSteps.length > 0) {
    const negatives = waterfallSteps.filter((s) => s.delta < 0).sort((a, b) => a.delta - b.delta);
    if (negatives.length > 0) {
      milestoneLines.push(
        `Here's something to pay attention to — there's friction across ${negatives.length} driver${negatives.length > 1 ? "s" : ""}: ` +
        `${negatives.map((s) => `${s.label} pulling ${fmtEV(s.delta)}`).join(", ")}.`,
      );
      milestoneLines.push(
        `These are basically headwinds the strategic path has to push through. They affect how likely it is to hit those downstream milestones.`,
      );
    } else {
      milestoneLines.push(
        `This is actually really nice to see — all ${waterfallSteps.length} driver groups are either positive or neutral. No friction dragging things down.`,
      );
    }
    milestoneLines.push(
      `The waterfall shows ${waterfallSteps.length} driver groups, each contributing its own piece to the overall trajectory.`,
    );
  } else {
    milestoneLines.push("We'll need the waterfall data from both baseline and scenario simulations to map out milestone friction.");
  }
  if (terrainSignals && terrainSignals.ridgeIntensity > 0.4) {
    milestoneLines.push(
      `Those ridge structures on the terrain? They're telling us that leverage is concentrated at key transition points, so expect the milestone timing to be a bit non-linear.`,
    );
  }
  sections.push({
    t: 36,
    title: "Milestone Friction",
    lines: milestoneLines,
    cameraTarget: "margin_expansion",
    highlightMarkers: ["leverage_nodes"],
    pauseMs: 6000,
  });

  // ── Beat 7: Robustness Envelope (63–76s) ──
  const robustLines: string[] = [];
  if (dispersionWidth != null) {
    robustLines.push(
      `The dispersion between valuation methods is ${fmtEV(dispersionWidth)} — that's the gap between the highest and lowest approach.`,
    );
    robustLines.push(
      dispersionWidth > 5_000_000
        ? `That's a wide spread, which tells us the result is pretty sensitive to which methodology you lean on. Worth keeping that in mind.`
        : `That's actually a fairly tight convergence, which is a good sign — the methods are agreeing reasonably well.`,
    );
  }
  if (probZones) {
    robustLines.push(
      `In terms of probability zones: upside scenario at ${fmtPct(probZones.upside)}, base case at ${fmtPct(probZones.base)}, and stress case at ${fmtPct(probZones.stress)}.`,
    );
  }
  if (evP10 != null && evP50 != null && evP90 != null) {
    const iqr = evP90 - evP10;
    const iqrRatio = evP50 > 0 ? iqr / evP50 : 0;
    robustLines.push(
      `The probability range spans ${fmtEV(iqr)}, which is ${fmtPct(iqrRatio * 100, 0)} of the P50 median. ` +
      `${iqrRatio > 0.5 ? "That's a lot of uncertainty in there — the outcomes are pretty spread out." : "That's a reasonable concentration — outcomes cluster around the median pretty well."}`,
    );
  }
  if (pathSignals && terrainSignals) {
    const combinedScore = (1 - pathSignals.stressProbability) * (1 / Math.max(1, terrainSignals.roughness));
    robustLines.push(
      `When we combine path stability with terrain conditions, the robustness score comes to ${(combinedScore * 100).toFixed(0)}% — ` +
      `${combinedScore > 0.6 ? "and honestly, that's looking really solid" : combinedScore > 0.3 ? "which is in the moderate zone, so there's some sensitivity to watch" : "which is on the fragile side, so assumptions really matter here"}.`,
    );
  }
  if (robustLines.length === 0) {
    robustLines.push("We'll be able to show you the robustness envelope once a simulation completes.");
  }
  sections.push({
    t: 42,
    title: "Robustness Envelope",
    lines: robustLines,
    cameraTarget: "probability_band",
    highlightMarkers: ["capital_efficiency"],
    pauseMs: 9000,
  });

  // ── Beat 8: What It All Means (76–90s) ──
  const implLines: string[] = [];
  implLines.push(
    `So, stepping back — these are scenario indicators, not directives. What the model does is quantify probability-weighted outcomes under the assumptions you've set.`,
  );
  if (evP50 != null && riskIndex != null) {
    if (riskIndex >= 60 && evP50 > 0) {
      implLines.push(
        `And what I'm seeing here is encouraging. The trajectory looks constructive, structural risk is manageable, and the probability mass is sitting in positive territory across the terrain.`,
      );
    } else if (riskIndex >= 30) {
      implLines.push(
        `It's a mixed picture right now — there are signals pulling in different directions. This feels like a transitional landscape, where watching those key inflection points really matters.`,
      );
    } else {
      implLines.push(
        `I'll be honest — the risk signals combined with where the value range sits suggest some real structural pressure. The probability distribution is leaning cautious.`,
      );
    }
  }
  if (terrainSignals && pathSignals) {
    const terrainSummary = terrainSignals.roughness >= 2 ? "challenging terrain" : "navigable terrain";
    const pathSummary = pathSignals.stressProbability > 0.5 ? "elevated path stress" : "contained path stress";
    implLines.push(
      `When you put the terrain and path together, we're looking at ${terrainSummary} with ${pathSummary}. That's the combined lens to read the milestone probabilities through.`,
    );
  }
  implLines.push(
    `Going forward, it's worth re-running this whenever your baseline assumptions shift, at your regular review points, or if anything big changes in the market.`,
  );
  if (provenance) {
    implLines.push(
      `For the record, this was run ${provenance.runId}${provenance.seed != null ? `, seed ${provenance.seed}` : ""}, on the ${provenance.engineVersion} engine.`,
    );
  }
  sections.push({
    t: 51,
    title: "What It All Means",
    lines: implLines,
    cameraTarget: "wide_overview",
    highlightMarkers: [],
    pauseMs: 9000,
  });

  // ── Build plain text for audio ──
  const plainText = sections
    .map((s) => s.lines.join(" "))
    .join("\n\n");

  // ── Total duration ──
  const durationSec = 60;

  return { sections, plainText, durationSec };
}
