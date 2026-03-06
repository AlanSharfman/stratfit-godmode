// src/features/intelligence/ttsEngine.ts
// STRATFIT — TTS Engine (OpenAI streaming chunks + browser fallback)
//
// Uses chunked streaming: text is split at sentence boundaries (~150 words
// per chunk), all chunks are requested in parallel, and playback starts as
// soon as chunk 1 arrives. This reduces perceived latency from ~4-8s
// (full blob) to ~1-2s (first chunk round-trip).

import { streamingSpeech, hasOpenAIKey, type StreamingTTSHandle } from "@/voice/openaiTTS"

let currentHandle: StreamingTTSHandle | null = null

export function ttsAvailable(): boolean {
  return hasOpenAIKey() || (typeof window !== "undefined" && "speechSynthesis" in window)
}

export async function ttsSpeak(text: string): Promise<void> {
  ttsCancel()

  if (hasOpenAIKey()) {
    try {
      const handle = streamingSpeech(text, { voice: "nova", speed: 0.9 })
      currentHandle = handle
      await handle.done
      currentHandle = null
      return
    } catch (err) {
      console.warn("[ttsEngine] OpenAI streaming TTS failed, falling back to browser:", err)
    }
  }

  if (typeof window === "undefined" || !("speechSynthesis" in window)) return

  window.speechSynthesis.cancel()

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.rate = 0.9
  utterance.pitch = 1.0
  utterance.volume = 0.8

  const voices = window.speechSynthesis.getVoices()
  const preferred = voices.find(
    (v) =>
      v.lang.startsWith("en") &&
      (v.name.includes("Google") ||
        v.name.includes("Microsoft") ||
        v.name.includes("Samantha") ||
        v.name.includes("Daniel")),
  )
  if (preferred) utterance.voice = preferred

  window.speechSynthesis.speak(utterance)
}

export function ttsCancel(): void {
  if (currentHandle) {
    currentHandle.cancel()
    currentHandle = null
  }
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel()
  }
}
