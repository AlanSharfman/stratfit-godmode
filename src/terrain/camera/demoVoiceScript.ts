// src/terrain/camera/demoVoiceScript.ts
// STRATFIT — Demo Anchor Voice Script
// Phase 11 Voice API Lock

import type { VoiceCue } from "@/core/voice/voiceTypes";

export const DEMO_VOICE_SCRIPT: VoiceCue[] = [
    {
        step: 0,
        anchorId: "terrain",
        title: "Decision Canvas",
        description:
            "This terrain represents the decision environment. Each contour reflects structural constraints and opportunity gradients within the model.",
    },
    {
        step: 1,
        anchorId: "survival",
        title: "Probability Signal",
        description:
            "Survival probability is derived from the simulation engine and represents the likelihood of sustaining operations across the forecast horizon.",
    },
    {
        step: 2,
        anchorId: "liquidity",
        title: "Liquidity Axis",
        description:
            "Liquidity is a first-class dimension. The trajectory illustrates how cash evolves under median conditions and uncertainty bands.",
    },
    {
        step: 3,
        anchorId: "valuation",
        title: "Value Bands",
        description:
            "Valuation is expressed as probabilistic ranges rather than a single point estimate, reflecting model variability.",
    },
];
