import { useCallback, useEffect, useRef, useState } from "react"
import type { KpiKey } from "@/domain/intelligence/kpiZoneMapping"
import type { PositionKpis } from "@/pages/position/overlays/positionState"
import { getKpiCommentary } from "@/domain/intelligence/kpiCommentary"
import { streamingSpeech, hasOpenAIKey, type StreamingTTSHandle } from "@/voice/openaiTTS"

interface AudioState {
  isPlaying: boolean
  currentKpi: KpiKey | null
  error: string | null
  loading: boolean
}

/**
 * Per-KPI audio commentary using OpenAI streaming TTS (nova voice).
 * Chunks commentary into ~150-word segments and plays the first chunk
 * immediately while preloading the rest, cutting perceived latency
 * from ~4-8s to ~1-2s.
 * Falls back to browser SpeechSynthesis if no API key is set.
 */
export function useKpiAudio(kpis: PositionKpis | null) {
  const [state, setState] = useState<AudioState>({
    isPlaying: false,
    currentKpi: null,
    error: null,
    loading: false,
  })
  const handleRef = useRef<StreamingTTSHandle | null>(null)

  const stop = useCallback(() => {
    if (handleRef.current) {
      handleRef.current.cancel()
      handleRef.current = null
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

    if (hasOpenAIKey()) {
      try {
        const handle = streamingSpeech(
          commentary,
          { voice: "nova", speed: 0.95 },
          (streamState) => {
            if (streamState === "playing") {
              setState((s) => ({ ...s, loading: false }))
            } else if (streamState === "idle") {
              setState((s) => ({ ...s, isPlaying: false, currentKpi: null, loading: false }))
            } else if (streamState === "error") {
              setState((s) => ({ ...s, isPlaying: false, currentKpi: null, loading: false, error: "TTS error" }))
            }
          },
        )
        handleRef.current = handle
        await handle.done
        return
      } catch (err) {
        console.warn("[useKpiAudio] Streaming TTS failed, falling back to browser:", err)
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
