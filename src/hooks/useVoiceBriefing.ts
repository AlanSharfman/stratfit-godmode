/**
 * STRATFIT — Voice Briefing Hook
 *
 * Uses OpenAI TTS (gpt-4o-mini-tts, alloy voice) to narrate the
 * strategic intelligence analysis. Caches audio blobs by analysis hash
 * to avoid regenerating when inputs haven't changed.
 */

import { useCallback, useEffect, useRef, useState } from "react"
import type { CompareAnalysis } from "@/engine/whatif"
import { hasOpenAIApiKey } from "@/lib/openai/apiKey"
import { useVoiceBriefingStore } from "@/store/voiceBriefingStore"
import { streamingSpeech, type StreamingTTSHandle } from "@/voice/openaiTTS"

export type VoiceState = "idle" | "loading" | "playing" | "paused" | "muted" | "error"

export interface UseVoiceBriefingResult {
  voiceState: VoiceState
  play: () => void
  pause: () => void
  toggleMute: () => void
  stop: () => void
}

function buildNarrationScript(a: CompareAnalysis): string {
  return [
    "Founder read complete.",
    "",
    `The best bet right now is ${a.recommended_scenario}.`,
    "",
    a.headline,
    "",
    `Why it wins: ${a.why_this_wins.peak_height}.`,
    `Momentum signal: ${a.why_this_wins.ridge_strength}.`,
    `Risk underneath: ${a.why_this_wins.valley_depth}.`,
    `How steady it feels: ${a.why_this_wins.terrain_stability}.`,
    "",
    a.strategic_insight,
  ].join("\n")
}

function hashAnalysis(a: CompareAnalysis): string {
  return `${a.recommended_scenario}|${a.headline}|${a.strategic_insight}`
}

export function useVoiceBriefing(
  analysis: CompareAnalysis | null,
  typewriterDone: boolean,
  autoPlay: boolean = true,
): UseVoiceBriefingResult {
  const [voiceState, setVoiceState] = useState<VoiceState>("idle")
  const handleRef = useRef<StreamingTTSHandle | null>(null)
  const lastHashRef = useRef<string>("")
  const autoTriggeredRef = useRef(false)
  const setSpeaking = useVoiceBriefingStore((s) => s.setSpeaking)

  const cleanup = useCallback(() => {
    if (handleRef.current) {
      handleRef.current.cancel()
      handleRef.current = null
    }
    setSpeaking(false)
  }, [setSpeaking])

  const startStreaming = useCallback((a: CompareAnalysis) => {
    if (!hasOpenAIApiKey()) {
      setVoiceState("error")
      return
    }

    cleanup()

    const script = buildNarrationScript(a)
    const handle = streamingSpeech(
      script,
      { voice: "alloy", speed: 0.95 },
      (state) => {
        if (state === "loading") { setVoiceState("loading"); }
        else if (state === "playing") { setVoiceState("playing"); setSpeaking(true); }
        else if (state === "idle") { setVoiceState("idle"); setSpeaking(false); }
        else if (state === "error") { setVoiceState("error"); setSpeaking(false); }
      },
    )
    handleRef.current = handle
  }, [cleanup, setSpeaking])

  // Auto-trigger: when typewriter finishes, start streaming after 800ms
  useEffect(() => {
    if (!analysis || !typewriterDone || !autoPlay) return

    const hash = hashAnalysis(analysis)
    if (hash === lastHashRef.current && autoTriggeredRef.current) return

    lastHashRef.current = hash
    autoTriggeredRef.current = true

    const timer = setTimeout(() => startStreaming(analysis), 200)
    return () => clearTimeout(timer)
  }, [analysis, typewriterDone, autoPlay, startStreaming])

  // Stop audio when analysis changes
  useEffect(() => {
    if (!analysis) {
      cleanup()
      setVoiceState("idle")
      autoTriggeredRef.current = false
      lastHashRef.current = ""
    }
  }, [analysis, cleanup])

  useEffect(() => cleanup, [cleanup])

  const play = useCallback(() => {
    if (analysis) startStreaming(analysis)
  }, [analysis, startStreaming])

  const pause = useCallback(() => {
    cleanup()
    setVoiceState("paused")
  }, [cleanup])

  const toggleMute = useCallback(() => {
    // Streaming chunks don't expose a single audio element for mute toggle;
    // cancel is the closest equivalent.
    cleanup()
    setVoiceState("muted")
  }, [cleanup])

  const stop = useCallback(() => {
    cleanup()
    setVoiceState("idle")
  }, [cleanup])

  return { voiceState, play, pause, toggleMute, stop }
}
