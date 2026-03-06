/**
 * STRATFIT — Voice Briefing Hook
 *
 * Uses OpenAI TTS (gpt-4o-mini-tts, alloy voice) to narrate the
 * strategic intelligence analysis. Caches audio blobs by analysis hash
 * to avoid regenerating when inputs haven't changed.
 */

import { useCallback, useEffect, useRef, useState } from "react"
import type { CompareAnalysis } from "@/engine/whatif"
import { getOpenAIApiKey, hasOpenAIApiKey } from "@/lib/openai/apiKey"
import { useVoiceBriefingStore } from "@/store/voiceBriefingStore"

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
    "Strategic analysis complete.",
    "",
    `The strongest scenario is ${a.recommended_scenario}.`,
    "",
    a.headline,
    "",
    `Peak height: ${a.why_this_wins.peak_height}.`,
    `Ridge strength: ${a.why_this_wins.ridge_strength}.`,
    `Valley depth: ${a.why_this_wins.valley_depth}.`,
    `Terrain stability: ${a.why_this_wins.terrain_stability}.`,
    "",
    a.strategic_insight,
  ].join("\n")
}

function hashAnalysis(a: CompareAnalysis): string {
  return `${a.recommended_scenario}|${a.headline}|${a.strategic_insight}`
}

const audioCache = new Map<string, Blob>()

export function useVoiceBriefing(
  analysis: CompareAnalysis | null,
  typewriterDone: boolean,
  autoPlay: boolean = true,
): UseVoiceBriefingResult {
  const [voiceState, setVoiceState] = useState<VoiceState>("idle")
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const urlRef = useRef<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const lastHashRef = useRef<string>("")
  const autoTriggeredRef = useRef(false)
  const setSpeaking = useVoiceBriefingStore((s) => s.setSpeaking)

  const cleanup = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.removeAttribute("src")
      audioRef.current = null
    }
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current)
      urlRef.current = null
    }
    abortRef.current?.abort()
    setSpeaking(false)
  }, [setSpeaking])

  const generateAudio = useCallback(async (a: CompareAnalysis): Promise<Blob | null> => {
    const hash = hashAnalysis(a)
    const cached = audioCache.get(hash)
    if (cached) return cached

    if (!hasOpenAIApiKey()) {
      setVoiceState("error")
      return null
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setVoiceState("loading")

    try {
      const apiKey = getOpenAIApiKey()!
      const script = buildNarrationScript(a)

      const res = await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini-tts",
          voice: "alloy",
          input: script,
          instructions: "Speak in a calm, analytical, documentary tone. Pace should be measured and authoritative, like a mission-control briefing.",
          response_format: "mp3",
        }),
        signal: controller.signal,
      })

      if (!res.ok) throw new Error(`TTS HTTP ${res.status}`)

      const blob = await res.blob()
      audioCache.set(hash, blob)
      return blob
    } catch (e: any) {
      if (e.name === "AbortError") return null
      setVoiceState("error")
      return null
    }
  }, [])

  const playAudio = useCallback(async (blob: Blob) => {
    cleanup()

    const url = URL.createObjectURL(blob)
    urlRef.current = url
    const audio = new Audio(url)
    audioRef.current = audio

    audio.addEventListener("ended", () => {
      setVoiceState("idle")
      setSpeaking(false)
    })

    audio.addEventListener("error", () => {
      setVoiceState("error")
      setSpeaking(false)
    })

    try {
      await audio.play()
      setVoiceState("playing")
      setSpeaking(true)
    } catch {
      setVoiceState("error")
      setSpeaking(false)
    }
  }, [cleanup, setSpeaking])

  // Auto-trigger: when typewriter finishes, generate + play after 800ms
  useEffect(() => {
    if (!analysis || !typewriterDone || !autoPlay) return

    const hash = hashAnalysis(analysis)
    if (hash === lastHashRef.current && autoTriggeredRef.current) return

    lastHashRef.current = hash
    autoTriggeredRef.current = true

    const timer = setTimeout(async () => {
      const blob = await generateAudio(analysis)
      if (blob) await playAudio(blob)
    }, 800)

    return () => clearTimeout(timer)
  }, [analysis, typewriterDone, autoPlay, generateAudio, playAudio])

  // Stop audio when analysis changes
  useEffect(() => {
    if (!analysis) {
      cleanup()
      setVoiceState("idle")
      autoTriggeredRef.current = false
      lastHashRef.current = ""
    }
  }, [analysis, cleanup])

  // Cleanup on unmount
  useEffect(() => cleanup, [cleanup])

  const play = useCallback(async () => {
    if (audioRef.current && voiceState === "paused") {
      await audioRef.current.play()
      setVoiceState("playing")
      setSpeaking(true)
      return
    }
    if (analysis) {
      const blob = await generateAudio(analysis)
      if (blob) await playAudio(blob)
    }
  }, [analysis, voiceState, generateAudio, playAudio, setSpeaking])

  const pause = useCallback(() => {
    if (audioRef.current && voiceState === "playing") {
      audioRef.current.pause()
      setVoiceState("paused")
      setSpeaking(false)
    }
  }, [voiceState, setSpeaking])

  const toggleMute = useCallback(() => {
    if (!audioRef.current) return
    audioRef.current.muted = !audioRef.current.muted
    setVoiceState(audioRef.current.muted ? "muted" : "playing")
  }, [])

  const stop = useCallback(() => {
    cleanup()
    setVoiceState("idle")
  }, [cleanup])

  return { voiceState, play, pause, toggleMute, stop }
}
