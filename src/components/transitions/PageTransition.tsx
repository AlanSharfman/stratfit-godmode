import React from "react"
import { motion } from "framer-motion"

const EASE: [number, number, number, number] = [0.25, 0.1, 0.25, 1]

const variants = {
  initial: {
    opacity: 0,
    y: 12,
    filter: "blur(4px)",
  },
  enter: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.4,
      ease: EASE,
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    filter: "blur(2px)",
    transition: {
      duration: 0.25,
      ease: EASE,
    },
  },
}

interface Props {
  children: React.ReactNode
}

export default function PageTransition({ children }: Props) {
  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="enter"
      exit="exit"
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
      }}
    >
      {children}
    </motion.div>
  )
}
