// src/features/intelligence/ttsEngine.ts
// STRATFIT — TTS Engine (OpenAI Nova + browser fallback)
//
// Prefers OpenAI TTS (Nova voice) for natural cinematic narration.
// Falls back to browser SpeechSynthesis when no API key is configured.

import { synthesizeSpeech, hasOpenAIKey } from "@/voice/openaiTTS"

let currentAudio: HTMLAudioElement | null = null

export function ttsAvailable(): boolean {
  return hasOpenAIKey() || (typeof window !== "undefined" && "speechSynthesis" in window)
}

export async function ttsSpeak(text: string): Promise<void> {
  ttsCancel()

  if (hasOpenAIKey()) {
    try {
      const result = await synthesizeSpeech(text, { voice: "nova", speed: 0.9 })
      const audio = new Audio(result.url)
      currentAudio = audio
      audio.onended = () => {
        URL.revokeObjectURL(result.url)
        currentAudio = null
      }
      audio.play().catch(() => {})
      return
    } catch (err) {
      console.warn("[ttsEngine] OpenAI TTS failed, falling back to browser:", err)
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
  if (currentAudio) {
    currentAudio.pause()
    currentAudio.currentTime = 0
    currentAudio = null
  }
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel()
  }
}
