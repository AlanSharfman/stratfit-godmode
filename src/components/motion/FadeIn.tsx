import React from "react"
import { motion } from "framer-motion"

interface FadeInProps {
  children: React.ReactNode
  delay?: number
  duration?: number
  y?: number
  className?: string
  style?: React.CSSProperties
}

export default function FadeIn({
  children,
  delay = 0,
  duration = 0.4,
  y = 12,
  className,
  style,
}: FadeInProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y, filter: "blur(3px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  )
}
