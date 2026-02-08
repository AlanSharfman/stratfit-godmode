// src/components/valuation/ValuationMethodSelector.tsx
// STRATFIT — Layer 2: Valuation Method Selector
// Toggle between STRATFIT ENGINE, DCF, REVENUE MULTIPLE, COMPARABLES.
// Switching changes EV number + breakdown, does NOT change layout.

import styles from "./ValuationPage.module.css";

export type ValuationMethodId = "stratfit" | "dcf" | "revenue-multiple" | "comparables";

interface ValuationMethodSelectorProps {
  value: ValuationMethodId;
  onChange: (method: ValuationMethodId) => void;
}

const METHODS: { id: ValuationMethodId; label: string }[] = [
  { id: "stratfit", label: "STRATFIT ENGINE" },
  { id: "dcf", label: "DCF" },
  { id: "revenue-multiple", label: "REVENUE MULTIPLE" },
  { id: "comparables", label: "COMPARABLES" },
];

export default function ValuationMethodSelector({
  value,
  onChange,
}: ValuationMethodSelectorProps) {
  return (
    <div className={styles.methodBar}>
      <span className={styles.methodLabel}>Valuation Method:</span>
      {METHODS.map((m) => (
        <button
          key={m.id}
          className={`${styles.methodBtn} ${value === m.id ? styles.methodBtnActive : ""}`}
          onClick={() => onChange(m.id)}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}





