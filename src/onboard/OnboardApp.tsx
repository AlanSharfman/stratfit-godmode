// src/onboard/OnboardApp.tsx
// Standalone onboarding module (no routing). Can be mounted behind an /onboard pathname gate later.

import React, { useState } from "react";
import type { OnboardStepId } from "./validators";
import { validateStep } from "./validators";
import { useOnboardDraft } from "./hooks/useOnboardDraft";
import { useOnboardValidation } from "./hooks/useOnboardValidation";

import { TopBar } from "./components/TopBar";
import { StepRail, type StepDef } from "./components/StepRail";
import { RightIntelPanel } from "./components/RightIntelPanel";

import { CompanyTab } from "./tabs/CompanyTab";
import { FinancialTab } from "./tabs/FinancialTab";
import { CapitalTab } from "./tabs/CapitalTab";
import { OperatingTab } from "./tabs/OperatingTab";
import { StrategicTab } from "./tabs/StrategicTab";
import { loadOnboardDraft } from "./storage";
import { mapOnboardDraftToBaseline, saveBaseline } from "./baseline";

import "./styles/onboard.css";

const STEPS: StepDef[] = [
  { id: "company", label: "Company Profile", subtitle: "Identity and perimeter" },
  { id: "financial", label: "Financial Baseline", subtitle: "ARR, margin, burn, cash" },
  { id: "capital", label: "Capital Structure", subtitle: "Debt and raise context" },
  { id: "operating", label: "Operating Dynamics", subtitle: "Churn, cycle, risk" },
  { id: "strategic", label: "Strategic Posture", subtitle: "Focus, horizon, constraints" },
];

function stepLabel(id: OnboardStepId) {
  return STEPS.find((s) => s.id === id)?.label ?? "Onboarding";
}

export function OnboardApp() {
  const [active, setActive] = useState<OnboardStepId>("company");
  const { data, patch, savedPulse, flush } = useOnboardDraft();

  const [advOpen, setAdvOpen] = useState<Record<OnboardStepId, boolean>>({
    company: false,
    financial: false,
    capital: false,
    operating: false,
    strategic: false,
  });

  const { allCoreValid } = useOnboardValidation(STEPS, data);
  const [inlineMsg, setInlineMsg] = useState<string | null>(null);
  const [attentionSteps, setAttentionSteps] = useState<OnboardStepId[] | undefined>(undefined);

  const goNext = () => {
    const idx = STEPS.findIndex((s) => s.id === active);
    const next = STEPS[Math.min(STEPS.length - 1, idx + 1)]?.id ?? active;
    setActive(next);
  };

  const onContinueToTerrain = () => {
    setInlineMsg(null);

    if (!allCoreValid) {
      const missing = STEPS.filter((s) => !validateStep(s.id, data)).map((s) => s.id);
      setAttentionSteps(missing);
      setInlineMsg("Core baseline is incomplete. Complete the highlighted steps, then continue to Terrain.");
      return;
    }

    // Persist latest draft snapshot first (debounce-safe)
    flush();

    // Deterministic: load the stored draft snapshot, map to baseline, persist, then redirect.
    const draft = loadOnboardDraft();
    const baseline = mapOnboardDraftToBaseline(draft);
    saveBaseline(baseline);
    window.location.assign("/?view=terrain");
  };

  return (
    <div className="sfOn-root">
      <div className="sfOn-shell">
        <TopBar
          activeLabel={stepLabel(active)}
          savedPulse={savedPulse}
          allCoreValid={allCoreValid}
          onContinue={goNext}
          onContinueToTerrain={onContinueToTerrain}
          inlineMessage={inlineMsg}
        />

        <div className="sfOn-body">
          <StepRail
            steps={STEPS}
            active={active}
            data={data}
            onSelect={(id) => {
              setActive(id);
              if (inlineMsg) setInlineMsg(null);
            }}
            attentionSteps={attentionSteps}
          />

          <div className="sfOn-center">
            {active === "company" && <CompanyTab data={data} onChange={patch} />}
            {active === "financial" && (
              <FinancialTab
                data={data}
                advancedOpen={advOpen.financial}
                onToggleAdvanced={() => setAdvOpen((s) => ({ ...s, financial: !s.financial }))}
                onChange={patch}
              />
            )}
            {active === "capital" && (
              <CapitalTab
                data={data}
                advancedOpen={advOpen.capital}
                onToggleAdvanced={() => setAdvOpen((s) => ({ ...s, capital: !s.capital }))}
                onChange={patch}
              />
            )}
            {active === "operating" && (
              <OperatingTab
                data={data}
                advancedOpen={advOpen.operating}
                onToggleAdvanced={() => setAdvOpen((s) => ({ ...s, operating: !s.operating }))}
                onChange={patch}
              />
            )}
            {active === "strategic" && <StrategicTab data={data} onChange={patch} />}
          </div>

          <RightIntelPanel active={active} data={data} />
        </div>
      </div>
    </div>
  );
}

export default OnboardApp;


