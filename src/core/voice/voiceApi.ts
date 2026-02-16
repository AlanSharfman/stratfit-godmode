// src/core/voice/voiceApi.ts
// STRATFIT — Voice API Client
// Phase 11 Voice API Lock

import type { VoiceRequestPayload, VoiceStreamHandle } from "./voiceTypes";

let currentAudio: HTMLAudioElement | null = null;

export async function playVoiceNarration(payload: VoiceRequestPayload): Promise<VoiceStreamHandle> {
    // stop any existing narration
    if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
    }

    const res = await fetch("/api/voice/narrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);

    const audio = new Audio(url);
    currentAudio = audio;

    try {
        await audio.play();
    } catch {
        // autoplay may require user interaction
    }

    return {
        stop: () => {
            audio.pause();
            audio.currentTime = 0;
        },
    };
}
