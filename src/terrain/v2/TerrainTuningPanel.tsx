import React, { useState, useCallback } from "react"
import type { TerrainTuningParams } from "./TerrainSurfaceV2"
import { DEFAULT_TUNING } from "./TerrainSurfaceV2"

// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Terrain Visual Tuning Panel
//
// Lightweight glass-UI overlay with live sliders for terrain parameters.
// React local state only — no global store, no layout shift.
// Toggleable via a small gear icon button (top-right).
// ═══════════════════════════════════════════════════════════════════════════

type Props = {
  params: TerrainTuningParams
  onChange: (params: TerrainTuningParams) => void
  /** When true, renders inline (no toggle button, no absolute positioning) */
  inline?: boolean
}

// ─── Slider Definitions ────────────────────────────────────────────────────

const SLIDERS: Array<{
  key: keyof TerrainTuningParams
  label: string
  min: number
  max: number
  step: number
}> = [
  { key: "elevationScale",      label: "Elevation Scale",  min: 0, max: 2, step: 0.01 },
  { key: "ridgeIntensity",      label: "Ridge Intensity",  min: 0, max: 1, step: 0.01 },
  { key: "valleyDepth",         label: "Valley Depth",     min: 0, max: 1, step: 0.01 },
  { key: "terrainRoughness",    label: "Roughness",        min: 0, max: 1, step: 0.01 },
  { key: "peakSoftness",        label: "Peak Softness",    min: 0, max: 1, step: 0.01 },
  { key: "noiseFrequency",      label: "Noise Frequency",  min: 0, max: 3, step: 0.01 },
  { key: "microDetailStrength", label: "Micro Detail",     min: 0, max: 1, step: 0.01 },
]

// ─── Embedded CSS for slider thumb (cross-browser) ─────────────────────────

const SLIDER_CSS = `
.sf-tuning-slider {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 4px;
  background: rgba(34, 211, 238, 0.14);
  border-radius: 2px;
  outline: none;
  cursor: pointer;
  margin: 0;
  transition: background 0.2s;
}
.sf-tuning-slider:focus {
  background: rgba(34, 211, 238, 0.22);
}
.sf-tuning-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: rgba(34, 211, 238, 0.90);
  border: 1px solid rgba(103, 232, 249, 0.5);
  cursor: pointer;
  box-shadow: 0 0 8px rgba(34, 211, 238, 0.4);
  transition: background 0.15s, box-shadow 0.15s;
}
.sf-tuning-slider::-webkit-slider-thumb:hover {
  background: rgba(103, 232, 249, 0.95);
  box-shadow: 0 0 12px rgba(34, 211, 238, 0.55);
}
.sf-tuning-slider::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: rgba(34, 211, 238, 0.90);
  border: 1px solid rgba(103, 232, 249, 0.5);
  cursor: pointer;
  box-shadow: 0 0 8px rgba(34, 211, 238, 0.4);
}
.sf-tuning-slider::-moz-range-track {
  height: 4px;
  background: rgba(34, 211, 238, 0.14);
  border-radius: 2px;
  border: none;
}
`

// ─── Component ─────────────────────────────────────────────────────────────

export default function TerrainTuningPanel({ params, onChange, inline }: Props) {
  const [open, setOpen] = useState(false)

  const update = useCallback(
    (key: keyof TerrainTuningParams, value: number) => {
      onChange({ ...params, [key]: value })
    },
    [params, onChange],
  )

  const reset = useCallback(() => {
    onChange({ ...DEFAULT_TUNING })
  }, [onChange])

  // ── Shared slider list ───────────────────────────────────────────────────
  const sliderList = (
    <>
      {SLIDERS.map(({ key, label, min, max, step }) => (
        <div key={key} style={{ marginBottom: 11 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginBottom: 4,
            }}
          >
            <span
              style={{
                fontSize: 10,
                color: "rgba(195, 225, 255, 0.78)",
                fontWeight: 500,
                letterSpacing: "0.02em",
              }}
            >
              {label}
            </span>
            <span
              style={{
                fontSize: 10,
                color: "rgba(34, 211, 238, 0.55)",
                fontFamily:
                  "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
                fontWeight: 400,
                minWidth: 36,
                textAlign: "right",
              }}
            >
              {params[key].toFixed(2)}
            </span>
          </div>
          <input
            className="sf-tuning-slider"
            type="range"
            min={min}
            max={max}
            step={step}
            value={params[key]}
            onChange={(e) => update(key, parseFloat(e.target.value))}
          />
        </div>
      ))}

      {/* Reset button */}
      <button
        onClick={reset}
        style={{
          marginTop: 6,
          width: "100%",
          padding: "7px 0",
          fontSize: 10,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          color: "rgba(120, 180, 255, 0.55)",
          background: "rgba(100, 180, 255, 0.05)",
          border: "1px solid rgba(100, 180, 255, 0.08)",
          borderRadius: 6,
          cursor: "pointer",
          outline: "none",
          transition: "background 0.2s, color 0.2s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(100, 180, 255, 0.10)"
          e.currentTarget.style.color = "rgba(140, 200, 255, 0.75)"
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(100, 180, 255, 0.05)"
          e.currentTarget.style.color = "rgba(120, 180, 255, 0.55)"
        }}
      >
        Reset Defaults
      </button>
    </>
  )

  // ── Inline mode (renders directly in parent flow) ──────────────────────
  if (inline) {
    return (
      <div
        style={{
          width: "100%",
          padding: "14px 12px 12px",
          borderRadius: 12,
          background: "rgba(8, 14, 28, 0.84)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(100, 180, 255, 0.10)",
          boxShadow:
            "0 8px 32px rgba(0,0,0,0.55), inset 0 1px 0 rgba(140,200,255,0.04)",
          fontFamily:
            "'Inter', 'SF Pro Display', 'Segoe UI', system-ui, sans-serif",
          userSelect: "none",
          boxSizing: "border-box",
        }}
      >
        <style>{SLIDER_CSS}</style>
        {/* Header */}
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "rgba(34, 211, 238, 0.60)",
            marginBottom: 4,
          }}
        >
          Visual Terrain Controls
        </div>
        <div
          style={{
            fontSize: 9,
            fontWeight: 400,
            fontStyle: "italic",
            letterSpacing: "0.01em",
            color: "rgba(148, 163, 184, 0.50)",
            marginBottom: 14,
          }}
        >
          Render-only — does not affect simulation outcomes
        </div>
        {sliderList}
      </div>
    )
  }

  // ── Overlay mode (absolute-positioned toggle + dropdown) ───────────────
  return (
    <>
      {/* Inject slider thumb CSS once */}
      <style>{SLIDER_CSS}</style>

      {/* ── Toggle Button ── */}
      <button
        onClick={() => setOpen((v) => !v)}
        title="Terrain Tuning"
        style={{
          position: "absolute",
          top: 16,
          left: 16,
          zIndex: 100,
          width: 36,
          height: 36,
          borderRadius: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: open
            ? "rgba(14, 30, 52, 0.92)"
            : "rgba(14, 22, 36, 0.72)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1px solid rgba(100, 180, 255, 0.15)",
          color: "#6BB8FF",
          cursor: "pointer",
          fontSize: 16,
          lineHeight: 1,
          outline: "none",
          transition: "background 0.2s, border-color 0.2s",
          padding: 0,
        }}
      >
        {/* Gear icon (SVG to avoid emoji rendering) */}
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>

      {/* ── Panel ── */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: 60,
            left: 16,
            zIndex: 99,
            width: 252,
            padding: "16px 14px 14px",
            borderRadius: 12,
            background: "rgba(8, 14, 28, 0.84)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(100, 180, 255, 0.10)",
            boxShadow:
              "0 8px 32px rgba(0,0,0,0.55), inset 0 1px 0 rgba(140,200,255,0.04)",
            fontFamily:
              "'Inter', 'SF Pro Display', 'Segoe UI', system-ui, sans-serif",
            userSelect: "none",
          }}
        >
          {/* Header */}
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "rgba(34, 211, 238, 0.60)",
              marginBottom: 4,
            }}
          >
            Visual Terrain Controls
          </div>
          <div
            style={{
              fontSize: 9,
              fontWeight: 400,
              fontStyle: "italic",
              letterSpacing: "0.01em",
              color: "rgba(148, 163, 184, 0.50)",
              marginBottom: 14,
            }}
          >
            Render-only — does not affect simulation outcomes
          </div>
          {sliderList}
        </div>
      )}
    </>
  )
}
