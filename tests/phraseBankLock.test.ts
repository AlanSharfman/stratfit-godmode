import { describe, expect, it } from "vitest";
import { PhraseBank } from '../src/memo/answerCrossScenarioQuestion';
import { presentIntelligence } from '../src/memo/presentIntelligence';

describe('PhraseBank Language Lock', () => {
  it('should only output phrase-locked bullets for investor mode', () => {
    const fakeIntelligence = {
      executiveSummary: ['123 dollars', 'Critical risk'],
      keyObservations: ['High margin', 'Cash position is strong'],
      riskSignals: [{ severity: 'HIGH', title: 'Risk $', driver: 'Margin', impact: 'Revenue' }],
      leadershipAttention: ['Must optimize', 'Initiate program', 'Drive action'],
      strategicQA: [
        { question: 'What is the cash position?', answer: 'Cash is $1m' },
        { question: 'How risky?', answer: 'Risk is high' },
      ],
      assumptionFlags: ['flag'],
    };
    const result = presentIntelligence(fakeIntelligence as any, 'investor');
    // All outputs must be phrase-locked or the guard string
    const banned = /[0-9$%mk]|million|billion|usd|eur|gbp|yen|dollar|euro|pound|percent/i;
    const allBullets = [
      ...result.executiveSummary,
      ...result.keyObservations,
      ...result.riskSignals.map((r: any) => r.title + r.driver + r.impact),
      ...result.leadershipAttention,
      ...result.strategicQA.map((qa: any) => qa.answer),
    ];
    allBullets.forEach(bullet => {
      expect(bullet === 'Signal is directionally clear, but requires validation.' || !banned.test(bullet)).toBe(true);
    });
  });
});
