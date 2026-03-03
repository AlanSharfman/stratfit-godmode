// src/features/intelligence/ttsEngine.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — TTS Engine (Optional Audio Narration)
//
// Uses browser SpeechSynthesis when available.
// Neutral voice, slightly slower rate, interruptible.
// NarrationCue triggers speak(text).
// ═══════════════════════════════════════════════════════════════════════════

/** Check if TTS is available in this browser */
export function ttsAvailable(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window
}

/** Speak text with neutral voice. Interruptible. */
export function ttsSpeak(text: string): void {
  if (!ttsAvailable()) return

  // Cancel any ongoing speech
  window.speechSynthesis.cancel()

  const utterance = new SpeechSynthesisUtterance(text)

  // Neutral, slightly slower rate
  utterance.rate = 0.9
  utterance.pitch = 1.0
  utterance.volume = 0.8

  // Prefer a neutral English voice
  const voices = window.speechSynthesis.getVoices()
  const preferred = voices.find(
    (v) =>
      v.lang.startsWith("en") &&
      (v.name.includes("Google") ||
        v.name.includes("Microsoft") ||
        v.name.includes("Samantha") ||
        v.name.includes("Daniel")),
  )
  if (preferred) {
    utterance.voice = preferred
  }

  window.speechSynthesis.speak(utterance)
}

/** Cancel any ongoing speech */
export function ttsCancel(): void {
  if (!ttsAvailable()) return
  window.speechSynthesis.cancel()
}
