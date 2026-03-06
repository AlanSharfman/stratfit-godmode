import React, { memo, useMemo, useState } from "react"

import Slider from "@/components/ui/Slider"
import SliderInfoTooltip from "@/components/ui/SliderInfoTooltip"
import styles from "./CommandCenterSliderDeck.module.css"

export interface CommandCenterSliderTooltip {
  description: string
  impact?: string
}

export interface CommandCenterSliderConfig {
  id: string
  label: string
  value: number
  min: number
  max: number
  step?: number
  format?: (value: number) => string
  tooltip?: CommandCenterSliderTooltip
  accentColor?: string
}

export interface CommandCenterSliderSection {
  id: string
  title: string
  sliders: CommandCenterSliderConfig[]
}

export interface CommandCenterSliderRowProps {
  slider: CommandCenterSliderConfig
  onChange: (value: number) => void
  onStart?: () => void
  onEnd?: () => void
}

function splitDisplayValue(displayValue: string) {
  const match = displayValue.match(/^([+-]?(?:\$)?\d[\d,]*(?:\.\d+)?(?:[KMB])?)(.*)$/)
  if (!match) return { main: displayValue, suffix: "" }
  return {
    main: match[1],
    suffix: match[2].trim(),
  }
}

export const CommandCenterSliderRow = memo(function CommandCenterSliderRow({
  slider,
  onChange,
  onStart,
  onEnd,
}: CommandCenterSliderRowProps) {
  const [tooltipRect, setTooltipRect] = useState<DOMRect | null>(null)
  const accentColor = slider.accentColor ?? "#22d3ee"
  const displayValue = slider.format ? slider.format(slider.value) : `${Math.round(slider.value)}%`
  const valueParts = useMemo(() => splitDisplayValue(displayValue), [displayValue])

  return (
    <div
      className={`${styles.row}${tooltipRect ? ` ${styles.rowFocused}` : ""}`}
      style={{
        ["--command-slider-accent" as const]: accentColor,
        ["--command-slider-accent-soft" as const]: `${accentColor}2a`,
      } as React.CSSProperties}
    >
      <div className={styles.rowTop}>
        <div className={styles.labelCluster}>
          <span className={styles.labelText}>{slider.label}</span>
          {slider.tooltip ? (
            <span
              className={styles.infoIcon}
              onMouseEnter={(event) => setTooltipRect(event.currentTarget.getBoundingClientRect())}
              onMouseLeave={() => setTooltipRect(null)}
            >
              i
            </span>
          ) : null}
        </div>

        <div className={styles.valueWrap}>
          <div className={styles.valueText}>
            <span className={styles.valueMain}>{valueParts.main}</span>
            {valueParts.suffix ? <span className={styles.valueSub}>{valueParts.suffix}</span> : null}
          </div>
          <span className={styles.valueUnderline} />
        </div>
      </div>

      {slider.tooltip ? (
        <SliderInfoTooltip anchorRect={tooltipRect}>
          <div className={styles.tooltipTitle}>{slider.label}</div>
          <div className={styles.tooltipDesc}>{slider.tooltip.description}</div>
          {slider.tooltip.impact ? <div className={styles.tooltipImpact}>{slider.tooltip.impact}</div> : null}
        </SliderInfoTooltip>
      ) : null}

      <div className={styles.trackWrap}>
        <Slider
          value={slider.value}
          min={slider.min}
          max={slider.max}
          step={slider.step}
          onChange={onChange}
          onStart={onStart}
          onEnd={onEnd}
          highlightColor={accentColor}
        />
      </div>

      <div className={styles.scale}>
        <span>Low</span>
        <span>Neutral</span>
        <span>High</span>
      </div>
    </div>
  )
})

interface CommandCenterSliderDeckProps {
  sections: CommandCenterSliderSection[]
  onSliderChange: (sliderId: string, value: number) => void
  onSliderStart?: (sliderId: string) => void
  onSliderEnd?: (sliderId: string) => void
}

const CommandCenterSliderDeck = memo(function CommandCenterSliderDeck({
  sections,
  onSliderChange,
  onSliderStart,
  onSliderEnd,
}: CommandCenterSliderDeckProps) {
  return (
    <div className={styles.deck}>
      <div className={styles.scroll}>
        {sections.map((section) => (
          <section key={section.id} className={styles.section}>
            <header className={styles.sectionHeader}>
              <span className={styles.sectionTitle}>{section.title}</span>
              <span className={styles.sectionDot} />
            </header>

            <div className={styles.sectionBody}>
              {section.sliders.map((slider) => (
                <CommandCenterSliderRow
                  key={slider.id}
                  slider={slider}
                  onChange={(value) => onSliderChange(slider.id, value)}
                  onStart={onSliderStart ? () => onSliderStart(slider.id) : undefined}
                  onEnd={onSliderEnd ? () => onSliderEnd(slider.id) : undefined}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
})

export default CommandCenterSliderDeck