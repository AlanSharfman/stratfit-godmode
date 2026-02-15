// src/components/compare/CompareViewToggle.tsx
// STRATFIT — Compare View Toggle: MOUNTAINS | TABLE | INSIGHTS
// Uppercase, 12–13px, cyan underline active, no pills, no glow.

import React from "react";
import styles from "./ComparePage.module.css";

export type CompareView = "mountains" | "table" | "insights";

interface CompareViewToggleProps {
  active: CompareView;
  onChange: (view: CompareView) => void;
}

const VIEWS: { id: CompareView; label: string }[] = [
  { id: "mountains", label: "Mountains" },
  { id: "table", label: "Table" },
  { id: "insights", label: "Insights" },
];

const CompareViewToggle: React.FC<CompareViewToggleProps> = ({ active, onChange }) => {
  return (
    <div className={styles.controlGroup}>
      <span className={styles.controlLabel}>Compare View</span>
      {VIEWS.map((v, i) => (
        <React.Fragment key={v.id}>
          {i > 0 && <span className={styles.controlSep} />}
          <button
            type="button"
            className={`${styles.controlBtn} ${active === v.id ? styles.controlBtnActive : ""}`}
            onClick={() => onChange(v.id)}
          >
            {v.label}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
};

export default CompareViewToggle;





