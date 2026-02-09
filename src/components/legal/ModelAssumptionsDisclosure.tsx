// src/components/legal/ModelAssumptionsDisclosure.tsx
// STRATFIT — Legal Disclosure Layer
// Collapsible. Non-intrusive. Permanently accessible.

import React, { useState } from "react";
import styles from "./ModelAssumptionsDisclosure.module.css";

const SECTIONS = [
  {
    title: "Model Nature",
    text: "This platform provides probabilistic scenario analysis based on user-supplied inputs and statistical modelling techniques. It does not constitute financial advice.",
  },
  {
    title: "Simulation Disclosure",
    text: "Monte Carlo simulations are stochastic and subject to input sensitivity. Outputs reflect model assumptions and are not guarantees.",
  },
  {
    title: "Valuation Methods Disclosure",
    text: "Valuation outputs may include DCF, multiple-based, and probabilistic blended methodologies. Each method contains structural assumptions and inherent limitations.",
  },
  {
    title: "No Advisory Clause",
    text: "STRATFIT is a decision-support tool. Users are responsible for independent verification and professional advice.",
  },
  {
    title: "Data Integrity Clause",
    text: "Accuracy depends on correctness of input data. STRATFIT does not verify user-submitted financial information.",
  },
];

export const ModelAssumptionsDisclosure: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className={styles.root}>
      <div className={styles.header} onClick={() => setOpen((p) => !p)}>
        <span className={styles.title}>Model Assumptions &amp; Legal Disclosure</span>
        <span className={`${styles.chevron} ${open ? styles.chevronOpen : ""}`}>▼</span>
      </div>
      {open && (
        <div className={styles.body}>
          {SECTIONS.map((s, i) => (
            <div key={i} className={styles.section}>
              <h4 className={styles.sectionTitle}>{s.title}</h4>
              <p className={styles.sectionText}>{s.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ModelAssumptionsDisclosure;



