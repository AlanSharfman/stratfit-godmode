// src/core/voice/voiceTypes.ts
// STRATFIT — Voice Type Contract
// Phase 11 Voice API Lock

export interface VoiceCue {
    step: number;
    anchorId: string;
    title: string;
    description: string;
}

export interface VoiceRequestPayload {
    text: string;
    voice: "nasa_female";
    style: "documentary";
    speed?: number;
}

export interface VoiceStreamHandle {
    stop: () => void;
}
