import React from "react"
import { motion } from "framer-motion"

interface StaggerRevealProps {
  children: React.ReactNode
  delay?: number
  staggerDelay?: number
  direction?: "up" | "down" | "left" | "right"
  className?: string
  style?: React.CSSProperties
}

const DIRECTIONS = {
  up: { y: 20, x: 0 },
  down: { y: -20, x: 0 },
  left: { x: 24, y: 0 },
  right: { x: -24, y: 0 },
}

export default function StaggerReveal({
  children,
  delay = 0,
  staggerDelay = 0.08,
  direction = "up",
  className,
  style,
}: StaggerRevealProps) {
  const offset = DIRECTIONS[direction]
  const items = React.Children.toArray(children)

  return (
    <div className={className} style={style}>
      {items.map((child, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, ...offset, filter: "blur(4px)" }}
          animate={{ opacity: 1, x: 0, y: 0, filter: "blur(0px)" }}
          transition={{
            duration: 0.45,
            delay: delay + i * staggerDelay,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          {child}
        </motion.div>
      ))}
    </div>
  )
}
