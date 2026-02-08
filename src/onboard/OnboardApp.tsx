// src/onboard/OnboardApp.tsx
// Standalone onboarding module (no routing). Can be mounted behind an /onboard pathname gate later.

import React, { useState } from "react";
import type { OnboardStepId } from "./validators";
import { validateStep } from "./validators";
import { useOnboardDraft } from "./hooks/useOnboardDraft";
import { useOnboardValidation } from "./hooks/useOnboardValidation";
import { useBaselineStore } from "@/state/onboardingStore";

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

type Props = {
  /**
   * If provided, we’ll call this after locking baseline, instead of hard-reloading the page.
   * (The app uses a no-router view state, so this is the cleanest handoff.)
   */
  onExitToTerrain?: () => void;
};

export function OnboardApp({ onExitToTerrain }: Props) {
  const baselineLocked = useBaselineStore((s) => s.baselineLocked);
  const resetBaseline = useBaselineStore((s) => s.resetBaseline);

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

    if (baselineLocked) {
      onExitToTerrain?.();
      if (!onExitToTerrain) window.location.assign("/");
      return;
    }

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
    onExitToTerrain?.();
    if (!onExitToTerrain) window.location.assign("/");
  };

  if (baselineLocked) {
    return (
      <div className="sfOn-root">
        <div className="sfOn-shell">
          <div style={{ padding: 18 }}>
            <div
              style={{
                borderRadius: 18,
                border: "1px solid rgba(255,255,255,0.10)",
                background: "rgba(8, 12, 20, 0.45)",
                backdropFilter: "blur(16px)",
                padding: 16,
                maxWidth: 980,
                margin: "0 auto",
              }}
            >
              <div style={{ fontSize: 12, letterSpacing: "0.16em", fontWeight: 900, opacity: 0.85 }}>
                BASELINE LOCKED
              </div>
              <div style={{ marginTop: 8, fontSize: 14, lineHeight: 1.45, opacity: 0.9 }}>
                Your baseline truth is already locked. You can continue to Terrain, or reset baseline to re-enter onboarding.
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
                <button type="button" className="sfOn-btn sfOn-btn--primary" onClick={onContinueToTerrain}>
                  Continue to Terrain
                </button>
                <button
                  type="button"
                  className="sfOn-btn"
                  onClick={() => {
                    const ok = window.confirm(
                      "Reset baseline? This clears the locked baseline truth and returns you to onboarding draft mode."
                    );
                    if (!ok) return;
                    resetBaseline();
                  }}
                >
                  Reset Baseline
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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


