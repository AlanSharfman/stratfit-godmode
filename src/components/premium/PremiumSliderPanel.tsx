// src/components/premium/PremiumSliderPanel.tsx
// STRATFIT — God-Mode Beveled Slider Panel
// Sci-fi command center aesthetic with multi-layer depth

import React, { memo } from "react";
import styles from "./PremiumSliderPanel.module.css";
import PremiumSlider from "./PremiumSlider";
import SliderInfoTooltip from "@/components/ui/SliderInfoTooltip";

// ============================================================================
// TYPES
// ============================================================================

export interface SliderConfig {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  format?: (v: number) => string;
  tooltip?: {
    description: string;
    impact: string;
  };
}

export interface SectionConfig {
  id: string;
  title: string;
  sliders: SliderConfig[];
  enabled?: boolean;
}

interface PremiumSliderPanelProps {
  sections: SectionConfig[];
  activeStrategy?: string;
  onStrategyChange?: (strategyId: string) => void;
  onSliderChange: (sliderId: string, value: number) => void;
  onSliderStart?: (sliderId: string) => void;
  onSliderEnd?: () => void;
  getHighlightColor?: (sliderId: string) => string | null;
  strategies?: { id: string; label: string; icon?: React.ReactNode }[];
}

// ============================================================================
// SLIDER ROW
// ============================================================================

interface SliderRowProps {
  slider: SliderConfig;
  highlightColor: string | null;
  onStart: () => void;
  onEnd: () => void;
  onChange: (v: number) => void;
}

const SliderRow = memo(function SliderRow({
  slider,
  highlightColor,
  onStart,
  onEnd,
  onChange,
}: SliderRowProps) {
  const [tooltipRect, setTooltipRect] = React.useState<DOMRect | null>(null);

  return (
    <div className={styles.sliderRow}>
      <div className={styles.sliderHeader}>
        <span className={styles.sliderLabel}>
          {slider.label}
          {slider.tooltip && (
            <span
              className={styles.infoIcon}
              onMouseEnter={(e) => setTooltipRect(e.currentTarget.getBoundingClientRect())}
              onMouseLeave={() => setTooltipRect(null)}
            >
              <span className={styles.infoGlyph}>i</span>
            </span>
          )}
        </span>
        <span className={styles.sliderValue}>
          {slider.format ? slider.format(slider.value) : `${slider.value}%`}
        </span>
      </div>
      
      {slider.tooltip && (
        <SliderInfoTooltip anchorRect={tooltipRect}>
          <div className={styles.tooltipTitle}>{slider.label}</div>
          <div className={styles.tooltipDesc}>{slider.tooltip.description}</div>
          <div className={styles.tooltipImpact}>{slider.tooltip.impact}</div>
        </SliderInfoTooltip>
      )}
      
      <PremiumSlider
        value={slider.value}
        min={slider.min}
        max={slider.max}
        step={slider.step}
        highlightColor={highlightColor}
        onStart={onStart}
        onEnd={onEnd}
        onChange={onChange}
      />
    </div>
  );
});

// ============================================================================
// SECTION HEADER
// ============================================================================

interface SectionHeaderProps {
  title: string;
  enabled?: boolean;
  onToggle?: () => void;
}

const SectionHeader = memo(function SectionHeader({
  title,
  enabled = true,
}: SectionHeaderProps) {
  return (
    <div className={styles.sectionHeader}>
      <div className={styles.sectionLine} />
      <span className={styles.sectionTitle}>{title}</span>
      <div className={styles.sectionLine} />
      <div className={`${styles.sectionToggle} ${enabled ? styles.toggleOn : ""}`}>
        <div className={styles.toggleDot} />
      </div>
    </div>
  );
});

// ============================================================================
// ACTIVE STRATEGY SELECTOR
// ============================================================================

interface StrategySelectorProps {
  activeStrategy: string;
  strategies: { id: string; label: string; icon?: React.ReactNode }[];
  onChange: (id: string) => void;
}

const StrategySelector = memo(function StrategySelector({
  activeStrategy,
  strategies,
  onChange,
}: StrategySelectorProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const current = strategies.find(s => s.id === activeStrategy) || strategies[0];

  return (
    <div className={styles.strategySelector}>
      <div className={styles.strategyLabel}>ACTIVE STRATEGY</div>
      <button 
        className={styles.strategyButton}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className={styles.strategyIcon}>
          {current.icon || (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 3v18h18" />
              <path d="M7 16l4-8 4 4 5-9" />
            </svg>
          )}
        </div>
        <span className={styles.strategyName}>{current.label}</span>
        <div className={`${styles.strategyChevron} ${isOpen ? styles.chevronOpen : ""}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </button>

      {isOpen && (
        <div className={styles.strategyDropdown}>
          {strategies.map((s) => (
            <button
              key={s.id}
              className={`${styles.strategyOption} ${s.id === activeStrategy ? styles.strategyActive : ""}`}
              onClick={() => {
                onChange(s.id);
                setIsOpen(false);
              }}
            >
              <div className={styles.strategyOptionIcon}>
                {s.icon || (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 3v18h18" />
                    <path d="M7 16l4-8 4 4 5-9" />
                  </svg>
                )}
              </div>
              <span>{s.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function PremiumSliderPanel({
  sections,
  activeStrategy = "baseline",
  onStrategyChange,
  onSliderChange,
  onSliderStart,
  onSliderEnd,
  getHighlightColor,
  strategies = [
    { id: "baseline", label: "Baseline Trajectory" },
    { id: "growth", label: "Aggressive Growth" },
    { id: "conservative", label: "Conservative" },
  ],
}: PremiumSliderPanelProps) {
  return (
    <div className={styles.panel}>
      {/* Outer chassis frame */}
      <div className={styles.chassis}>
        {/* Strategy selector at top */}
        {onStrategyChange && (
          <StrategySelector
            activeStrategy={activeStrategy}
            strategies={strategies}
            onChange={onStrategyChange}
          />
        )}

        {/* Scrollable sections container */}
        <div className={styles.sectionsScroll}>
          {sections.map((section) => (
            <div key={section.id} className={styles.section}>
              {/* Section bezel frame */}
              <div className={styles.sectionBezel}>
                <div className={styles.sectionFrame}>
                  <SectionHeader 
                    title={section.title} 
                    enabled={section.enabled !== false} 
                  />
                  
                  {/* Sliders well */}
                  <div className={styles.slidersWell}>
                    {section.sliders.map((slider) => (
                      <SliderRow
                        key={slider.id}
                        slider={slider}
                        highlightColor={getHighlightColor?.(slider.id) || null}
                        onStart={() => onSliderStart?.(slider.id)}
                        onEnd={() => onSliderEnd?.()}
                        onChange={(v) => onSliderChange(slider.id, v)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default PremiumSliderPanel;
