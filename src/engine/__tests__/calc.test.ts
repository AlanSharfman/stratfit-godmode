// @vitest-ignore
// Tests will be wired in Phase 2, Step 2 (test runner setup)
// For now, this file serves as a specification of expected behaviour

import { calculateOutputs, calculateDeltas } from "../calc";
import { DEFAULT_INPUTS, DEFAULT_LEVERS } from "../defaults";

// TODO: Configure Jest/Vitest and uncomment these tests

/*
test("calculateOutputs is deterministic", () => {
  const a = calculateOutputs(DEFAULT_INPUTS, DEFAULT_LEVERS);
  const b = calculateOutputs(DEFAULT_INPUTS, DEFAULT_LEVERS);
  expect(a).toEqual(b);
});

test("deltas compute correctly", () => {
  const base = calculateOutputs(DEFAULT_INPUTS, DEFAULT_LEVERS);
  const scenario = calculateOutputs(DEFAULT_INPUTS, { ...DEFAULT_LEVERS, pricingPower: 0.9 });
  const deltas = calculateDeltas(base, scenario);
  const valuationDelta = deltas.find(d => d.key === "valuation");
  expect(valuationDelta).toBeTruthy();
});
*/
