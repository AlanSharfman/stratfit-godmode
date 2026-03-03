// src/domain/intelligence/buildTerrainExplanation.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Template-based Terrain Explanation Builder (Phase A10.1)
//
// Deterministic, template-only explanations. No AI. No "recommend/should".
// Probability-first language. 2–3 sentences max.
// Pure function. No UI.
// ═══════════════════════════════════════════════════════════════════════════

import type { TerrainEvent, TerrainEventType, SeverityBand } from "@/domain/events/terrainEventTypes"
import { severityBand } from "@/domain/events/terrainEventTypes"

// ── Template registry ───────────────────────────────────────────

interface ExplanationTemplate {
  title: string
  /** Body template — placeholders: {month}, {severity}, {impact} */
  body: string
}

type TemplateMap = Record<SeverityBand, ExplanationTemplate>

const TEMPLATES: Record<TerrainEventType, TemplateMap> = {
  liquidity_stress: {
    low: {
      title: "Liquidity Pressure — Low",
      body: "Minor cash-flow tightening detected at month {month}. Probability of sustained stress remains contained at current burn trajectory.",
    },
    moderate: {
      title: "Liquidity Pressure — Moderate",
      body: "Cash reserves are drawing down at an elevated rate near month {month}. Probability of runway compression has increased, warranting closer monitoring of burn dynamics.",
    },
    high: {
      title: "Liquidity Stress — High",
      body: "Significant liquidity erosion observed at month {month}. The probability of runway falling below critical thresholds is elevated. Cash management becomes a primary constraint.",
    },
    critical: {
      title: "Liquidity Crisis — Critical",
      body: "Severe cash depletion signal at month {month}. Probability of operational disruption is materially high. Immediate capital allocation review is indicated.",
    },
  },

  risk_spike: {
    low: {
      title: "Risk Elevation — Low",
      body: "A mild risk signal emerged at month {month}. Probability-weighted downside impact remains within normal operating range.",
    },
    moderate: {
      title: "Risk Spike — Moderate",
      body: "Risk index has spiked near month {month}. The probability of adverse outcomes has shifted upward across multiple metric dimensions.",
    },
    high: {
      title: "Risk Spike — High",
      body: "Pronounced risk escalation at month {month}. The probability distribution has shifted materially toward downside scenarios. Multiple risk vectors are converging.",
    },
    critical: {
      title: "Risk Spike — Critical",
      body: "Extreme risk concentration detected at month {month}. The probability of severe adverse outcomes is at its highest level in the projection horizon.",
    },
  },

  downside_regime: {
    low: {
      title: "Downside Regime — Emerging",
      body: "Lower-percentile outcomes are beginning to diverge at month {month}. The tail probability remains modest but bears observation.",
    },
    moderate: {
      title: "Downside Regime — Forming",
      body: "A downside regime is forming near month {month}. Lower-percentile revenue paths are diverging from the median, increasing the probability-weighted variance.",
    },
    high: {
      title: "Downside Regime — Established",
      body: "Sustained downside regime at month {month}. The gap between median and lower-percentile outcomes has widened materially, shifting the probability mass toward adverse scenarios.",
    },
    critical: {
      title: "Downside Regime — Severe",
      body: "Severe downside regime at month {month}. Lower-percentile outcomes have decoupled significantly. The probability of the business tracking below P10 is elevated.",
    },
  },

  volatility_zone: {
    low: {
      title: "Volatility Zone — Mild",
      body: "Forecast variance has increased slightly near month {month}. The probability cone has widened modestly, reflecting normal uncertainty.",
    },
    moderate: {
      title: "Volatility Zone — Moderate",
      body: "Elevated forecast volatility detected at month {month}. The probability distribution is wider than baseline, indicating increased outcome uncertainty.",
    },
    high: {
      title: "Volatility Zone — High",
      body: "Significant volatility expansion at month {month}. Outcome dispersion is wide enough to materially affect confidence in median projections.",
    },
    critical: {
      title: "Volatility Zone — Extreme",
      body: "Extreme outcome volatility at month {month}. The probability cone is at maximum width, rendering point estimates unreliable over this segment.",
    },
  },

  probability_shift: {
    low: {
      title: "Probability Shift — Minor",
      body: "A slight shift in the survival probability curve near month {month}. The change is within normal variance and has limited planning impact.",
    },
    moderate: {
      title: "Probability Shift — Notable",
      body: "A notable shift in outcome probabilities at month {month}. The change alters the expected distribution enough to warrant attention in scenario planning.",
    },
    high: {
      title: "Probability Shift — Significant",
      body: "Significant probability rebalancing at month {month}. The likelihood distribution has moved materially, affecting confidence in previously assumed outcomes.",
    },
    critical: {
      title: "Probability Shift — Major",
      body: "Major probability inflection at month {month}. The survival curve has repositioned substantially, requiring recalibration of forward assumptions.",
    },
  },

  growth_inflection: {
    low: {
      title: "Growth Inflection — Subtle",
      body: "A gentle growth curve change near month {month}. The impact on forward revenue probability is modest.",
    },
    moderate: {
      title: "Growth Inflection — Moderate",
      body: "A growth inflection point at month {month}. Revenue trajectory has shifted its rate of change, altering the probability-weighted forward path.",
    },
    high: {
      title: "Growth Inflection — Strong",
      body: "Strong growth inflection detected at month {month}. The revenue probability distribution has shifted materially upward across projection percentiles.",
    },
    critical: {
      title: "Growth Inflection — Exceptional",
      body: "Exceptional growth acceleration at month {month}. Revenue probability mass has moved dramatically, compressing downside risk and expanding upside potential.",
    },
  },
}

// ── Footnote templates ──────────────────────────────────────────

function buildFootnote(event: TerrainEvent): string {
  const impact = Math.abs(event.probabilityImpact)
  if (impact < 0.15) return "Probability impact: negligible."
  if (impact < 0.40) return "Probability impact: moderate."
  if (impact < 0.70) return "Probability impact: significant."
  return "Probability impact: severe."
}

// ── Public API ──────────────────────────────────────────────────

/**
 * Build a deterministic terrain explanation from a primary event.
 *
 * @param event      — The primary terrain event
 * @param monthLabel — Converts monthIndex → human-readable label (e.g. "Month 4")
 *
 * Returns { title, body, footnote } — ready for overlay rendering.
 */
export function buildTerrainExplanation(args: {
  event: TerrainEvent
  monthLabel: (m: number) => string
}): { title: string; body: string; footnote: string } {
  const { event, monthLabel } = args
  const band = severityBand(event.severity)
  const template = TEMPLATES[event.type][band]
  const month = monthLabel(event.timestamp)

  return {
    title: template.title,
    body: template.body.replace(/\{month\}/g, month),
    footnote: buildFootnote(event),
  }
}
