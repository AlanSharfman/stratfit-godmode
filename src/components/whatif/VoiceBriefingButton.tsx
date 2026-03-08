import React from "react"
import styles from "./VoiceBriefingButton.module.css"

interface VoiceBriefingButtonProps {
  isPlaying: boolean
  onPlay?: () => void
  onStop?: () => void
  label?: string
}

export default function VoiceBriefingButton({
  isPlaying,
  onPlay,
  onStop,
  label,
}: VoiceBriefingButtonProps) {
  return (
    <button
      className={isPlaying ? styles.rootActive : styles.root}
      onClick={isPlaying ? onStop : onPlay}
    >
      <span className={styles.icon}>{isPlaying ? "■" : "▶"}</span>
      <span className={styles.label}>
        {label ?? (isPlaying ? "Stop Playback" : "Voice Briefing")}
      </span>
      {isPlaying && <span className={styles.pulse} />}
    </button>
  )
}
