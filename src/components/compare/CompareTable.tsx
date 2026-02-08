// src/components/compare/CompareTable.tsx
// STRATFIT — Structured Comparison Table
// Columns: Metric | Baseline | Scenario A | (Scenario B) | Δ Abs | Δ %
// Grouped: SURVIVAL · ECONOMICS · VALUE
// Monospaced numbers. Δ colored. Max ~14 rows.

import React from "react";
import styles from "./ComparePage.module.css";

interface KPISet {
  runway?: { value: number };
  riskScore?: { value: number };
  riskIndex?: { value: number };
  arrCurrent?: { value: number };
  arrGrowthPct?: { value: number };
  burnQuality?: { value: number };
  cashPosition?: { value: number };
  enterpriseValue?: { value: number };
  momentum?: { value: number };
  ltvCac?: { value: number };
  qualityScore?: { value: number };
  growthStress?: { value: number };
}

interface CompareTableProps {
  baselineKpis: KPISet | null;
  scenarioAKpis: KPISet | null;
  scenarioBKpis?: KPISet | null;
  is3Way: boolean;
}

interface Row {
  metric: string;
  baseVal: string;
  aVal: string;
  bVal?: string;
  deltaAbs: string;
  deltaPct: string;
  direction: "positive" | "negative" | "neutral";
}

function fmt(n: number | undefined, suffix = ""): string {
  if (n === undefined || n === null) return "—";
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M${suffix}`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}K${suffix}`;
  return `${n.toFixed(1)}${suffix}`;
}

function pct(n: number | undefined): string {
  if (n === undefined || n === null) return "—";
  return `${n.toFixed(1)}%`;
}

function delta(a: number | undefined, b: number | undefined, invert = false): { abs: string; pctStr: string; dir: "positive" | "negative" | "neutral" } {
  if (a === undefined || b === undefined) return { abs: "—", pctStr: "—", dir: "neutral" };
  const d = a - b;
  const p = b !== 0 ? ((a - b) / Math.abs(b)) * 100 : 0;
  const sign = d > 0 ? "+" : "";
  let dir: "positive" | "negative" | "neutral" = "neutral";
  if (Math.abs(d) > 0.01) {
    const isGood = invert ? d < 0 : d > 0;
    dir = isGood ? "positive" : "negative";
  }
  return {
    abs: `${sign}${Math.abs(d) >= 1_000_000 ? `$${(d / 1_000_000).toFixed(1)}M` : Math.abs(d) >= 1_000 ? `$${(d / 1_000).toFixed(0)}K` : d.toFixed(1)}`,
    pctStr: `${sign}${p.toFixed(1)}%`,
    dir,
  };
}

function buildRows(base: KPISet | null, a: KPISet | null): { group: string; rows: Row[] }[] {
  if (!base || !a) return [];

  const groups: { group: string; rows: Row[] }[] = [];

  // SURVIVAL
  const survRows: Row[] = [];
  {
    // Survival probability (from riskIndex: higher = healthier)
    const bv = base.riskIndex?.value ?? 70;
    const av = a.riskIndex?.value ?? 70;
    const d = delta(av, bv);
    survRows.push({ metric: "Survival Probability", baseVal: `${bv.toFixed(0)}%`, aVal: `${av.toFixed(0)}%`, deltaAbs: d.abs + "pp", deltaPct: d.pctStr, direction: d.dir });
  }
  {
    const bv = base.runway?.value ?? 24;
    const av = a.runway?.value ?? 24;
    const d = delta(av, bv);
    survRows.push({ metric: "Runway (months)", baseVal: `${bv.toFixed(1)}`, aVal: `${av.toFixed(1)}`, deltaAbs: `${d.abs}mo`, deltaPct: d.pctStr, direction: d.dir });
  }
  {
    const bv = base.riskScore?.value ?? 30;
    const av = a.riskScore?.value ?? 30;
    const d = delta(av, bv, true);
    survRows.push({ metric: "Downside Risk Index", baseVal: `${bv.toFixed(0)}/100`, aVal: `${av.toFixed(0)}/100`, deltaAbs: d.abs, deltaPct: d.pctStr, direction: d.dir });
  }
  groups.push({ group: "SURVIVAL", rows: survRows });

  // ECONOMICS
  const econRows: Row[] = [];
  {
    const bv = base.arrCurrent?.value ?? 0;
    const av = a.arrCurrent?.value ?? 0;
    const d = delta(av, bv);
    econRows.push({ metric: "ARR", baseVal: fmt(bv), aVal: fmt(av), deltaAbs: d.abs, deltaPct: d.pctStr, direction: d.dir });
  }
  {
    const bv = base.arrGrowthPct?.value ?? 0;
    const av = a.arrGrowthPct?.value ?? 0;
    const d = delta(av, bv);
    econRows.push({ metric: "Growth Rate", baseVal: pct(bv), aVal: pct(av), deltaAbs: `${d.abs}pp`, deltaPct: d.pctStr, direction: d.dir });
  }
  {
    const bv = base.ltvCac?.value ?? 3;
    const av = a.ltvCac?.value ?? 3;
    const d = delta(av, bv);
    econRows.push({ metric: "LTV/CAC", baseVal: `${bv.toFixed(1)}x`, aVal: `${av.toFixed(1)}x`, deltaAbs: `${d.abs}x`, deltaPct: d.pctStr, direction: d.dir });
  }
  {
    const bv = (base.burnQuality?.value ?? 50) * 1000;
    const av = (a.burnQuality?.value ?? 50) * 1000;
    const d = delta(av, bv, true);
    econRows.push({ metric: "Net Burn", baseVal: fmt(bv, "/mo"), aVal: fmt(av, "/mo"), deltaAbs: d.abs, deltaPct: d.pctStr, direction: d.dir });
  }
  groups.push({ group: "ECONOMICS", rows: econRows });

  // VALUE
  const valRows: Row[] = [];
  {
    const bv = (base.enterpriseValue?.value ?? 50) / 10 * 1_000_000;
    const av = (a.enterpriseValue?.value ?? 50) / 10 * 1_000_000;
    const d = delta(av, bv);
    valRows.push({ metric: "EV Median", baseVal: fmt(bv), aVal: fmt(av), deltaAbs: d.abs, deltaPct: d.pctStr, direction: d.dir });
  }
  {
    const bv = base.qualityScore?.value ?? 0.65;
    const av = a.qualityScore?.value ?? 0.65;
    const d = delta(av, bv);
    valRows.push({ metric: "Quality Score", baseVal: pct(bv * 100), aVal: pct(av * 100), deltaAbs: `${d.abs}pp`, deltaPct: d.pctStr, direction: d.dir });
  }
  {
    const bv = base.growthStress?.value ?? 0.3;
    const av = a.growthStress?.value ?? 0.3;
    const d = delta(av, bv, true);
    valRows.push({ metric: "Growth Fragility", baseVal: pct(bv * 100), aVal: pct(av * 100), deltaAbs: `${d.abs}pp`, deltaPct: d.pctStr, direction: d.dir });
  }
  {
    const bv = base.cashPosition?.value ?? 4_000_000;
    const av = a.cashPosition?.value ?? 4_000_000;
    const d = delta(av, bv);
    valRows.push({ metric: "Cash Position", baseVal: fmt(bv), aVal: fmt(av), deltaAbs: d.abs, deltaPct: d.pctStr, direction: d.dir });
  }
  groups.push({ group: "VALUE", rows: valRows });

  return groups;
}

const CompareTable: React.FC<CompareTableProps> = ({
  baselineKpis,
  scenarioAKpis,
  scenarioBKpis,
  is3Way,
}) => {
  const groups = buildRows(baselineKpis, scenarioAKpis);

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Metric</th>
            <th>Baseline</th>
            <th>Scenario A</th>
            {is3Way && <th>Scenario B</th>}
            <th>Δ Absolute</th>
            <th>Δ %</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((g) => (
            <React.Fragment key={g.group}>
              <tr>
                <td colSpan={is3Way ? 6 : 5} className={styles.tableGroupHeader}>
                  {g.group}
                </td>
              </tr>
              {g.rows.map((r) => (
                <tr key={r.metric}>
                  <td>{r.metric}</td>
                  <td>{r.baseVal}</td>
                  <td>{r.aVal}</td>
                  {is3Way && <td>{r.bVal ?? "—"}</td>}
                  <td className={r.direction === "positive" ? styles.cellPositive : r.direction === "negative" ? styles.cellNegative : styles.cellMuted}>
                    {r.deltaAbs}
                  </td>
                  <td className={r.direction === "positive" ? styles.cellPositive : r.direction === "negative" ? styles.cellNegative : styles.cellMuted}>
                    {r.deltaPct}
                  </td>
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CompareTable;





