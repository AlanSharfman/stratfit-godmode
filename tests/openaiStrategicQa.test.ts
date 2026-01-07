import { describe, expect, it, vi } from "vitest";
import {
  computeScenarioHash,
  createStrategicQaCache,
  fetchStrategicQaCached,
  parseAndValidateAIQAResponse,
  type StrategicQaPromptInput,
} from "../src/utils/openaiStrategicQa";

function baseInput(partial?: Partial<StrategicQaPromptInput>): StrategicQaPromptInput {
  return {
    scenarioId: "base",
    scenarioLabel: "base",
    compareToBase: true,
    observation: ["Runway posture remains stable under the current assumptions."],
    assumptionFlags: ["Outcome is sensitive to revenue momentum holding."],
    systemState: { financial: "MODERATE", operational: "STABLE", execution: "MODERATE" },
    topRisks: [
      {
        severity: "MODERATE",
        title: "Runway constraint",
        driver: "Runway posture is constrained under the current burn and funding sensitivity.",
        impact: "Optionality narrows and timing risk increases.",
      },
    ],
    deltas: { runway: "flat", burn: "flat", growth: "down", margin: "flat", risk: "flat", valuation: "flat" },
    strategicQuestions: [{ id: "growth_sustainability", question: "How sustainable is current growth under this scenario?" }],
    ...partial,
  };
}

describe("openaiStrategicQa — scenarioHash", () => {
  it("is stable for identical inputs", () => {
    const a = baseInput();
    const b = baseInput();
    expect(computeScenarioHash(a)).toBe(computeScenarioHash(b));
  });

  it("changes when compareToBase changes", () => {
    const a = baseInput({ compareToBase: true });
    const b = baseInput({ compareToBase: false });
    expect(computeScenarioHash(a)).not.toBe(computeScenarioHash(b));
  });
});

describe("openaiStrategicQa — validation", () => {
  it("rejects digits in answers", () => {
    const jsonText = JSON.stringify({
      version: "1.0",
      scenarioId: "base",
      scenarioLabel: "base",
      compareToBase: true,
      items: [
        {
          id: "growth_sustainability",
          question: "How sustainable is current growth under this scenario?",
          answer: "Relative to base, momentum appears stronger by 2 points.",
          confidence: "medium",
          tags: ["momentum"],
        },
      ],
    });

    expect(() =>
      parseAndValidateAIQAResponse({
        jsonText,
        expectedScenarioId: "base",
        expectedScenarioLabel: "base",
        expectedCompareToBase: true,
        expectedQuestionIds: ["growth_sustainability"],
      })
    ).toThrow();
  });
});

describe("openaiStrategicQa — fallback + cache", () => {
  it("fallback returns null when fetcher throws", async () => {
    const cache = createStrategicQaCache();
    const out = await fetchStrategicQaCached({
      cache,
      hash: "deadbeef",
      fetcher: async () => {
        throw new Error("boom");
      },
    });
    expect(out).toBeNull();
    expect(cache.has("deadbeef")).toBe(false);
  });

  it("cache prevents duplicate calls for same hash (in-flight dedupe)", async () => {
    const cache = createStrategicQaCache();
    const fetcher = vi.fn(async () => {
      return {
        version: "1.0",
        scenarioId: "base",
        scenarioLabel: "base",
        compareToBase: true,
        items: [
          {
            id: "growth_sustainability",
            question: "How sustainable is current growth under this scenario?",
            answer: "Relative to base, the growth posture appears more sensitive to execution tolerance.",
            confidence: "medium",
            tags: ["momentum", "execution"],
          },
        ],
      } as any;
    });

    const [a, b] = await Promise.all([
      cache.getOrFetch("abc", fetcher),
      cache.getOrFetch("abc", fetcher),
    ]);
    expect(a).toBe(b);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});



