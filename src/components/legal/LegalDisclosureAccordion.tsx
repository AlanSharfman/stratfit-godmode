// src/components/legal/LegalDisclosureAccordion.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Legal Disclosure Accordion
//
// Collapsible. Calm, professional tone. Consistent across all pages.
// Includes: SHORT summary, expandable LONG, assumptions bullets.
// "Copy disclosure" button copies full text to clipboard.
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState, useCallback, type ReactNode } from "react";
import {
  MODEL_DISCLOSURE_SHORT,
  MODEL_DISCLOSURE_LONG,
  MODEL_ASSUMPTIONS_BULLETS,
} from "@/legal/modelDisclosure";
import styles from "./LegalDisclosureAccordion.module.css";

// ────────────────────────────────────────────────────────────────────────────
// PROPS
// ────────────────────────────────────────────────────────────────────────────

interface LegalDisclosureAccordionProps {
  defaultOpen?: boolean;
  showAssumptions?: boolean;
  showModelDetails?: boolean;
  modelDetails?: ReactNode;
}

// ────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ────────────────────────────────────────────────────────────────────────────

export const LegalDisclosureAccordion: React.FC<LegalDisclosureAccordionProps> = ({
  defaultOpen = false,
  showAssumptions = true,
  showModelDetails = false,
  modelDetails,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    const text = [
      MODEL_DISCLOSURE_LONG,
      "",
      "Assumptions:",
      ...MODEL_ASSUMPTIONS_BULLETS.map((b) => `• ${b}`),
    ].join("\n");

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for non-HTTPS contexts
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, []);

  return (
    <div className={styles.root}>
      {/* ── Header (always visible) ── */}
      <div className={styles.header} onClick={() => setOpen((p) => !p)}>
        <span className={styles.title}>Legal Disclosure &amp; Model Assumptions</span>
        <span className={`${styles.chevron} ${open ? styles.chevronOpen : ""}`}>▼</span>
      </div>

      {/* ── Short text (always visible under header) ── */}
      <div className={styles.shortText}>{MODEL_DISCLOSURE_SHORT}</div>

      {/* ── Expanded content ── */}
      {open && (
        <div className={styles.body}>
          {/* LONG DISCLOSURE */}
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Full Disclosure</h4>
            <p className={styles.sectionText}>{MODEL_DISCLOSURE_LONG}</p>
          </div>

          {/* ASSUMPTIONS */}
          {showAssumptions && (
            <div className={styles.section}>
              <h4 className={styles.sectionTitle}>Model Assumptions</h4>
              <ul className={styles.bulletList}>
                {MODEL_ASSUMPTIONS_BULLETS.map((bullet, i) => (
                  <li key={i} className={styles.bulletItem}>{bullet}</li>
                ))}
              </ul>
            </div>
          )}

          {/* MODEL DETAILS (optional slot) */}
          {showModelDetails && modelDetails && (
            <div className={styles.section}>
              <h4 className={styles.sectionTitle}>Model Details</h4>
              <div className={styles.modelDetails}>{modelDetails}</div>
            </div>
          )}

          {/* COPY BUTTON */}
          <button className={styles.copyBtn} onClick={handleCopy}>
            {copied ? "Copied ✓" : "Copy disclosure"}
          </button>
        </div>
      )}
    </div>
  );
};

export default LegalDisclosureAccordion;






