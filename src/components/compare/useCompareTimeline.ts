import { useState, useCallback } from 'react'

export function useCompareTimeline() {
  const [timeline, setTimeline] = useState(0)

  const advance = useCallback((delta: number) => {
    setTimeline(t => t + delta)
  }, [])

  const reset = useCallback(() => {
    setTimeline(0)
  }, [])

  return { timeline, advance, reset }
}

