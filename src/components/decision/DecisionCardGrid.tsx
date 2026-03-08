// src/components/decision/DecisionCardGrid.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Decision Card Grid (15 + Other)
//
// Premium card-based decision type selector. Replaces dropdown as primary
// selection UI. Maps each card to a DecisionIntentType for lever wiring.
// ═══════════════════════════════════════════════════════════════════════════

import React, { memo, useCallback } from "react"
import { DECISION_TYPES, type DecisionType } from "@/constants/decisionTypes"
import type { DecisionIntentType } from "@/state/phase1ScenarioStore"
import styles from "./DecisionCardGrid.module.css"

interface DecisionCardGridProps {
  /** Currently selected decision type id (null = none) */
  value: string | null
  /** Called with the selected DecisionType's id and its mapped intentType */
  onChange: (id: string, intentType: DecisionIntentType, label: string) => void
  /** Disable interaction during creation */
  disabled?: boolean
}

const DecisionCardGrid: React.FC<DecisionCardGridProps> = memo(({
  value,
  onChange,
  disabled = false,
}) => {
  const handleSelect = useCallback((dt: DecisionType) => {
    if (disabled) return
    onChange(dt.id, dt.intentType, dt.label)
  }, [onChange, disabled])

  const handleKeyDown = useCallback((e: React.KeyboardEvent, dt: DecisionType) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      handleSelect(dt)
    }
  }, [handleSelect])

  return (
    <div className={styles.grid} role="radiogroup" aria-label="Decision type">
      {DECISION_TYPES.map((dt) => {
        const isSelected = value === dt.id
        const isOther = dt.id === "other"
        return (
          <button
            key={dt.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            className={[
              styles.card,
              isSelected ? styles.cardSelected : "",
              isOther ? styles.cardOther : "",
            ].filter(Boolean).join(" ")}
            onClick={() => handleSelect(dt)}
            onKeyDown={(e) => handleKeyDown(e, dt)}
            disabled={disabled}
            tabIndex={0}
          >
            {/* Icon badge */}
            <div
              className={styles.cardIcon}
              style={{
                color: isSelected ? dt.accent : undefined,
                borderColor: isSelected ? `${dt.accent}40` : undefined,
                boxShadow: isSelected ? `0 0 14px ${dt.accent}25, inset 0 0 12px ${dt.accent}10` : undefined,
              }}
            >
              {dt.icon}
            </div>
            <div className={styles.cardContent}>
              <div className={styles.cardLabel}>{dt.label}</div>
              <div className={styles.cardDesc}>{dt.description}</div>
            </div>
            {/* Selection indicator */}
            <div className={styles.cardIndicator}>
              {isSelected ? (
                <div className={styles.cardCheckmark}>✓</div>
              ) : (
                <div className={styles.cardDot} />
              )}
            </div>
            {/* Top accent bar on selected */}
            {isSelected && <div className={styles.cardAccentBar} style={{ background: `linear-gradient(90deg, ${dt.accent}60 0%, ${dt.accent}00 100%)` }} />}
          </button>
        )
      })}
    </div>
  )
})

DecisionCardGrid.displayName = "DecisionCardGrid"
export default DecisionCardGrid
