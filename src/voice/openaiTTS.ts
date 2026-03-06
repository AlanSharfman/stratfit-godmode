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

import { getOpenAIApiKey, hasOpenAIApiKey } from "@/lib/openai/apiKey";
const getApiKey = getOpenAIApiKey;

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
  return hasOpenAIApiKey();
}

// ═══════════════════════════════════════════════════════════════════════════
// Chunked TTS — split text into chunks, synthesize in parallel/sequence,
// play chunk 1 immediately while preloading chunk 2+.
// ═══════════════════════════════════════════════════════════════════════════

const CHUNK_WORD_LIMIT = 150;

/**
 * Split text into chunks of roughly `maxWords` words, breaking at sentence
 * boundaries. Never splits mid-sentence.
 */
export function splitTextIntoChunks(text: string, maxWords = CHUNK_WORD_LIMIT): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [text];
  const chunks: string[] = [];
  let current = "";
  let wordCount = 0;

  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;
    const sentenceWords = trimmed.split(/\s+/).length;

    if (wordCount + sentenceWords > maxWords && current.length > 0) {
      chunks.push(current.trim());
      current = trimmed;
      wordCount = sentenceWords;
    } else {
      current += (current ? " " : "") + trimmed;
      wordCount += sentenceWords;
    }
  }
  if (current.trim()) chunks.push(current.trim());

  return chunks.length > 0 ? chunks : [text];
}

export interface StreamingTTSHandle {
  /** Abort all pending requests and stop playback */
  cancel: () => void;
  /** Promise that resolves when all chunks finish playing */
  done: Promise<void>;
}

/**
 * Streaming TTS: splits text into chunks, fires first chunk's API call
 * immediately, preloads subsequent chunks while earlier ones play.
 *
 * Latency improvement: user hears audio after ~1-2s (first chunk TTS
 * round-trip) instead of waiting for the full text to synthesize (~4-8s).
 */
export function streamingSpeech(
  text: string,
  options: TTSOptions = {},
  onStateChange?: (state: "loading" | "playing" | "idle" | "error") => void,
): StreamingTTSHandle {
  const chunks = splitTextIntoChunks(text);
  let cancelled = false;
  let currentAudio: HTMLAudioElement | null = null;

  const done = (async () => {
    const apiKey = getApiKey();
    if (!apiKey) {
      onStateChange?.("error");
      throw new Error("No OpenAI API key");
    }

    onStateChange?.("loading");

    // Fire all chunk requests in parallel for maximum preload
    const fetchPromises = chunks.map((chunk) => {
      if (cancelled) return Promise.resolve(null);
      return fetch(TTS_ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: options.hd ? "tts-1-hd" : TTS_MODEL,
          input: chunk,
          voice: options.voice ?? TTS_VOICE,
          speed: options.speed ?? TTS_SPEED,
          response_format: TTS_FORMAT,
        }),
      }).then(async (res) => {
        if (!res.ok) throw new Error(`TTS HTTP ${res.status}`);
        return res.blob();
      }).catch((e) => {
        if (!cancelled) console.warn("[streamingTTS] chunk failed:", e);
        return null;
      });
    });

    // Play chunks sequentially as they resolve
    for (let i = 0; i < chunks.length; i++) {
      if (cancelled) break;

      const blob = await fetchPromises[i];
      if (!blob || cancelled) break;

      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      currentAudio = audio;

      if (i === 0) onStateChange?.("playing");

      await new Promise<void>((resolve) => {
        audio.onended = () => {
          URL.revokeObjectURL(url);
          currentAudio = null;
          resolve();
        };
        audio.onerror = () => {
          URL.revokeObjectURL(url);
          currentAudio = null;
          resolve();
        };
        audio.play().catch(() => resolve());
      });
    }

    if (!cancelled) onStateChange?.("idle");
  })();

  return {
    cancel: () => {
      cancelled = true;
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio = null;
      }
      onStateChange?.("idle");
    },
    done,
  };
}
