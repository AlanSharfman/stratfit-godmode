// src/core/voice/voiceApi.ts
// STRATFIT — Voice API Client
// Phase 11 Voice API Lock

import type { VoiceRequestPayload, VoiceStreamHandle } from "./voiceTypes";

let currentAudio: HTMLAudioElement | null = null;
let currentObjectUrl: string | null = null;

function revokeCurrentUrl() {
    if (currentObjectUrl) {
        URL.revokeObjectURL(currentObjectUrl);
        currentObjectUrl = null;
    }
}

export async function playVoiceNarration(payload: VoiceRequestPayload): Promise<VoiceStreamHandle> {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
        revokeCurrentUrl();
    }

    const res = await fetch("/api/voice/narrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    currentObjectUrl = url;

    const audio = new Audio(url);
    currentAudio = audio;

    audio.addEventListener("ended", revokeCurrentUrl, { once: true });
    audio.addEventListener("error", revokeCurrentUrl, { once: true });

    try {
        await audio.play();
    } catch {
        // autoplay may require user interaction
    }

    return {
        stop: () => {
            audio.pause();
            audio.currentTime = 0;
            revokeCurrentUrl();
        },
    };
}
