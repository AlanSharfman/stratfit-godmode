// src/components/valuation/ValuationDisclosure.tsx
// STRATFIT — Layer 7: Legal Disclosure (expandable)
// Institutional-grade legal footer.

import { useState } from "react";
import styles from "./ValuationPage.module.css";

export default function ValuationDisclosure() {
  const [open, setOpen] = useState(false);

  return (
    <div className={styles.expandableSection}>
      <div className={styles.expandableHeader} onClick={() => setOpen(!open)}>
        <span className={styles.expandableTitle}>Legal Disclosure</span>
        <span className={`${styles.expandableChevron} ${open ? styles.expandableChevronOpen : ""}`}>
          ▾
        </span>
      </div>
      {open && (
        <div className={styles.expandableBody}>
          <p className={styles.disclosureBody}>
            This valuation is probabilistic and based on user-provided inputs and statistical
            modeling. It does not constitute financial advice. Market comparables are illustrative.
            Outcomes may vary. Strategic decisions based on this analysis remain the sole
            responsibility of the user. STRATFIT does not guarantee the accuracy, completeness, or
            reliability of any output. Past performance of comparable entities is not indicative of
            future results.
          </p>
        </div>
      )}
    </div>
  );
}





