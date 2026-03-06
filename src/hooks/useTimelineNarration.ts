import { useCallback, useRef, useState } from "react"
import { streamingSpeech, hasOpenAIKey, type StreamingTTSHandle } from "@/voice/openaiTTS"
import type { ScenarioTimeline } from "@/state/scenarioTimelineStore"
import { buildTimelineNarration } from "@/engine/buildScenarioTimeline"

export function useTimelineNarration() {
  const [isNarrating, setIsNarrating] = useState(false)
  const handleRef = useRef<StreamingTTSHandle | null>(null)

  const stop = useCallback(() => {
    if (handleRef.current) {
      handleRef.current.cancel()
      handleRef.current = null
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
        const handle = streamingSpeech(
          text,
          { voice: "nova", speed: 0.92 },
          (state) => {
            if (state === "idle" || state === "error") setIsNarrating(false)
          },
        )
        handleRef.current = handle
        await handle.done
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
