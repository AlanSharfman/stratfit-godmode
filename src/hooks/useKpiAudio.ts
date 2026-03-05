import { useCallback, useEffect, useRef, useState } from "react"
import type { KpiKey } from "@/domain/intelligence/kpiZoneMapping"
import type { PositionKpis } from "@/pages/position/overlays/positionState"
import { getKpiCommentary } from "@/domain/intelligence/kpiCommentary"

const OPENAI_TTS_URL = "/api/tts"

interface AudioState {
  isPlaying: boolean
  currentKpi: KpiKey | null
  audioCache: Map<KpiKey, HTMLAudioElement>
  error: string | null
}

/**
 * Per-KPI audio commentary using OpenAI TTS.
 * Generates 10-15s audio for each KPI as zones are revealed.
 * Falls back to browser SpeechSynthesis if API is unavailable.
 */
export function useKpiAudio(kpis: PositionKpis | null) {
  const [state, setState] = useState<AudioState>({
    isPlaying: false,
    currentKpi: null,
    audioCache: new Map(),
    error: null,
  })
  const currentAudioRef = useRef<HTMLAudioElement | null>(null)
  const cacheRef = useRef(new Map<KpiKey, HTMLAudioElement>())

  const stop = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current.currentTime = 0
      currentAudioRef.current = null
    }
    if (typeof speechSynthesis !== "undefined") {
      speechSynthesis.cancel()
    }
    setState((s) => ({ ...s, isPlaying: false, currentKpi: null }))
  }, [])

  const speak = useCallback(async (kpi: KpiKey) => {
    if (!kpis) return
    stop()

    const commentary = getKpiCommentary(kpi, kpis)
    if (!commentary) return

    setState((s) => ({ ...s, isPlaying: true, currentKpi: kpi, error: null }))

    // Check cache
    const cached = cacheRef.current.get(kpi)
    if (cached) {
      cached.currentTime = 0
      cached.play().catch(() => {})
      currentAudioRef.current = cached
      cached.onended = () => setState((s) => ({ ...s, isPlaying: false, currentKpi: null }))
      return
    }

    // Try OpenAI TTS via backend proxy
    try {
      const response = await fetch(OPENAI_TTS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: commentary,
          voice: "nova",
          model: "tts-1",
          speed: 1.0,
        }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const audio = new Audio(url)
        cacheRef.current.set(kpi, audio)
        audio.onended = () => {
          setState((s) => ({ ...s, isPlaying: false, currentKpi: null }))
        }
        audio.play().catch(() => {})
        currentAudioRef.current = audio
        return
      }
    } catch {
      // API unavailable, fall through to browser TTS
    }

    // Fallback: browser SpeechSynthesis
    if (typeof speechSynthesis !== "undefined") {
      const utterance = new SpeechSynthesisUtterance(commentary)
      utterance.rate = 0.95
      utterance.pitch = 1.0
      utterance.onend = () => setState((s) => ({ ...s, isPlaying: false, currentKpi: null }))
      utterance.onerror = () => setState((s) => ({ ...s, isPlaying: false, currentKpi: null, error: "Speech synthesis error" }))
      speechSynthesis.speak(utterance)
    } else {
      setState((s) => ({ ...s, isPlaying: false, currentKpi: null, error: "No audio available" }))
    }
  }, [kpis, stop])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop()
      for (const audio of cacheRef.current.values()) {
        audio.pause()
        if (audio.src.startsWith("blob:")) URL.revokeObjectURL(audio.src)
      }
      cacheRef.current.clear()
    }
  }, [stop])

  return {
    speak,
    stop,
    isPlaying: state.isPlaying,
    currentKpi: state.currentKpi,
    error: state.error,
  }
}
