import React, { useState } from "react";

export default function InstitutionalDisclosure() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Footer Bar */}
      <div style={footerBar}>
        <div style={footerContent}>
          <span style={footerBrand}>STRATFIT</span>
          <button style={linkButton} onClick={() => setOpen(true)} type="button">
            Methodology & Assumptions
          </button>
        </div>
      </div>

      {/* Modal */}
      {open && (
        <div style={overlay} role="dialog" aria-modal="true">
          <div style={modal}>
            <div style={modalHeader}>
              <h2 style={modalTitle}>Methodology & Assumptions</h2>
              <button style={closeBtn} onClick={() => setOpen(false)} type="button" aria-label="Close">
                ✕
              </button>
            </div>

            <div style={modalBody}>
              <Section title="Model Framework">
                STRATFIT uses structured financial modeling and probabilistic scenario simulation
                to evaluate strategic outcomes across multiple future trajectories.
                Outputs are generated from user-defined assumptions and calibrated economic drivers.
              </Section>

              <Section title="Simulation Engine">
                Projections reflect probability-weighted scenario analysis using deterministic
                financial logic layered with stochastic sensitivity testing.
                Results represent modeled distributions — not guaranteed outcomes.
              </Section>

              <Section title="Scenario Comparison">
                Comparative outputs highlight deltas in survival probability,
                liquidity resilience, valuation trajectory, and capital efficiency
                across user-created strategic pathways.
              </Section>

              <Section title="Use Limitation">
                STRATFIT provides analytical tools designed to support strategic evaluation.
                Outputs do not constitute financial, investment, tax, or legal advice.
                Decisions remain the responsibility of the user.
              </Section>

              <Section title="Model Integrity">
                Results depend on input accuracy and assumption structure.
                STRATFIT does not warrant future performance or guarantee outcomes.
              </Section>

              <div style={footerNote}>
                STRATFIT Scenario Intelligence Platform · Institutional Simulation Framework
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ---------- Reusable Section ---------- */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h3 style={sectionTitle}>{title}</h3>
      <p style={sectionText}>{children}</p>
    </div>
  );
}

/* ---------- STYLES ---------- */

const footerBar: React.CSSProperties = {
  position: "fixed",
  bottom: 0,
  left: 0,
  width: "100%",
  background: "#0f172a",
  borderTop: "1px solid rgba(255,255,255,0.06)",
  padding: "10px 24px",
  zIndex: 50,
};

const footerContent: React.CSSProperties = {
  maxWidth: 1400,
  margin: "0 auto",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  color: "#94a3b8",
  fontSize: 12,
  letterSpacing: "0.05em",
};

const footerBrand: React.CSSProperties = {
  opacity: 0.5,
  fontWeight: 500,
};

const linkButton: React.CSSProperties = {
  background: "none",
  border: "none",
  color: "#38bdf8",
  cursor: "pointer",
  fontSize: 12,
  letterSpacing: "0.05em",
};

const overlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.75)",
  backdropFilter: "blur(4px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 100,
};

const modal: React.CSSProperties = {
  width: "820px",
  maxHeight: "85vh",
  overflowY: "auto",
  background: "#0b1220",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "0 20px 80px rgba(0,0,0,0.6)",
  padding: 32,
  color: "#e2e8f0",
};

const modalHeader: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 24,
};

const modalTitle: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 600,
  letterSpacing: "0.08em",
};

const closeBtn: React.CSSProperties = {
  background: "none",
  border: "none",
  color: "#94a3b8",
  fontSize: 18,
  cursor: "pointer",
};

const modalBody: React.CSSProperties = {
  fontSize: 14,
  lineHeight: 1.7,
  color: "#cbd5e1",
};

const sectionTitle: React.CSSProperties = {
  fontSize: 13,
  textTransform: "uppercase",
  letterSpacing: "0.15em",
  marginBottom: 8,
  color: "#38bdf8",
};

const sectionText: React.CSSProperties = {
  opacity: 0.85,
};

const footerNote: React.CSSProperties = {
  marginTop: 36,
  paddingTop: 18,
  borderTop: "1px solid rgba(255,255,255,0.06)",
  fontSize: 12,
  opacity: 0.5,
};


