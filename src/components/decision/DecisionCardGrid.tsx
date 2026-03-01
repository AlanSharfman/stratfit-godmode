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
            <div className={styles.cardDot}>
              {isSelected && <div className={styles.cardDotInner} />}
            </div>
            <div className={styles.cardContent}>
              <div className={styles.cardLabel}>{dt.label}</div>
              <div className={styles.cardDesc}>{dt.description}</div>
            </div>
            {isSelected && (
              <div className={styles.cardCheck} aria-hidden="true">✓</div>
            )}
          </button>
        )
      })}
    </div>
  )
})

DecisionCardGrid.displayName = "DecisionCardGrid"
export default DecisionCardGrid
