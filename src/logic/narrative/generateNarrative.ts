// STRATFIT — Deterministic Narrative Generator (Module 2)
// Produces executive commentary strictly from SimulationSnapshot.
// No AI. No fabrication. Same inputs → same output.

import type { SimulationSnapshot, OverallRating } from "@/state/scenarioStore";
export type { SimulationSnapshot, OverallRating };

type Narrative = {
  headline: string;
  bullets: string[];
  footer: string;
};

function pct01(x: number) {
  const v = Math.max(0, Math.min(1, x));
  return `${Math.round(v * 100)}%`;
}

function fmtMoney(n: number) {
  if (!Number.isFinite(n)) return "—";
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${Math.round(n)}`;
}

function fmtMonths(n: number) {
  if (!Number.isFinite(n)) return "—";
  return `${n.toFixed(1)}m`;
}

function ratingHeadline(r: OverallRating) {
  switch (r) {
    case "CRITICAL":
      return "Critical risk profile";
    case "CAUTION":
      return "Elevated risk profile";
    case "STABLE":
      return "Stable profile";
    case "STRONG":
      return "Strong profile";
    default:
      return "Risk profile";
  }
}

function spreadPct(p10: number, p90: number, p50: number) {
  // relative spread around median; avoids division by zero
  const denom = Math.max(1, Math.abs(p50));
  return Math.round((Math.abs(p90 - p10) / denom) * 100);
}

function topDrivers(
  leverSensitivity: SimulationSnapshot["leverSensitivity"],
  count: number
) {
  const list = (leverSensitivity ?? [])
    .slice()
    .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
    .slice(0, count);

  const positives = list.filter((d) => d.direction === "positive");
  const negatives = list.filter((d) => d.direction === "negative");

  return { list, positives, negatives };
}

export function generateNarrative(snapshot: SimulationSnapshot): Narrative {
  const survival = pct01(snapshot.survivalRate);
  const runway50 = fmtMonths(snapshot.runwayP50 ?? snapshot.medianRunway);
  const runway10 = fmtMonths(snapshot.runwayP10);
  const runway90 = fmtMonths(snapshot.runwayP90);

  const arr10 = snapshot.arrP10;
  const arr50 = snapshot.arrP50;
  const arr90 = snapshot.arrP90;

  const arrSpread = spreadPct(arr10, arr90, arr50);

  const { positives, negatives } = topDrivers(snapshot.leverSensitivity, 3);

  const headline = `${ratingHeadline(snapshot.overallRating)} — survival ${survival}, runway P50 ${runway50}`;

  const bullets: string[] = [];

  // 1) Survival + runway signal
  bullets.push(`Survival probability is ${survival} over the horizon, with runway ranging P10 ${runway10} → P90 ${runway90}.`);

  // 2) ARR distribution signal
  bullets.push(`ARR outcome distribution is wide: P10 ${fmtMoney(arr10)} · P50 ${fmtMoney(arr50)} · P90 ${fmtMoney(arr90)} (spread ~${arrSpread}% vs median).`);

  // 3) Rating explanation (strictly mapped)
  switch (snapshot.overallRating) {
    case "CRITICAL":
      bullets.push("Overall rating is CRITICAL: downside tail risk is dominant and requires immediate stabilisation actions.");
      break;
    case "CAUTION":
      bullets.push("Overall rating is CAUTION: performance is viable, but fragility appears under downside conditions.");
      break;
    case "STABLE":
      bullets.push("Overall rating is STABLE: core trajectory is coherent, with manageable downside variance.");
      break;
    case "STRONG":
      bullets.push("Overall rating is STRONG: trajectory is resilient with strong upside optionality.");
      break;
  }

  // 4) Sensitivity drivers (no claims beyond what sensitivity says)
  if (positives.length > 0) {
    bullets.push(`Primary positive driver(s): ${positives.map((d) => d.label).join(", ")}.`);
  }
  if (negatives.length > 0) {
    bullets.push(`Primary risk driver(s): ${negatives.map((d) => d.label).join(", ")}.`);
  }

  // 5) Operational call-to-action (still grounded)
  const footer =
    snapshot.overallRating === "CRITICAL" || snapshot.overallRating === "CAUTION"
      ? "Focus: protect runway, reduce volatility, and neutralise the top risk drivers before pursuing aggressive growth."
      : "Focus: defend the baseline, then selectively amplify the top positive drivers while monitoring downside variance.";

  return { headline, bullets, footer };
}
