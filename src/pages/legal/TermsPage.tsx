import React from "react"
import { Link } from "react-router-dom"

const SECTIONS = [
  {
    title: "Overview",
    body: "STRATFIT is a probabilistic decision support platform that uses scenario modelling, Monte Carlo simulation, and AI-powered commentary to help users explore strategic business decisions. By using STRATFIT, you agree to these terms.",
  },
  {
    title: "Decision Support Only",
    body: "STRATFIT provides probabilistic decision support based on scenario modelling and user inputs. It is designed to help users explore potential outcomes and inform their strategic thinking.",
  },
  {
    title: "No Advice",
    body: "STRATFIT does not provide financial, legal, tax, investment, or strategic advice. Nothing on this platform should be interpreted as a recommendation to take or refrain from any specific action. Users should consult qualified professionals before making business decisions.",
  },
  {
    title: "No Guarantees",
    body: "All simulation outputs, probability estimates, scenario projections, and AI-generated commentary are directional estimates only. They are not predictions or guarantees of future performance. Actual results may differ materially from simulated outcomes.",
  },
  {
    title: "User Responsibility",
    body: "Users are solely responsible for the accuracy and completeness of data entered into STRATFIT. The quality of outputs depends on the quality of inputs. Users are responsible for independently validating all outputs before making decisions.",
  },
  {
    title: "AI Commentary Limitations",
    body: "AI-generated commentary is produced by large language models interpreting simulation outputs. AI commentary may be incomplete, inaccurate, or misleading. It is provided for informational purposes only and should not be relied upon as advice or analysis.",
  },
  {
    title: "Limitation of Liability",
    body: "To the maximum extent permitted by law, STRATFIT and its creators shall not be liable for any loss, damage, or cost arising from use of the platform, reliance on its outputs, or decisions made based on its simulations or AI commentary.",
  },
  {
    title: "Contact",
    body: "For questions about these terms, contact the STRATFIT team through the channels provided on the platform.",
  },
]

export default function TermsPage() {
  return (
    <div style={S.root}>
      <div style={S.container}>
        <Link to="/" style={S.backLink}>← Back to STRATFIT</Link>

        <h1 style={S.heading}>Terms of Use</h1>
        <p style={S.updated}>Last updated: March 2026</p>

        {SECTIONS.map((s) => (
          <section key={s.title} style={S.section}>
            <h2 style={S.sectionTitle}>{s.title}</h2>
            <p style={S.sectionBody}>{s.body}</p>
          </section>
        ))}

        <div style={S.footer}>
          <Link to="/legal/privacy" style={S.footerLink}>Privacy Policy</Link>
        </div>
      </div>
    </div>
  )
}

const S: Record<string, React.CSSProperties> = {
  root: {
    minHeight: "100vh",
    background: "#0B1520",
    color: "rgba(220,240,255,0.85)",
    fontFamily: "'Inter', system-ui, sans-serif",
    display: "flex",
    justifyContent: "center",
    padding: "40px 20px 80px",
  },
  container: {
    maxWidth: 720,
    width: "100%",
  },
  backLink: {
    display: "inline-block",
    marginBottom: 32,
    fontSize: 12,
    fontWeight: 600,
    color: "rgba(34,211,238,0.7)",
    textDecoration: "none",
    letterSpacing: "0.04em",
  },
  heading: {
    fontSize: 28,
    fontWeight: 300,
    letterSpacing: "0.06em",
    color: "#dff8ff",
    marginBottom: 8,
  },
  updated: {
    fontSize: 12,
    color: "rgba(220,240,255,0.35)",
    marginBottom: 40,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: "#dff8ff",
    marginBottom: 8,
  },
  sectionBody: {
    fontSize: 14,
    lineHeight: 1.7,
    color: "rgba(220,240,255,0.70)",
    margin: 0,
  },
  footer: {
    marginTop: 48,
    paddingTop: 24,
    borderTop: "1px solid rgba(54,226,255,0.1)",
  },
  footerLink: {
    fontSize: 12,
    color: "rgba(34,211,238,0.6)",
    textDecoration: "none",
  },
}
