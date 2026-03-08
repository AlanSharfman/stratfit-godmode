import React, { useEffect, useRef, useState } from "react"

interface AnimatedValueProps {
  value: number
  duration?: number
  format?: (v: number) => string
  style?: React.CSSProperties
  className?: string
}

export default React.memo(function AnimatedValue({
  value,
  duration = 600,
  format = (v) => v.toLocaleString(),
  style,
  className,
}: AnimatedValueProps) {
  const [display, setDisplay] = useState(value)
  const prevRef = useRef(value)
  const frameRef = useRef<number>(0)

  useEffect(() => {
    const from = prevRef.current
    const to = value
    prevRef.current = to

    if (from === to) {
      setDisplay(to)
      return
    }

    const start = performance.now()
    function step(now: number) {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(from + (to - from) * eased)
      if (t < 1) frameRef.current = requestAnimationFrame(step)
    }
    frameRef.current = requestAnimationFrame(step)

    return () => cancelAnimationFrame(frameRef.current)
  }, [value, duration])

  return (
    <span className={className} style={style}>
      {format(display)}
    </span>
  )
})
