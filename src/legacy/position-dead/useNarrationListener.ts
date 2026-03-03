import { useEffect } from "react"

export default function useNarrationListener() {
  useEffect(() => {
    if (import.meta.env.PROD) return

    const handler = (e: Event) => {
      const cue = (e as CustomEvent)?.detail?.cue
      if (!cue) return

      // Clear visual grouping for readability
      console.groupCollapsed(
        "%cSTRATFIT Narration",
        "color:#8fd3ff;font-weight:600"
      )

      console.groupEnd()
    }

    window.addEventListener("sf.demo.narrate.request", handler)
    return () => window.removeEventListener("sf.demo.narrate.request", handler)
  }, [])
}
