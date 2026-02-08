// src/onboard/components/StepRail.tsx

import React from "react";
import { CheckCircle2, Circle } from "lucide-react";
import type { OnboardingData } from "../schema";
import type { OnboardStepId } from "../validators";
import { validateStep } from "../validators";

export interface StepDef {
  id: OnboardStepId;
  label: string;
  subtitle: string;
}

export function StepRail({
  steps,
  active,
  data,
  onSelect,
  attentionSteps,
}: {
  steps: StepDef[];
  active: OnboardStepId;
  data: OnboardingData;
  onSelect: (id: OnboardStepId) => void;
  attentionSteps?: OnboardStepId[];
}) {
  return (
    <aside className="sfOn-rail">
      <div className="sfOn-railHeader">
        <div className="sfOn-railTitle">Baseline Steps</div>
        <div className="sfOn-railSub">Click any step — progress is non-blocking</div>
      </div>
      <div className="sfOn-railList">
        {steps.map((s) => {
          const done = validateStep(s.id, data);
          const isActive = active === s.id;
          const needsAttention = !done && !!attentionSteps?.includes(s.id);
          return (
            <button
              key={s.id}
              type="button"
              className={`sfOn-railItem ${isActive ? "isActive" : ""} ${needsAttention ? "needsAttention" : ""}`}
              onClick={() => onSelect(s.id)}
            >
              <div className={`sfOn-railIcon ${done ? "isDone" : ""}`}>
                {done ? <CheckCircle2 /> : <Circle />}
              </div>
              <div className="sfOn-railText">
                <div className="sfOn-railLabel">{s.label}</div>
                <div className="sfOn-railSubtitle">{s.subtitle}</div>
              </div>
              <div className={`sfOn-railStatus ${done ? "isDone" : ""}`}>{done ? "Complete" : "Core"}</div>
            </button>
          );
        })}
      </div>

      <div className="sfOn-railFooter">
        <div className="sfOn-railFooterTitle">Design intent</div>
        <div className="sfOn-railFooterText">
          Capture just enough structure to generate a resilient terrain baseline—without forcing long forms or fragile option lists.
        </div>
      </div>
    </aside>
  );
}


