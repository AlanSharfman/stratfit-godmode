import { useCallback, useRef, useState } from "react"
import { synthesizeSpeech, hasOpenAIKey } from "@/voice/openaiTTS"
import type { ScenarioTimeline } from "@/state/scenarioTimelineStore"
import { buildTimelineNarration } from "@/engine/buildScenarioTimeline"

export function useTimelineNarration() {
  const [isNarrating, setIsNarrating] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current = null
    }
    if (typeof speechSynthesis !== "undefined") {
      speechSynthesis.cancel()
    }
    setIsNarrating(false)
  }, [])

  const narrate = useCallback(async (timeline: ScenarioTimeline) => {
    stop()

    const text = buildTimelineNarration(timeline)
    if (!text) return

    setIsNarrating(true)

    if (hasOpenAIKey()) {
      try {
        const result = await synthesizeSpeech(text, { voice: "nova", speed: 0.92 })
        const audio = new Audio(result.url)
        audioRef.current = audio
        audio.onended = () => {
          URL.revokeObjectURL(result.url)
          setIsNarrating(false)
        }
        audio.onerror = () => {
          URL.revokeObjectURL(result.url)
          setIsNarrating(false)
        }
        audio.play().catch(() => setIsNarrating(false))
        return
      } catch {
        // fall through to browser TTS
      }
    }

    if (typeof speechSynthesis !== "undefined") {
      const utt = new SpeechSynthesisUtterance(text)
      utt.rate = 0.92
      utt.pitch = 0.95
      utt.volume = 0.85
      utt.onend = () => setIsNarrating(false)
      speechSynthesis.speak(utt)
    } else {
      setIsNarrating(false)
    }
  }, [stop])

  return { narrate, stop, isNarrating }
}
