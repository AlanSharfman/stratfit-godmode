// src/components/compare/CompareTable.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Accounting Variance Report (Compare Table)
// Columns: Metric | Baseline | Scenario A | Δ Abs | Δ % | Δ $ | Commentary
// Institutional. Deterministic insights. No fluff.
// ═══════════════════════════════════════════════════════════════════════════

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
  deltaAbs: string;
  deltaPct: string;
  deltaDollar: string;
  commentary: string;
  direction: "positive" | "negative" | "neutral";
}

function fmt(n: number | undefined, suffix = ""): string {
  if (n === undefined || n === null) return "—";
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M${suffix}`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}K${suffix}`;
  return `${n.toFixed(1)}${suffix}`;
}

function fmtDollar(n: number | undefined): string {
  if (n === undefined || n === null || n === 0) return "—";
  const sign = n > 0 ? "+" : "";
  if (Math.abs(n) >= 1_000_000) return `${sign}$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `${sign}$${(n / 1_000).toFixed(0)}K`;
  return `${sign}$${n.toFixed(0)}`;
}

function pct(n: number | undefined): string {
  if (n === undefined || n === null) return "—";
  return `${n.toFixed(1)}%`;
}

function delta(
  a: number | undefined,
  b: number | undefined,
  invert = false
): {
  abs: string;
  pctStr: string;
  dollar: string;
  dir: "positive" | "negative" | "neutral";
  rawDelta: number;
  rawPct: number;
} {
  if (a === undefined || b === undefined)
    return { abs: "—", pctStr: "—", dollar: "—", dir: "neutral", rawDelta: 0, rawPct: 0 };
  const d = a - b;
  const p = b !== 0 ? ((a - b) / Math.abs(b)) * 100 : 0;
  const sign = d > 0 ? "+" : "";
  let dir: "positive" | "negative" | "neutral" = "neutral";
  if (Math.abs(d) > 0.01) {
    const isGood = invert ? d < 0 : d > 0;
    dir = isGood ? "positive" : "negative";
  }
  return {
    abs: `${sign}${
      Math.abs(d) >= 1_000_000
        ? `$${(d / 1_000_000).toFixed(1)}M`
        : Math.abs(d) >= 1_000
        ? `$${(d / 1_000).toFixed(0)}K`
        : d.toFixed(1)
    }`,
    pctStr: `${sign}${p.toFixed(1)}%`,
    dollar: fmtDollar(d),
    dir,
    rawDelta: d,
    rawPct: p,
  };
}

function buildRows(base: KPISet | null, a: KPISet | null): { group: string; rows: Row[] }[] {
  if (!base || !a) return [];

  const groups: { group: string; rows: Row[] }[] = [];

  // ── SURVIVAL ──────────────────────────────────────────────────────────────
  const survRows: Row[] = [];
  {
    // Survival probability (from riskIndex: higher = healthier)
    const bv = base.riskIndex?.value ?? 70;
    const av = a.riskIndex?.value ?? 70;
    const d = delta(av, bv);
    const commentary =
      d.rawDelta > 5
        ? "Survival probability improves materially. Downside exposure reduced."
        : d.rawDelta < -5
        ? "Survival probability deteriorates. Capital risk increases."
        : "Survival probability remains stable. No material structural change.";
    survRows.push({
      metric: "Survival Probability",
      baseVal: `${bv.toFixed(0)}%`,
      aVal: `${av.toFixed(0)}%`,
      deltaAbs: d.abs + "pp",
      deltaPct: d.pctStr,
      deltaDollar: "—",
      commentary,
      direction: d.dir,
    });
  }
  {
    const bv = base.runway?.value ?? 24;
    const av = a.runway?.value ?? 24;
    const d = delta(av, bv);
    const commentary =
      d.rawDelta > 3
        ? "Runway extends. Strategic flexibility increases."
        : d.rawDelta < -3
        ? "Runway compresses. Liquidity pressure elevated."
        : av < 18
        ? "Runway below 18 months. Monitor funding timeline."
        : "Runway stable. Adequate planning horizon.";
    survRows.push({
      metric: "Runway (months)",
      baseVal: `${bv.toFixed(1)}`,
      aVal: `${av.toFixed(1)}`,
      deltaAbs: `${d.abs}mo`,
      deltaPct: d.pctStr,
      deltaDollar: "—",
      commentary,
      direction: d.dir,
    });
  }
  {
    const bv = base.riskScore?.value ?? 30;
    const av = a.riskScore?.value ?? 30;
    const d = delta(av, bv, true);
    const commentary =
      d.rawDelta < -5
        ? "Downside risk reduces. Variance tightens."
        : d.rawDelta > 5
        ? "Downside risk increases. Volatility exposure elevated."
        : "Risk profile unchanged. Variance distribution stable.";
    survRows.push({
      metric: "Downside Risk Index",
      baseVal: `${bv.toFixed(0)}/100`,
      aVal: `${av.toFixed(0)}/100`,
      deltaAbs: d.abs,
      deltaPct: d.pctStr,
      deltaDollar: "—",
      commentary,
      direction: d.dir,
    });
  }
  groups.push({ group: "SURVIVAL", rows: survRows });

  // ── ECONOMICS ─────────────────────────────────────────────────────────────
  const econRows: Row[] = [];
  {
    const bv = base.arrCurrent?.value ?? 0;
    const av = a.arrCurrent?.value ?? 0;
    const d = delta(av, bv);
    const commentary =
      d.rawPct > 15
        ? "ARR growth accelerates. Revenue momentum strengthens."
        : d.rawPct < -10
        ? "ARR contracts. Revenue durability questioned."
        : "ARR trajectory stable. Growth rate unchanged.";
    econRows.push({
      metric: "ARR",
      baseVal: fmt(bv),
      aVal: fmt(av),
      deltaAbs: d.abs,
      deltaPct: d.pctStr,
      deltaDollar: fmtDollar(d.rawDelta),
      commentary,
      direction: d.dir,
    });
  }
  {
    const bv = base.arrGrowthPct?.value ?? 0;
    const av = a.arrGrowthPct?.value ?? 0;
    const d = delta(av, bv);
    const commentary =
      d.rawDelta > 5
        ? "Growth rate increases. Expansion velocity accelerates."
        : d.rawDelta < -5
        ? "Growth rate declines. Efficiency may offset revenue deceleration."
        : "Growth rate stable. No material acceleration or deceleration.";
    econRows.push({
      metric: "Growth Rate",
      baseVal: pct(bv),
      aVal: pct(av),
      deltaAbs: `${d.abs}pp`,
      deltaPct: d.pctStr,
      deltaDollar: "—",
      commentary,
      direction: d.dir,
    });
  }
  {
    const bv = base.ltvCac?.value ?? 3;
    const av = a.ltvCac?.value ?? 3;
    const d = delta(av, bv);
    const commentary =
      av < 3
        ? "LTV/CAC below institutional threshold (3.0x). Unit economics weak."
        : av > 5
        ? "LTV/CAC strong. Customer acquisition economics healthy."
        : "LTV/CAC adequate. Standard monitoring applies.";
    econRows.push({
      metric: "LTV/CAC",
      baseVal: `${bv.toFixed(1)}x`,
      aVal: `${av.toFixed(1)}x`,
      deltaAbs: `${d.abs}x`,
      deltaPct: d.pctStr,
      deltaDollar: "—",
      commentary,
      direction: d.dir,
    });
  }
  {
    const bv = (base.burnQuality?.value ?? 50) * 1000;
    const av = (a.burnQuality?.value ?? 50) * 1000;
    const d = delta(av, bv, true);
    const commentary =
      d.rawDelta > 50000
        ? "Net burn increases. Runway sensitivity elevated."
        : d.rawDelta < -50000
        ? "Net burn reduces. Capital efficiency improves."
        : "Net burn stable. No material change in cash consumption.";
    econRows.push({
      metric: "Net Burn",
      baseVal: fmt(bv, "/mo"),
      aVal: fmt(av, "/mo"),
      deltaAbs: d.abs,
      deltaPct: d.pctStr,
      deltaDollar: fmtDollar(d.rawDelta),
      commentary,
      direction: d.dir,
    });
  }
  groups.push({ group: "ECONOMICS", rows: econRows });

  // ── VALUE ─────────────────────────────────────────────────────────────────
  const valRows: Row[] = [];
  {
    const bv = ((base.enterpriseValue?.value ?? 50) / 10) * 1_000_000;
    const av = ((a.enterpriseValue?.value ?? 50) / 10) * 1_000_000;
    const d = delta(av, bv);
    const commentary =
      d.rawDelta > 2_000_000
        ? "Enterprise value expands. Strategic upside materializes."
        : d.rawDelta < -2_000_000
        ? "Enterprise value contracts. Capital preservation prioritized."
        : "Enterprise value stable. Valuation trajectory unchanged.";
    valRows.push({
      metric: "EV Median",
      baseVal: fmt(bv),
      aVal: fmt(av),
      deltaAbs: d.abs,
      deltaPct: d.pctStr,
      deltaDollar: fmtDollar(d.rawDelta),
      commentary,
      direction: d.dir,
    });
  }
  {
    const bv = base.qualityScore?.value ?? 0.65;
    const av = a.qualityScore?.value ?? 0.65;
    const d = delta(av, bv);
    const commentary =
      d.rawDelta > 0.05
        ? "Quality score improves. Structural resilience strengthens."
        : d.rawDelta < -0.05
        ? "Quality score declines. Structural fragility increases."
        : "Quality score stable. No material structural shift.";
    valRows.push({
      metric: "Quality Score",
      baseVal: pct(bv * 100),
      aVal: pct(av * 100),
      deltaAbs: `${d.abs}pp`,
      deltaPct: d.pctStr,
      deltaDollar: "—",
      commentary,
      direction: d.dir,
    });
  }
  {
    const bv = base.growthStress?.value ?? 0.3;
    const av = a.growthStress?.value ?? 0.3;
    const d = delta(av, bv, true);
    const commentary =
      av > 0.6
        ? "Growth fragility elevated. Concentrated dependency on acquisition assumptions."
        : av < 0.3
        ? "Growth fragility low. Revenue durability strong."
        : "Growth fragility moderate. Standard variance profile.";
    valRows.push({
      metric: "Growth Fragility",
      baseVal: pct(bv * 100),
      aVal: pct(av * 100),
      deltaAbs: `${d.abs}pp`,
      deltaPct: d.pctStr,
      deltaDollar: "—",
      commentary,
      direction: d.dir,
    });
  }
  {
    const bv = base.cashPosition?.value ?? 4_000_000;
    const av = a.cashPosition?.value ?? 4_000_000;
    const d = delta(av, bv);
    const commentary =
      d.rawDelta > 500_000
        ? "Cash position strengthens. Liquidity buffer expands."
        : d.rawDelta < -500_000
        ? "Cash position weakens. Monitor funding timeline."
        : "Cash position stable. No material liquidity shift.";
    valRows.push({
      metric: "Cash Position",
      baseVal: fmt(bv),
      aVal: fmt(av),
      deltaAbs: d.abs,
      deltaPct: d.pctStr,
      deltaDollar: fmtDollar(d.rawDelta),
      commentary,
      direction: d.dir,
    });
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
            <th>Δ Abs</th>
            <th>Δ %</th>
            <th>Δ $</th>
            <th>Commentary / Insights</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((g) => (
            <React.Fragment key={g.group}>
              <tr>
                <td colSpan={7} className={styles.tableGroupHeader}>
                  {g.group}
                </td>
              </tr>
              {g.rows.map((r) => (
                <tr key={r.metric}>
                  <td className={styles.cellMetric}>{r.metric}</td>
                  <td className={styles.cellValue}>{r.baseVal}</td>
                  <td className={styles.cellValue}>{r.aVal}</td>
                  <td
                    className={
                      r.direction === "positive"
                        ? styles.cellPositive
                        : r.direction === "negative"
                        ? styles.cellNegative
                        : styles.cellMuted
                    }
                  >
                    {r.deltaAbs}
                  </td>
                  <td
                    className={
                      r.direction === "positive"
                        ? styles.cellPositive
                        : r.direction === "negative"
                        ? styles.cellNegative
                        : styles.cellMuted
                    }
                  >
                    {r.deltaPct}
                  </td>
                  <td
                    className={
                      r.direction === "positive"
                        ? styles.cellPositive
                        : r.direction === "negative"
                        ? styles.cellNegative
                        : styles.cellMuted
                    }
                  >
                    {r.deltaDollar}
                  </td>
                  <td className={styles.cellCommentary}>{r.commentary}</td>
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
