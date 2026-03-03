// src/pages/compare/ComparePage.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Compare Stub (Phase D0)
// Institutional placeholder. No legacy systems mounted.
// ═══════════════════════════════════════════════════════════════════════════

import React from "react"
import { Link } from "react-router-dom"
import { ROUTES } from "@/routes/routeContract"

export default function ComparePage() {
  return (
    <div style={shell}>
      <div style={card}>
        <div style={eyebrow}>COMPARE</div>
        <h1 style={title}>Scenario Compare</h1>
        <p style={purpose}>
          Side-by-side institutional comparison of scenario outcomes, deltas, and probability distributions.
        </p>
        <div style={badge}>Wiring in progress</div>
        <Link to={ROUTES.POSITION} style={link}>
          Return to Position
        </Link>
      </div>
    </div>
  )
}

const shell: React.CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(180deg, #020814 0%, #0a0e17 50%, #0f1520 100%)",
  fontFamily: "'Inter', system-ui, sans-serif",
}

const card: React.CSSProperties = {
  textAlign: "center",
  maxWidth: 420,
  padding: "48px 32px",
}

const eyebrow: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: "0.2em",
  color: "rgba(34, 211, 238, 0.6)",
  marginBottom: 8,
}

const title: React.CSSProperties = {
  fontSize: 28,
  fontWeight: 700,
  color: "#e2e8f0",
  margin: "0 0 12px",
  letterSpacing: "-0.02em",
}

const purpose: React.CSSProperties = {
  fontSize: 14,
  color: "rgba(148, 180, 214, 0.65)",
  lineHeight: 1.6,
  margin: "0 0 24px",
}

const badge: React.CSSProperties = {
  display: "inline-block",
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: "rgba(250, 204, 21, 0.7)",
  border: "1px solid rgba(250, 204, 21, 0.2)",
  borderRadius: 4,
  padding: "4px 12px",
  marginBottom: 28,
}

const link: React.CSSProperties = {
  display: "inline-block",
  fontSize: 13,
  fontWeight: 600,
  color: "rgba(34, 211, 238, 0.85)",
  textDecoration: "none",
  padding: "10px 20px",
  borderRadius: 8,
  border: "1px solid rgba(34, 211, 238, 0.2)",
  background: "rgba(34, 211, 238, 0.06)",
}
