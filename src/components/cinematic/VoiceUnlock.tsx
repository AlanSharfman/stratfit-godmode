// src/components/cinematic/VoiceUnlock.tsx
// STRATFIT — Fallback User Unlock Button (Autoplay Safe)
// Phase 11 Voice API Lock

import { runVoiceForStep } from "@/core/voice/demoVoiceOrchestrator";
import { useCinematicStore } from "@/core/store/useCinematicStore";

export default function VoiceUnlock() {
    const step = useCinematicStore((s) => s.demoStep);

    return (
        <button
            className="voiceUnlock"
            onClick={() => runVoiceForStep(step)}
        >
            Enable Narration
        </button>
    );
}
