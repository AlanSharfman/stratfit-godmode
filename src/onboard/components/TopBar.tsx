// src/onboard/components/TopBar.tsx

import React from "react";
import { CheckCircle2, ShieldCheck } from "lucide-react";

export function TopBar({
  activeLabel,
  savedPulse,
  allCoreValid,
  onContinue,
  onInitializeTerrain,
}: {
  activeLabel: string;
  savedPulse: boolean;
  allCoreValid: boolean;
  onContinue: () => void;
  onInitializeTerrain: () => void;
}) {
  return (
    <div className="sfOn-topbar">
      <div className="sfOn-topbarLeft">
        <div className="sfOn-brand">
          <div className="sfOn-brandMark">STRATFIT</div>
          <div className="sfOn-brandSub">Onboarding</div>
        </div>
        <div className="sfOn-topbarDivider" />
        <div className="sfOn-activeStep">
          <div className="sfOn-activeStepLabel">{activeLabel}</div>
          <div className="sfOn-activeStepHint">Institutional baseline capture</div>
        </div>
      </div>

      <div className="sfOn-topbarRight">
        <div className={`sfOn-saved ${savedPulse ? "isOn" : ""}`}>
          <CheckCircle2 className="sfOn-savedIcon" />
          Draft saved
        </div>

        <div className={`sfOn-ready ${allCoreValid ? "isReady" : ""}`}>
          <ShieldCheck className="sfOn-readyIcon" />
          Core baseline {allCoreValid ? "ready" : "in progress"}
        </div>

        <button type="button" className="sfOn-btn sfOn-btn--ghost" onClick={onContinue}>
          Continue
        </button>
        <button
          type="button"
          className="sfOn-btn sfOn-btn--primary"
          onClick={onInitializeTerrain}
          disabled={!allCoreValid}
          title={allCoreValid ? "Initialize terrain baseline" : "Complete core baseline fields first"}
        >
          Initialize Terrain
        </button>
      </div>
    </div>
  );
}


