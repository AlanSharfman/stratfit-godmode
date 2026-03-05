import { useCallback, useEffect, useRef, useState } from "react"
import type { KpiKey } from "@/domain/intelligence/kpiZoneMapping"
import type { PositionKpis } from "@/pages/position/overlays/positionState"
import { getKpiCommentary } from "@/domain/intelligence/kpiCommentary"
import { synthesizeSpeech, hasOpenAIKey } from "@/voice/openaiTTS"

interface AudioState {
  isPlaying: boolean
  currentKpi: KpiKey | null
  error: string | null
  loading: boolean
}

/**
 * Per-KPI audio commentary using OpenAI TTS (nova voice).
 * Generates 10-15s audio for each KPI zone commentary.
 * Falls back to browser SpeechSynthesis if no API key is set.
 */
export function useKpiAudio(kpis: PositionKpis | null) {
  const [state, setState] = useState<AudioState>({
    isPlaying: false,
    currentKpi: null,
    error: null,
    loading: false,
  })
  const currentAudioRef = useRef<HTMLAudioElement | null>(null)
  const cacheRef = useRef(new Map<KpiKey, { audio: HTMLAudioElement; url: string }>())

  const stop = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current.currentTime = 0
      currentAudioRef.current = null
    }
    if (typeof speechSynthesis !== "undefined") {
      speechSynthesis.cancel()
    }
    setState((s) => ({ ...s, isPlaying: false, currentKpi: null, loading: false }))
  }, [])

  const speak = useCallback(async (kpi: KpiKey) => {
    if (!kpis) return
    stop()

    const commentary = getKpiCommentary(kpi, kpis)
    if (!commentary) return

    setState((s) => ({ ...s, isPlaying: true, currentKpi: kpi, error: null, loading: true }))

    const cached = cacheRef.current.get(kpi)
    if (cached) {
      cached.audio.currentTime = 0
      cached.audio.play().catch(() => {})
      currentAudioRef.current = cached.audio
      cached.audio.onended = () => setState((s) => ({ ...s, isPlaying: false, currentKpi: null }))
      setState((s) => ({ ...s, loading: false }))
      return
    }

    if (hasOpenAIKey()) {
      try {
        const result = await synthesizeSpeech(commentary, { voice: "nova", speed: 0.95 })
        const audio = new Audio(result.url)
        cacheRef.current.set(kpi, { audio, url: result.url })
        audio.onended = () => setState((s) => ({ ...s, isPlaying: false, currentKpi: null }))
        setState((s) => ({ ...s, loading: false }))
        audio.play().catch(() => {})
        currentAudioRef.current = audio
        return
      } catch (err) {
        console.warn("[useKpiAudio] OpenAI TTS failed, falling back to browser:", err)
      }
    }

    setState((s) => ({ ...s, loading: false }))

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

  useEffect(() => {
    return () => {
      stop()
      for (const { audio, url } of cacheRef.current.values()) {
        audio.pause()
        URL.revokeObjectURL(url)
      }
      cacheRef.current.clear()
    }
  }, [stop])

  return {
    speak,
    stop,
    isPlaying: state.isPlaying,
    isLoading: state.loading,
    currentKpi: state.currentKpi,
    error: state.error,
    hasVoice: hasOpenAIKey() || typeof speechSynthesis !== "undefined",
  }
}
