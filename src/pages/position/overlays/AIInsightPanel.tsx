import React, { useEffect, useState } from "react"
import styles from "./AIInsightPanel.module.css"

interface AIInsightPanelProps {
  fullText: string
  className?: string
}

export default function AIInsightPanel({ fullText, className }: AIInsightPanelProps) {
  const [visibleText, setVisibleText] = useState("")
  const [startTyping, setStartTyping] = useState(false)

  useEffect(() => {
    const delay = setTimeout(() => setStartTyping(true), 2000)
    return () => clearTimeout(delay)
  }, [])

  useEffect(() => {
    if (!startTyping || !fullText) return

    let i = 0
    const interval = setInterval(() => {
      setVisibleText(fullText.slice(0, i))
      i++
      if (i > fullText.length) clearInterval(interval)
    }, 18)

    return () => clearInterval(interval)
  }, [startTyping, fullText])

  const done = visibleText.length >= fullText.length

  return (
    <div className={[styles.root, className].filter(Boolean).join(" ")}>
      <div className={styles.title}>AI Intelligence</div>
      <div className={styles.body}>
        <span className={[styles.text, done ? styles.done : ""].filter(Boolean).join(" ")}>
          {visibleText}
        </span>
      </div>
    </div>
  )
}
