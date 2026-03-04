// src/voice/openaiTTS.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — OpenAI TTS Service
//
// Converts text to natural speech using OpenAI's TTS API (tts-1 model).
// Returns an audio blob that can be played via HTMLAudioElement.
//
// Voice: "nova" — warm, sweet, natural American female
// Model: "tts-1" for low latency (tts-1-hd available for higher quality)
// ═══════════════════════════════════════════════════════════════════════════

const TTS_ENDPOINT = "https://api.openai.com/v1/audio/speech";
const TTS_MODEL = "tts-1";
const TTS_VOICE = "nova"; // Warm, engaging American female
const TTS_SPEED = 0.95; // Slightly slower for documentary feel
const TTS_FORMAT = "mp3";

/** Resolve OpenAI API key from env or localStorage (same pattern as openaiScenarioQa) */
function getApiKey(): string | null {
  const fromEnv = (import.meta as any)?.env?.VITE_OPENAI_API_KEY as string | undefined;
  if (fromEnv && fromEnv.trim()) return fromEnv.trim();
  try {
    const fromLs = window.localStorage.getItem("OPENAI_API_KEY");
    return fromLs && fromLs.trim() ? fromLs.trim() : null;
  } catch {
    return null;
  }
}

export interface TTSOptions {
  /** Override voice (default: "nova") */
  voice?: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";
  /** Override speed 0.25–4.0 (default: 0.95) */
  speed?: number;
  /** Use HD model for higher quality (default: false — uses tts-1 for lower latency) */
  hd?: boolean;
}

export interface TTSResult {
  /** Audio blob (mp3) */
  blob: Blob;
  /** Object URL for HTMLAudioElement.src — caller must revoke when done */
  url: string;
}

/**
 * Convert text to speech via OpenAI TTS API.
 * Returns an audio blob + object URL ready for playback.
 * Throws on network/auth errors.
 */
export async function synthesizeSpeech(
  text: string,
  options: TTSOptions = {},
): Promise<TTSResult> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error(
      "OpenAI API key not found. Set VITE_OPENAI_API_KEY in .env or localStorage.OPENAI_API_KEY in browser.",
    );
  }

  const body = {
    model: options.hd ? "tts-1-hd" : TTS_MODEL,
    input: text,
    voice: options.voice ?? TTS_VOICE,
    speed: options.speed ?? TTS_SPEED,
    response_format: TTS_FORMAT,
  };

  const res = await fetch(TTS_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText);
    throw new Error(`OpenAI TTS error ${res.status}: ${errText}`);
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  return { blob, url };
}

/** Check if an OpenAI API key is available */
export function hasOpenAIKey(): boolean {
  return getApiKey() !== null;
}
