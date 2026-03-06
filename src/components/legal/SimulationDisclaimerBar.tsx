import React from "react"

interface Props {
  variant?: "default" | "compact" | "ai"
}

const COPY = {
  default:
    "STRATFIT simulations are probabilistic models based on user inputs, assumptions, and scenario conditions. They are provided for decision support only and do not constitute financial, legal, tax, investment, or strategic advice. Outputs are directional estimates and are not guarantees of future performance.",
  compact:
    "Probabilistic decision support only. Not advice. Not a guarantee of future outcomes.",
  ai:
    "AI commentary explains simulation outputs for informational purposes only and may be incomplete or inaccurate. Users should independently validate all outputs before making decisions.",
} as const

export default function SimulationDisclaimerBar({ variant = "default" }: Props) {
  return (
    <div
      style={{
        padding: variant === "compact" ? "8px 14px" : "10px 14px",
        borderRadius: 10,
        border: "1px solid rgba(54, 226, 255, 0.12)",
        background: "rgba(8, 20, 38, 0.50)",
        color: "rgba(220,240,255,0.50)",
        fontSize: variant === "compact" ? 10 : 11,
        lineHeight: 1.6,
        fontFamily: "'Inter', system-ui, sans-serif",
        letterSpacing: "0.01em",
      }}
    >
      {COPY[variant]}
    </div>
  )
}
