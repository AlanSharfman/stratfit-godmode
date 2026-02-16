// src/core/voice/demoVoiceOrchestrator.ts
// STRATFIT — Voice Orchestrator (Sync with Demo Steps)
// Phase 11 Voice API Lock

import { DEMO_VOICE_SCRIPT } from "@/terrain/camera/demoVoiceScript";
import { playVoiceNarration } from "./voiceApi";

let activeHandle: { stop: () => void } | null = null;

export async function runVoiceForStep(step: number) {
    const cue = DEMO_VOICE_SCRIPT.find((c) => c.step === step);
    if (!cue) return;

    if (activeHandle) activeHandle.stop();

    const text = `${cue.title}. ${cue.description}`;

    activeHandle = await playVoiceNarration({
        text,
        voice: "nasa_female",
        style: "documentary",
        speed: 1.0,
    });
}

export function stopVoice() {
    if (activeHandle) activeHandle.stop();
    activeHandle = null;
}
