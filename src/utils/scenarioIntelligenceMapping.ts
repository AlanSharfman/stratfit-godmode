// src/utils/scenarioIntelligenceMapping.ts
// STRATFIT — Deterministic Scenario Intelligence mapping (testable, no AI)

export type SystemStateLevel = "STABLE" | "MODERATE" | "ELEVATED" | "HIGH";

export type ScenarioIntelligenceRisk = {
  severity: SystemStateLevel;
  title: string;
  driver: string;
  impact: string;
};

export type ScenarioIntelligenceOutput = {
  systemState: {
    financial: SystemStateLevel;
    operational: SystemStateLevel;
    execution: SystemStateLevel;
  };
  observations: string[]; // 2–4, no numbers
  risks: ScenarioIntelligenceRisk[]; // 1–3
  attention: string[]; // 2–3, no imperatives, no numbers
  assumptionFlags: string[]; // 0–2, calm readout, no numbers, no imperatives
  strategicQuestions?: Array<{ question: string; answer: string }>; // 0–2, board-safe, no numbers, no imperatives
};

export type ScenarioMetricsSnapshot = {
  runwayMonths: number;
  cashPosition: number; // dollars
  burnRateMonthly: number; // dollars
  arr: number; // dollars
  arrGrowthPct: number; // percent (e.g. 18 for +18%). Can be NaN if unknown.
  grossMarginPct: number; // percent
  riskScore: number; // 0 good -> 100 bad
  enterpriseValue: number; // dollars
};

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function hasDigits(s: string) {
  return /[0-9]/.test(s);
}

function noNumbers(s: string) {
  // Enforce “no numbers in text” at the mapping boundary.
  return s.replace(/[0-9]/g, "").replace(/\s+/g, " ").trim();
}

function runwayState(runwayMonths: number): SystemStateLevel {
  if (runwayMonths < 6) return "HIGH";
  if (runwayMonths < 12) return "ELEVATED";
  if (runwayMonths < 18) return "MODERATE";
  return "STABLE";
}

type ArrGrowthBand = "CONTRACTING" | "WEAK" | "HEALTHY" | "STRONG" | "UNKNOWN";
function arrGrowthBand(arrGrowthPct: number): ArrGrowthBand {
  if (!Number.isFinite(arrGrowthPct)) return "UNKNOWN";
  if (arrGrowthPct < 0) return "CONTRACTING";
  if (arrGrowthPct < 10) return "WEAK";
  if (arrGrowthPct < 25) return "HEALTHY";
  return "STRONG";
}

type MarginBand = "WEAK" | "ELEVATED" | "STABLE" | "STRONG";
function grossMarginBand(gmPct: number): MarginBand {
  if (gmPct < 50) return "WEAK";
  if (gmPct < 65) return "ELEVATED";
  if (gmPct < 80) return "STABLE";
  return "STRONG";
}

function riskState(riskScore: number): SystemStateLevel {
  if (riskScore < 30) return "STABLE";
  if (riskScore < 55) return "MODERATE";
  if (riskScore < 75) return "ELEVATED";
  return "HIGH";
}

type BurnPressureBand = "DOWN" | "FLAT" | "UP_MODERATE" | "UP_ELEVATED" | "UP_HIGH";
function burnPressureBand(current: number, baseline: number): BurnPressureBand {
  if (!(baseline > 0) || !Number.isFinite(current) || !Number.isFinite(baseline)) return "FLAT";
  const pct = (current - baseline) / baseline; // ratio
  if (pct <= -0.08) return "DOWN";
  if (pct < 0.03) return "FLAT";
  if (pct < 0.08) return "UP_MODERATE";
  if (pct < 0.15) return "UP_ELEVATED";
  return "UP_HIGH";
}

function maxState(...states: SystemStateLevel[]): SystemStateLevel {
  const rank: Record<SystemStateLevel, number> = { STABLE: 0, MODERATE: 1, ELEVATED: 2, HIGH: 3 };
  return states.reduce((a, b) => (rank[b] > rank[a] ? b : a), "STABLE");
}

function severityScore(s: SystemStateLevel) {
  return s === "HIGH" ? 3 : s === "ELEVATED" ? 2 : s === "MODERATE" ? 1 : 0;
}

export function mapScenarioIntelligence(params: {
  current: ScenarioMetricsSnapshot;
  baseline: ScenarioMetricsSnapshot;
}): ScenarioIntelligenceOutput {
  const { current, baseline } = params;

  const runwayS = runwayState(current.runwayMonths);
  const riskS = riskState(current.riskScore);

  const burnBand = burnPressureBand(current.burnRateMonthly, baseline.burnRateMonthly);
  const burnPressureS: SystemStateLevel =
    burnBand === "UP_HIGH"
      ? "HIGH"
      : burnBand === "UP_ELEVATED"
      ? "ELEVATED"
      : burnBand === "UP_MODERATE"
      ? "MODERATE"
      : "STABLE";

  const arrBand = arrGrowthBand(current.arrGrowthPct);
  const gmBand = grossMarginBand(current.grossMarginPct);

  const deltaRunway = current.runwayMonths - baseline.runwayMonths;
  const deltaArrGrowth = Number.isFinite(current.arrGrowthPct) && Number.isFinite(baseline.arrGrowthPct)
    ? current.arrGrowthPct - baseline.arrGrowthPct
    : NaN;
  const deltaMargin = current.grossMarginPct - baseline.grossMarginPct;
  const deltaRisk = current.riskScore - baseline.riskScore;
  const burnChangePct =
    baseline.burnRateMonthly > 0 ? (current.burnRateMonthly - baseline.burnRateMonthly) / baseline.burnRateMonthly : 0;

  // System state mapping (deterministic)
  const financial = maxState(runwayS, burnPressureS);

  const operational = maxState(
    gmBand === "WEAK" ? "ELEVATED" : gmBand === "ELEVATED" ? "MODERATE" : "STABLE",
    burnPressureS === "HIGH" ? "ELEVATED" : burnPressureS
  );

  const execution = riskS;

  // Assumption flags (0–2 lines, scored, deterministic; no numbers; no imperatives)
  type FlagKey = "A" | "B" | "C" | "D" | "E";
  type FlagCandidate = { key: FlagKey; score: number; category: "growth" | "runway" | "cost" | "efficiency" | "execution"; text: string };

  const flagCandidates: FlagCandidate[] = [];

  // A Growth dependency
  {
    const trigger = (Number.isFinite(current.arrGrowthPct) && current.arrGrowthPct < 10) || (Number.isFinite(deltaArrGrowth) && deltaArrGrowth <= -3);
    if (trigger) {
      let score = 0;
      if (Number.isFinite(current.arrGrowthPct)) {
        if (current.arrGrowthPct < 0) score = 3;
        else if (current.arrGrowthPct < 10) score = 2;
      }
      if (Number.isFinite(deltaArrGrowth) && deltaArrGrowth <= -10) score = Math.max(score, 3);
      else if (Number.isFinite(deltaArrGrowth) && deltaArrGrowth <= -3) score = Math.max(score, 1);
      flagCandidates.push({
        key: "A",
        category: "growth",
        score,
        text: "Outcome is sensitive to revenue momentum holding.",
      });
    }
  }

  // B Runway dependency
  {
    const trigger = current.runwayMonths < 12 || deltaRunway <= -1;
    if (trigger) {
      let score = 0;
      if (current.runwayMonths < 6) score = 3;
      else if (current.runwayMonths < 12) score = 2;
      if (deltaRunway <= -3) score = Math.max(score, 2);
      else if (deltaRunway <= -1) score = Math.max(score, 1);
      flagCandidates.push({
        key: "B",
        category: "runway",
        score,
        text: "Stability depends on runway buffer not compressing.",
      });
    }
  }

  // C Cost discipline dependency
  {
    const trigger = burnChangePct >= 0.10;
    if (trigger) {
      let score = 1;
      if (burnChangePct >= 0.20) score = 3;
      else if (burnChangePct >= 0.15) score = 2;
      flagCandidates.push({
        key: "C",
        category: "cost",
        score,
        text: "Scenario assumes cost load remains contained.",
      });
    }
  }

  // D Efficiency dependency
  {
    const trigger = current.grossMarginPct < 65 || deltaMargin <= -2;
    if (trigger) {
      let score = 0;
      if (current.grossMarginPct < 50) score = 3;
      else if (current.grossMarginPct < 65) score = 2;
      if (deltaMargin <= -5) score = Math.max(score, 2);
      else if (deltaMargin <= -2) score = Math.max(score, 1);
      flagCandidates.push({
        key: "D",
        category: "efficiency",
        score,
        text: "Result depends on maintaining efficiency under scale.",
      });
    }
  }

  // E Execution tolerance dependency
  {
    const trigger = current.riskScore >= 55 || deltaRisk >= 5;
    if (trigger) {
      let score = 0;
      if (current.riskScore >= 75) score = 3;
      else if (current.riskScore >= 55) score = 2;
      if (deltaRisk >= 10) score = Math.max(score, 2);
      else if (deltaRisk >= 5) score = Math.max(score, 1);
      flagCandidates.push({
        key: "E",
        category: "execution",
        score,
        text: "Execution tolerance is low under this risk profile.",
      });
    }
  }

  // If fully stable, emit no flags.
  let assumptionFlags: string[] = [];
  if (financial === "STABLE" && operational === "STABLE" && execution === "STABLE") {
    assumptionFlags = [];
  } else {
    const order: Record<FlagKey, number> = { A: 1, B: 2, C: 3, D: 4, E: 5 };
    flagCandidates.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return order[a.key] - order[b.key];
    });

    const picked: FlagCandidate[] = [];
    const usedCats = new Set<string>();
    for (const c of flagCandidates) {
      if (picked.length >= 2) break;
      if (usedCats.has(c.category)) continue;
      picked.push(c);
      usedCats.add(c.category);
    }
    assumptionFlags = picked.map((c) => noNumbers(c.text)).filter(Boolean);
  }

  // Strategic questions (0–2, board/investor-safe; deterministic; no numbers; no imperatives)
  type QKey = "Q1" | "Q2" | "Q3" | "Q4";
  type QCandidate = { key: QKey; score: number; question: string; answer: string };
  const qCandidates: QCandidate[] = [];

  const runwayDeclining = deltaRunway <= -1;
  const arrDeclining = Number.isFinite(deltaArrGrowth) ? deltaArrGrowth <= -3 : false;
  const riskRising = deltaRisk >= 5;

  // Q1 Capital Timing
  if (financial === "ELEVATED" || financial === "HIGH" || runwayDeclining) {
    const score =
      financial === "HIGH" || deltaRunway <= -3 || burnChangePct >= 0.15
        ? 3
        : financial === "ELEVATED" || runwayDeclining || burnChangePct >= 0.10
        ? 2
        : 1;
    qCandidates.push({
      key: "Q1",
      score,
      question: "What signals would indicate capital timing sensitivity?",
      answer:
        burnBand === "UP_HIGH" || burnBand === "UP_ELEVATED" || runwayDeclining
          ? "Sensitivity appears tied to runway compression and burn pressure increasing relative to baseline."
          : "Sensitivity appears tied to stability narrowing under the current financial posture.",
    });
  }

  // Q2 Growth Sustainability
  if (arrBand === "CONTRACTING" || arrBand === "WEAK" || arrDeclining) {
    const score =
      arrBand === "CONTRACTING" || (Number.isFinite(deltaArrGrowth) && deltaArrGrowth <= -10)
        ? 3
        : arrBand === "WEAK" || arrDeclining
        ? 2
        : 1;
    qCandidates.push({
      key: "Q2",
      score,
      question: "How sustainable is current growth under this scenario?",
      answer:
        gmBand === "WEAK" || gmBand === "ELEVATED"
          ? "Sustainability appears sensitive to momentum holding while efficiency tolerance remains intact."
          : "Sustainability appears driven by momentum holding without increasing execution variance.",
    });
  }

  // Q3 Risk Concentration
  if (current.riskScore >= 55 || riskRising) {
    const score = riskS === "HIGH" || deltaRisk >= 10 ? 3 : riskS === "ELEVATED" || riskRising ? 2 : 1;
    let answer = "Risk appears concentrated in execution variance under the current posture.";
    if (financial === "HIGH" || financial === "ELEVATED") answer = "Risk appears concentrated in liquidity optionality and execution variance.";
    else if (gmBand === "WEAK") answer = "Risk appears concentrated in efficiency tolerance and execution variance.";
    qCandidates.push({
      key: "Q3",
      score,
      question: "Where is risk most concentrated in this scenario?",
      answer,
    });
  }

  // Q4 Assumption Fragility
  if (assumptionFlags.length) {
    const score = Math.max(severityScore(financial), severityScore(execution), severityScore(operational));
    qCandidates.push({
      key: "Q4",
      score: Math.max(1, score),
      question: "Which assumptions does this scenario rely on most?",
      answer: `The scenario relies most on: ${assumptionFlags.join(" · ")}`,
    });
  }

  const qOrder: Record<QKey, number> = { Q1: 1, Q2: 2, Q3: 3, Q4: 4 };
  qCandidates.sort((a, b) => (b.score !== a.score ? b.score - a.score : qOrder[a.key] - qOrder[b.key]));
  // Only emit higher-signal questions (mixed cases should not automatically produce 2).
  const strategicQuestions = qCandidates
    .filter((q) => q.score >= 2)
    .slice(0, 2)
    .map((q) => ({ question: noNumbers(q.question), answer: noNumbers(q.answer) }))
    .filter((q) => q.question && q.answer);

  // Observations (2–4, declarative, no numbers)
  const obs: string[] = [];

  if (runwayS === "HIGH") obs.push("Runway is critically constrained under the current posture.");
  else if (runwayS === "ELEVATED") obs.push("Runway constraint is elevated and reduces optionality.");
  else if (runwayS === "MODERATE") obs.push("Runway remains workable but requires discipline.");
  else obs.push("Runway posture remains stable under the current assumptions.");

  if (arrBand === "CONTRACTING") obs.push("ARR growth signal indicates contraction versus the baseline posture.");
  else if (arrBand === "WEAK") obs.push("ARR growth signal is weak relative to baseline expectations.");
  else if (arrBand === "HEALTHY") obs.push("ARR growth signal is healthy under the current scenario.");
  else if (arrBand === "STRONG") obs.push("ARR growth signal is strong and supports forward momentum.");
  else obs.push("ARR growth signal is not available from current inputs.");

  if (riskS === "HIGH") obs.push("Execution risk is high and dominates the decision surface.");
  else if (riskS === "ELEVATED") obs.push("Execution risk is elevated and increases outcome variance.");
  else if (riskS === "MODERATE") obs.push("Execution risk is moderate and requires active monitoring.");
  else obs.push("Execution risk remains stable under current conditions.");

  if (burnBand === "UP_HIGH" || burnBand === "UP_ELEVATED") {
    obs.push("Burn pressure has increased versus baseline and tightens the operating envelope.");
  } else if (burnBand === "DOWN") {
    obs.push("Burn pressure has eased versus baseline, improving resilience.");
  }

  const observations = obs.map(noNumbers).filter(Boolean).slice(0, 4);

  // Risks (1–3, pick highest severity and most negative posture)
  const candidates: Array<ScenarioIntelligenceRisk & { score: number }> = [];

  if (runwayS !== "STABLE") {
    const sev = runwayS === "HIGH" ? "HIGH" : runwayS === "ELEVATED" ? "ELEVATED" : "MODERATE";
    candidates.push({
      severity: sev,
      title: "Runway constraint",
      driver: "Runway posture is constrained under the current burn and funding sensitivity.",
      impact: "Optionality narrows and timing risk increases.",
      score: severityScore(sev) + 0.2,
    });
  }

  if (burnPressureS !== "STABLE") {
    const sev = burnPressureS;
    candidates.push({
      severity: sev,
      title: "Burn pressure shift",
      driver: "Burn pressure has increased versus baseline posture.",
      impact: "Resilience decreases and tradeoffs become sharper.",
      score: severityScore(sev) + 0.1,
    });
  }

  if (arrBand === "CONTRACTING" || arrBand === "WEAK") {
    const sev = arrBand === "CONTRACTING" ? "ELEVATED" : "MODERATE";
    candidates.push({
      severity: sev,
      title: "ARR growth fragility",
      driver: "ARR growth signal is below baseline expectations.",
      impact: "Revenue momentum weakens and recovery requires tighter execution.",
      score: severityScore(sev) + 0.15,
    });
  }

  if (gmBand === "WEAK" || gmBand === "ELEVATED") {
    const sev = gmBand === "WEAK" ? "ELEVATED" : "MODERATE";
    candidates.push({
      severity: sev,
      title: "Margin pressure",
      driver: "Gross margin posture is under pressure relative to the stable band.",
      impact: "Unit economics tighten and growth becomes less efficient.",
      score: severityScore(sev) + 0.12,
    });
  }

  if (riskS !== "STABLE") {
    const sev = riskS;
    candidates.push({
      severity: sev,
      title: "Execution variance",
      driver: "Risk posture is elevated relative to baseline conditions.",
      impact: "Outcome variance widens and forecast reliability decreases.",
      score: severityScore(sev) + 0.18,
    });
  }

  candidates.sort((a, b) => b.score - a.score);
  const risks = candidates
    .slice(0, 3)
    .map(({ score: _score, ...r }) => ({
      ...r,
      title: noNumbers(r.title),
      driver: noNumbers(r.driver),
      impact: noNumbers(r.impact),
    }));

  // Attention (2–3, neutral, no imperatives)
  const att: string[] = [];
  if (financial !== "STABLE") att.push("Attention on runway resilience versus burn posture.");
  if (arrBand === "CONTRACTING" || arrBand === "WEAK") att.push("Attention on retention quality and pipeline health.");
  if (gmBand === "WEAK" || gmBand === "ELEVATED") att.push("Attention on pricing power and cost of service assumptions.");
  if (execution !== "STABLE") att.push("Attention on execution sequencing and dependency risk.");

  // Ensure 2–3 items
  const attention = att.map(noNumbers).filter(Boolean).slice(0, 3);
  while (attention.length < 2) attention.push(noNumbers("Attention on forecast stability and operating discipline."));

  // Final enforcement: mapping must not emit digits anywhere.
  const enforceNoDigits = (arr: string[]) => arr.every((s) => !hasDigits(s));
  if (
    !enforceNoDigits(observations) ||
    !enforceNoDigits(attention) ||
    !enforceNoDigits(assumptionFlags) ||
    !enforceNoDigits(strategicQuestions.flatMap((q) => [q.question, q.answer])) ||
    risks.some((r) => hasDigits(r.title + r.driver + r.impact))
  ) {
    // Invariant: strip digits just in case.
    return {
      systemState: { financial, operational, execution },
      observations: observations.map(noNumbers),
      risks: risks.map((r) => ({
        ...r,
        title: noNumbers(r.title),
        driver: noNumbers(r.driver),
        impact: noNumbers(r.impact),
      })),
      attention: attention.map(noNumbers),
      assumptionFlags: assumptionFlags.map(noNumbers),
      strategicQuestions: strategicQuestions.map((q) => ({ question: noNumbers(q.question), answer: noNumbers(q.answer) })),
    };
  }

  return {
    systemState: { financial, operational, execution },
    observations,
    risks: risks.length ? risks : [
      {
        severity: "STABLE",
        title: "No structural risks detected",
        driver: "Inputs are within stable operating bands.",
        impact: "Continue monitoring for drift.",
      },
    ],
    attention,
    assumptionFlags,
    strategicQuestions,
  };
}


