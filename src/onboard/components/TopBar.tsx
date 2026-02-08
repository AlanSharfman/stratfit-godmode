// src/onboard/components/TopBar.tsx

import React from "react";
import { CheckCircle2, ShieldCheck } from "lucide-react";

export function TopBar({
  activeLabel,
  savedPulse,
  allCoreValid,
  onContinue,
  onContinueToTerrain,
  inlineMessage,
}: {
  activeLabel: string;
  savedPulse: boolean;
  allCoreValid: boolean;
  onContinue: () => void;
  onContinueToTerrain: () => void;
  inlineMessage?: string | null;
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
        {inlineMessage ? <div className="sfOn-inlineMsg">{inlineMessage}</div> : null}

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
          onClick={onContinueToTerrain}
          title="Validate core baseline, save truth layer, and enter Terrain"
        >
          Continue to Terrain
        </button>
      </div>
    </div>
  );
}


