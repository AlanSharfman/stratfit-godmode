import React, { memo, useMemo } from "react";
import { useSystemBaseline } from "@/system/SystemBaselineProvider";
import styles from "@/pages/baseline/BaselinePage.module.css";

function fmtUsd(n: number) {
  if (!Number.isFinite(n)) return "—";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${Math.round(n).toLocaleString()}`;
}

const BaselineKeyStrip: React.FC = memo(() => {
  const { baseline } = useSystemBaseline();

  const churn = baseline?.operating.churnPct ?? 0;
  const nrr = baseline?.financial.nrrPct ?? 0;
  const cac = baseline?.customerEngine.cac ?? 0;
  const ltv = baseline?.customerEngine.ltv ?? 0;
  const payroll = baseline?.financial.payroll ?? 0;
  const burn = baseline?.financial.monthlyBurn ?? 0;
  const payrollPct = burn > 0 ? (payroll / burn) * 100 : 0;

  const items = useMemo(
    () => [
      { label: "Churn", value: `${churn.toFixed(1)}%`, tone: "weak" as const },
      { label: "NRR", value: `${Math.round(nrr)}%`, tone: "strong" as const },
      { label: "CAC", value: fmtUsd(cac), tone: "stable" as const },
      { label: "LTV", value: fmtUsd(ltv), tone: "stable" as const },
      { label: "Payroll", value: `${Math.round(payrollPct)}%`, tone: "watch" as const },
    ],
    [churn, nrr, cac, ltv, payrollPct],
  );

  return (
    <div className={styles.keyStrip}>
      {items.map((it) => (
        <div key={it.label} className={styles.keyItem} data-tone={it.tone}>
          <div className={styles.keyValue}>{it.value}</div>
          <div className={styles.keyLabel}>{it.label}</div>
        </div>
      ))}
    </div>
  );
});

BaselineKeyStrip.displayName = "BaselineKeyStrip";
export default BaselineKeyStrip;


