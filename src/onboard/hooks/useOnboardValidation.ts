// src/onboard/hooks/useOnboardValidation.ts

import { useMemo } from "react";
import type { OnboardingData } from "../schema";
import type { OnboardStepId } from "../validators";
import { validateStep } from "../validators";

export function useOnboardValidation(steps: { id: OnboardStepId }[], data: OnboardingData) {
  return useMemo(() => {
    const perStep = Object.fromEntries(steps.map((s) => [s.id, validateStep(s.id, data)])) as Record<OnboardStepId, boolean>;
    const allCoreValid = steps.every((s) => perStep[s.id]);
    return { perStep, allCoreValid };
  }, [steps, data]);
}


