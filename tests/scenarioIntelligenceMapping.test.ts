import { describe, expect, it } from "vitest";
import { mapScenarioIntelligence, type ScenarioMetricsSnapshot } from "../src/utils/scenarioIntelligenceMapping";

function snap(partial: Partial<ScenarioMetricsSnapshot>): ScenarioMetricsSnapshot {
  return {
    runwayMonths: 18,
    cashPosition: 5_000_000,
    burnRateMonthly: 200_000,
    arr: 3_000_000,
    arrGrowthPct: 18,
    grossMarginPct: 70,
    riskScore: 40,
    enterpriseValue: 20_000_000,
    ...partial,
  };
}

describe("mapScenarioIntelligence — runway thresholds", () => {
  it("runway <6 => financial HIGH", () => {
    const out = mapScenarioIntelligence({ current: snap({ runwayMonths: 5 }), baseline: snap({ runwayMonths: 18 }) });
    expect(out.systemState.financial).toBe("HIGH");
  });
  it("runway 6-12 => financial ELEVATED", () => {
    const out = mapScenarioIntelligence({ current: snap({ runwayMonths: 6 }), baseline: snap({ runwayMonths: 18 }) });
    expect(out.systemState.financial).toBe("ELEVATED");
  });
  it("runway 12-18 => financial MODERATE", () => {
    const out = mapScenarioIntelligence({ current: snap({ runwayMonths: 12 }), baseline: snap({ runwayMonths: 18 }) });
    expect(out.systemState.financial).toBe("MODERATE");
  });
  it("runway >=18 => financial STABLE", () => {
    const out = mapScenarioIntelligence({ current: snap({ runwayMonths: 18 }), baseline: snap({ runwayMonths: 18 }) });
    expect(out.systemState.financial).toBe("STABLE");
  });
});

describe("mapScenarioIntelligence — risk thresholds", () => {
  it("risk <30 => execution STABLE", () => {
    const out = mapScenarioIntelligence({ current: snap({ riskScore: 29 }), baseline: snap({ riskScore: 29 }) });
    expect(out.systemState.execution).toBe("STABLE");
  });
  it("risk 30-55 => execution MODERATE", () => {
    const out = mapScenarioIntelligence({ current: snap({ riskScore: 30 }), baseline: snap({ riskScore: 30 }) });
    expect(out.systemState.execution).toBe("MODERATE");
  });
  it("risk 55-75 => execution ELEVATED", () => {
    const out = mapScenarioIntelligence({ current: snap({ riskScore: 55 }), baseline: snap({ riskScore: 55 }) });
    expect(out.systemState.execution).toBe("ELEVATED");
  });
  it("risk >=75 => execution HIGH", () => {
    const out = mapScenarioIntelligence({ current: snap({ riskScore: 75 }), baseline: snap({ riskScore: 75 }) });
    expect(out.systemState.execution).toBe("HIGH");
  });
});

describe("mapScenarioIntelligence — burn pressure vs baseline", () => {
  it("burn +20% promotes financial above runway-only state", () => {
    const baseline = snap({ runwayMonths: 18, burnRateMonthly: 100 });
    const current = snap({ runwayMonths: 18, burnRateMonthly: 120 });
    const out = mapScenarioIntelligence({ current, baseline });
    // runway is STABLE, burn pressure becomes at least ELEVATED => financial not STABLE
    expect(out.systemState.financial).not.toBe("STABLE");
  });
});

describe("mapScenarioIntelligence — output contract", () => {
  it("produces 2-4 observations, 1-3 risks, 2-3 attention; no digits", () => {
    const out = mapScenarioIntelligence({ current: snap({ runwayMonths: 10, arrGrowthPct: -5, grossMarginPct: 45, riskScore: 80 }), baseline: snap({}) });
    expect(out.observations.length).toBeGreaterThanOrEqual(2);
    expect(out.observations.length).toBeLessThanOrEqual(4);
    expect(out.risks.length).toBeGreaterThanOrEqual(1);
    expect(out.risks.length).toBeLessThanOrEqual(3);
    expect(out.attention.length).toBeGreaterThanOrEqual(2);
    expect(out.attention.length).toBeLessThanOrEqual(3);
    expect(out.assumptionFlags.length).toBeLessThanOrEqual(2);

    const allText = [
      ...out.observations,
      ...out.attention,
      ...out.assumptionFlags,
      ...out.risks.flatMap((r) => [r.title, r.driver, r.impact]),
    ].join(" ");
    expect(/[0-9]/.test(allText)).toBe(false);
  });
});

describe("mapScenarioIntelligence — assumption flags", () => {
  it("stable case emits 0 flags", () => {
    const base = snap({ runwayMonths: 18, arrGrowthPct: 18, grossMarginPct: 70, riskScore: 20, burnRateMonthly: 200_000 });
    const cur = snap({ runwayMonths: 18, arrGrowthPct: 18, grossMarginPct: 70, riskScore: 20, burnRateMonthly: 200_000 });
    const out = mapScenarioIntelligence({ current: cur, baseline: base });
    expect(out.assumptionFlags).toEqual([]);
  });

  it("stressed case emits top 2 flags deterministically (risk + runway)", () => {
    const base = snap({ runwayMonths: 18, riskScore: 20, burnRateMonthly: 200_000, grossMarginPct: 70, arrGrowthPct: 18 });
    const cur = snap({ runwayMonths: 10, riskScore: 80, burnRateMonthly: 200_000, grossMarginPct: 70, arrGrowthPct: 18 });
    const out = mapScenarioIntelligence({ current: cur, baseline: base });
    expect(out.assumptionFlags).toEqual([
      "Execution tolerance is low under this risk profile.",
      "Stability depends on runway buffer not compressing.",
    ]);
  });
});

describe("mapScenarioIntelligence — strategic questions", () => {
  it("fully stable emits 0 questions", () => {
    const base = snap({ runwayMonths: 18, riskScore: 20, burnRateMonthly: 200_000, grossMarginPct: 70, arrGrowthPct: 18 });
    const cur = snap({ runwayMonths: 18, riskScore: 20, burnRateMonthly: 200_000, grossMarginPct: 70, arrGrowthPct: 18 });
    const out = mapScenarioIntelligence({ current: cur, baseline: base });
    expect(out.strategicQuestions?.length ?? 0).toBe(0);
  });

  it("stressed scenario emits 2 questions", () => {
    const base = snap({ runwayMonths: 18, riskScore: 20, burnRateMonthly: 200_000, grossMarginPct: 70, arrGrowthPct: 18 });
    const cur = snap({ runwayMonths: 8, riskScore: 80, burnRateMonthly: 260_000, grossMarginPct: 55, arrGrowthPct: 5 });
    const out = mapScenarioIntelligence({ current: cur, baseline: base });
    expect(out.strategicQuestions?.length).toBe(2);
  });

  it("mixed scenario emits 1 question", () => {
    // Growth is weak, but risk is not rising and financial posture is stable => only Growth Sustainability should trigger.
    const base = snap({ runwayMonths: 18, riskScore: 40, burnRateMonthly: 200_000, grossMarginPct: 70, arrGrowthPct: 18 });
    const cur = snap({ runwayMonths: 18, riskScore: 40, burnRateMonthly: 200_000, grossMarginPct: 70, arrGrowthPct: 5 });
    const out = mapScenarioIntelligence({ current: cur, baseline: base });
    expect(out.strategicQuestions?.length).toBe(1);
    expect(out.strategicQuestions?.[0]?.question).toContain("sustainable");
  });
});


