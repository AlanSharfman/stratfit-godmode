// src/components/ScenarioDeltaSnapshot.tsx
// Scenario Delta Snapshot — Collapsible table below mountain
// Shows Base → Scenario comparison with deltas and AI variance commentary

import { useState, useEffect, useMemo } from "react";
import { useScenarioStore } from "@/state/scenarioStore";

interface DeltaRow {
  metric: string;
  base: string;
  scenario: string;
  delta: string;
  deltaPct: string;
  deltaType: "positive" | "negative" | "neutral";
  commentary: string;
}

// CFO-grade variance commentary generator
function getVarianceCommentary(
  metric: string, 
  deltaType: "positive" | "negative" | "neutral",
  deltaPct: string,
  scenario: string
): string {
  if (deltaType === "neutral") return "No material variance from base case assumptions.";
  
  const isPositive = deltaType === "positive";
  const pctValue = Math.abs(parseFloat(deltaPct.replace(/[^0-9.-]/g, "")) || 0);
  
  // Scenario-aware commentary
  const scenarioContext = scenario === "upside" ? "upside assumptions" : 
                          scenario === "downside" ? "downside pressures" :
                          scenario === "extreme" ? "stress test conditions" : "adjusted lever inputs";

  const commentaryMap: Record<string, { positive: string; negative: string }> = {
    Revenue: {
      positive: pctValue > 30 
        ? `Strong revenue uplift driven by ${scenarioContext}. Demand thesis validated; growth trajectory on track.` 
        : `Modest revenue improvement observed. Growth levers responding positively to scenario inputs.`,
      negative: pctValue > 30 
        ? `Material revenue compression under ${scenarioContext}. Recommend reassessing demand assumptions and pipeline.` 
        : `Revenue softening anticipated. Continue monitoring top-line drivers and market conditions.`
    },
    ARR: {
      positive: pctValue > 25 
        ? `ARR acceleration exceeding expectations under ${scenarioContext}. Recurring revenue base strengthening.` 
        : `Incremental ARR growth reflects healthy customer acquisition and retention dynamics.`,
      negative: pctValue > 25 
        ? `ARR contraction signals churn risk or acquisition slowdown. Review customer success metrics.` 
        : `ARR growth moderating. Recommend reviewing pricing strategy and expansion revenue opportunities.`
    },
    "Gross Margin": {
      positive: pctValue > 10 
        ? `Margin expansion driven by ${scenarioContext}. Unit economics improving; operational leverage emerging.` 
        : `Gross margin improvement reflects cost discipline and favorable mix shift.`,
      negative: pctValue > 10 
        ? `Margin compression requires immediate attention. Review COGS structure and pricing power.` 
        : `Margin pressure emerging from ${scenarioContext}. Monitor input costs and product mix.`
    },
    "Risk Score": {
      positive: `Risk profile improving. System stability and operational resilience strengthening.`,
      negative: pctValue > 30 
        ? `Elevated risk concentration detected. Recommend stress testing key assumptions and contingency planning.` 
        : `Risk score increasing moderately. Continue monitoring key risk indicators.`
    },
    Valuation: {
      positive: pctValue > 50 
        ? `Significant enterprise value creation under ${scenarioContext}. Multiple expansion supported by fundamentals.` 
        : `Incremental valuation uplift reflecting improved unit economics and growth outlook.`,
      negative: pctValue > 50 
        ? `Substantial value erosion projected. Review capital allocation strategy and funding options.` 
        : `Valuation pressure emerging from ${scenarioContext}. Monitor closely for further deterioration.`
    },
    Runway: {
      positive: `Extended operating runway provides strategic flexibility. Additional time to execute growth initiatives.`,
      negative: pctValue > 20 
        ? `Critical runway compression. Prioritize cash preservation measures and evaluate funding alternatives.` 
        : `Operating buffer reduced under scenario. Recommend tightening expense controls proactively.`
    },
    "Burn Rate": {
      positive: `Burn rate discipline improving. Efficiency gains being realized through operational improvements.`,
      negative: pctValue > 30 
        ? `Burn rate trajectory unsustainable under ${scenarioContext}. Immediate cost rationalization required.` 
        : `Elevated burn rate anticipated. Conduct detailed review of cost structure and discretionary spend.`
    },
    "Cash Balance": {
      positive: `Liquidity position strengthened. Enhanced optionality for strategic investments and contingencies.`,
      negative: pctValue > 20 
        ? `Accelerated cash erosion projected. Activate funding contingency planning immediately.` 
        : `Cash drawdown within tolerance but trending unfavorably. Maintain heightened monitoring.`
    }
  };

  const metricCommentary = commentaryMap[metric];
  if (!metricCommentary) return isPositive ? "Favorable variance from base case." : "Adverse variance requiring attention.";
  
  return isPositive ? metricCommentary.positive : metricCommentary.negative;
}

export default function ScenarioDeltaSnapshot() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const storeValue = useScenarioStore((state) => state.showScenarioImpact);
    setIsOpen(storeValue);
  }, []);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newValue = !isOpen;
    setIsOpen(newValue);
    useScenarioStore.getState().setShowScenarioImpact(newValue);
  };

  const scenario = useScenarioStore((state) => state.scenario);

  const {
    activeScenarioId,
    comparisonTargetScenarioId,
    engineResults,
  } = useScenarioStore(
    (state) => ({
      activeScenarioId: state.activeScenarioId,
      comparisonTargetScenarioId: state.comparisonTargetScenarioId,
      engineResults: state.engineResults,
    })
  );

  const activeResult = engineResults?.[activeScenarioId];
  const baseResult =
    comparisonTargetScenarioId
      ? engineResults?.[comparisonTargetScenarioId]
      : undefined;

  const kpiDisplayValues = activeResult?.kpis || {};

  const deltaData: DeltaRow[] = useMemo(() => {
    // Parse numeric value from display string
    const parseValue = (display: string): number => {
      // Handle "X/100" format (like risk score)
      if (display.includes("/")) {
        const parts = display.split("/");
        return parseFloat(parts[0].replace(/[^0-9.-]/g, "")) || 0;
      }
      const cleaned = display.replace(/[^0-9.-]/g, "");
      return parseFloat(cleaned) || 0;
    };

    const baseValues = { 
      revenue: 2.6, 
      arr: 3.2,
      grossMargin: 74,
      valuation: 43.5, 
      runway: 19, 
      burn: 85, 
      cash: 4.0,
      risk: 23
    };

    const currentRevenue = parseValue(kpiDisplayValues.momentum?.display || "$2.6M");
    const currentARR = parseValue(kpiDisplayValues.momentum?.display || "$3.2M");
    const currentMargin = parseValue(kpiDisplayValues.earningsPower?.display || "74%");
    const currentValuation = parseValue(kpiDisplayValues.enterpriseValue?.display || "$43.5M");
    const currentRunway = parseValue(kpiDisplayValues.runway?.display || "19 mo");
    const currentBurn = parseValue(kpiDisplayValues.burnQuality?.display || "$85K");
    const currentCash = parseValue(kpiDisplayValues.cashPosition?.display || "$4.0M");
    const currentRisk = parseValue(kpiDisplayValues.riskIndex?.display || "23/100");

    const calcDelta = (current: number, base: number, isInverse = false): { delta: string; pct: string; type: "positive" | "negative" | "neutral" } => {
      const diff = current - base;
      if (Math.abs(diff) < 0.05) return { delta: "—", pct: "—", type: "neutral" };
      const pct = base !== 0 ? ((diff / base) * 100) : 0;
      const sign = diff > 0 ? "+" : "";
      const isPos = isInverse ? diff < 0 : diff > 0;
      const type: "positive" | "negative" | "neutral" = Math.abs(diff) < 0.05 ? "neutral" : isPos ? "positive" : "negative";
      return { delta: `${sign}${diff.toFixed(1)}`, pct: `${sign}${pct.toFixed(0)}%`, type };
    };

    const revD = calcDelta(currentRevenue, baseValues.revenue);
    const arrD = calcDelta(currentARR, baseValues.arr);
    const marginD = calcDelta(currentMargin, baseValues.grossMargin);
    const valD = calcDelta(currentValuation, baseValues.valuation);
    const runD = calcDelta(currentRunway, baseValues.runway);
    const burnD = calcDelta(currentBurn, baseValues.burn, true); // Burn: lower is better
    const cashD = calcDelta(currentCash, baseValues.cash);
    const riskD = calcDelta(currentRisk, baseValues.risk, true); // Risk: lower is better

    return [
      { metric: "Revenue", base: `$${baseValues.revenue.toFixed(1)}M`, scenario: kpiDisplayValues.momentum?.display || "—", delta: revD.delta === "—" ? "—" : `${revD.delta}M`, deltaPct: revD.pct, deltaType: revD.type, commentary: getVarianceCommentary("Revenue", revD.type, revD.pct, scenario) },
      { metric: "ARR", base: `$${baseValues.arr.toFixed(1)}M`, scenario: kpiDisplayValues.momentum?.display || "—", delta: arrD.delta === "—" ? "—" : `${arrD.delta}M`, deltaPct: arrD.pct, deltaType: arrD.type, commentary: getVarianceCommentary("ARR", arrD.type, arrD.pct, scenario) },
      { metric: "Valuation", base: `$${baseValues.valuation.toFixed(1)}M`, scenario: kpiDisplayValues.enterpriseValue?.display || "—", delta: valD.delta === "—" ? "—" : `${valD.delta}M`, deltaPct: valD.pct, deltaType: valD.type, commentary: getVarianceCommentary("Valuation", valD.type, valD.pct, scenario) },
      { metric: "Gross Margin", base: `${baseValues.grossMargin}%`, scenario: kpiDisplayValues.earningsPower?.display || "—", delta: marginD.delta === "—" ? "—" : `${marginD.delta}%`, deltaPct: marginD.pct, deltaType: marginD.type, commentary: getVarianceCommentary("Gross Margin", marginD.type, marginD.pct, scenario) },
      { metric: "Burn Rate", base: `$${baseValues.burn}K/mo`, scenario: kpiDisplayValues.burnQuality?.display || "—", delta: burnD.delta === "—" ? "—" : `${burnD.delta}K`, deltaPct: burnD.pct, deltaType: burnD.type, commentary: getVarianceCommentary("Burn Rate", burnD.type, burnD.pct, scenario) },
      { metric: "Cash Balance", base: `$${baseValues.cash.toFixed(1)}M`, scenario: kpiDisplayValues.cashPosition?.display || "—", delta: cashD.delta === "—" ? "—" : `${cashD.delta}M`, deltaPct: cashD.pct, deltaType: cashD.type, commentary: getVarianceCommentary("Cash Balance", cashD.type, cashD.pct, scenario) },
      { metric: "Runway", base: `${baseValues.runway} mo`, scenario: kpiDisplayValues.runway?.display || "—", delta: runD.delta === "—" ? "—" : `${runD.delta} mo`, deltaPct: runD.pct, deltaType: runD.type, commentary: getVarianceCommentary("Runway", runD.type, runD.pct, scenario) },
      { metric: "Risk Score", base: `${baseValues.risk}/100`, scenario: kpiDisplayValues.riskIndex?.display || "—", delta: riskD.delta === "—" ? "—" : `${riskD.delta}`, deltaPct: riskD.pct, deltaType: riskD.type, commentary: getVarianceCommentary("Risk Score", riskD.type, riskD.pct, scenario) },
    ];
  }, [kpiDisplayValues, scenario]);

  const getDeltaColor = (type: string) => 
    type === 'positive' ? 'rgba(34,211,238,0.9)' : 
    type === 'negative' ? 'rgba(251,146,60,0.9)' : 
    'rgba(130,145,165,0.5)';

  return (
    <>
      {/* World-First Value Proposition */}
      <div style={{
        marginBottom: '24px',
        padding: '24px 28px',
        background: 'linear-gradient(135deg, rgba(34,211,238,0.08) 0%, rgba(168,85,247,0.06) 100%)',
        border: '1px solid rgba(34,211,238,0.25)',
        borderRadius: '12px',
        boxShadow: '0 4px 24px rgba(34,211,238,0.12)',
      }}>
        <div style={{ display: 'flex', alignItems: 'start', gap: '20px' }}>
          {/* Icon */}
          <div style={{
            flexShrink: 0,
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'rgba(34,211,238,0.15)',
            border: '1px solid rgba(34,211,238,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" stroke="rgba(34,211,238,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="17 21 17 13 7 13 7 21" stroke="rgba(34,211,238,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="7 3 7 8 15 8" stroke="rgba(34,211,238,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          {/* Content */}
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: '16px',
              fontWeight: 700,
              color: 'rgba(34,211,238,0.95)',
              marginBottom: '8px',
              letterSpacing: '0.02em',
            }}>
              📊 Export Board-Ready PDF Reports
            </div>
            
            <div style={{
              fontSize: '13px',
              lineHeight: '1.6',
              color: 'rgba(200,215,230,0.9)',
              marginBottom: '16px',
            }}>
              Generate comprehensive variance analysis reports with one click. Perfect for board meetings, investor updates, and strategic planning sessions.
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px',
              marginBottom: '16px',
            }}>
              <div style={{
                padding: '10px 14px',
                background: 'rgba(18,22,30,0.6)',
                border: '1px solid rgba(34,211,238,0.2)',
                borderRadius: '8px',
              }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(34,211,238,0.8)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Included in PDF</div>
                <div style={{ fontSize: '11px', color: 'rgba(175,190,210,0.9)', lineHeight: '1.5' }}>
                  • Full variance analysis<br/>
                  • 3D terrain snapshot<br/>
                  • Lever position matrix<br/>
                  • AI strategic insights
                </div>
              </div>
              <div style={{
                padding: '10px 14px',
                background: 'rgba(18,22,30,0.6)',
                border: '1px solid rgba(34,211,238,0.2)',
                borderRadius: '8px',
              }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(34,211,238,0.8)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Use Cases</div>
                <div style={{ fontSize: '11px', color: 'rgba(175,190,210,0.9)', lineHeight: '1.5' }}>
                  • Board presentations<br/>
                  • Investor decks<br/>
                  • Strategic planning<br/>
                  • Scenario documentation
                </div>
              </div>
            </div>

            <div style={{
              padding: '14px 16px',
              background: 'rgba(168,85,247,0.08)',
              border: '1px solid rgba(168,85,247,0.2)',
              borderRadius: '8px',
              marginBottom: '12px',
            }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(168,85,247,0.95)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                🌍 World-First Technology
              </div>
              <div style={{ fontSize: '12px', lineHeight: '1.6', color: 'rgba(200,215,230,0.9)' }}>
                <strong style={{ color: 'rgba(255,255,255,0.95)' }}>No spreadsheet has ever done this.</strong> Traditional tools give you static numbers in rows and columns. STRATFIT visualizes your business as a <strong style={{ color: 'rgba(255,255,255,0.95)' }}>living terrain</strong> that shows system dynamics in real time — how growth, efficiency, and risk interact before they happen.
              </div>
            </div>

            <div style={{
              fontSize: '11px',
              color: 'rgba(150,165,185,0.75)',
              lineHeight: '1.5',
              fontStyle: 'italic',
            }}>
              💡 <strong style={{ color: 'rgba(200,215,230,0.85)', fontStyle: 'normal' }}>Why you need this:</strong> Explore scenarios before betting the company. See second-order effects, hidden leverage points, and compounding risks that Excel can't show you. From insight to board-ready report in 60 seconds.
            </div>
          </div>
        </div>
      </div>

      <div style={{ width: '100%', marginTop: '10px', marginBottom: '40px', flexShrink: 0 }}>
        <button 
          onClick={handleToggle}
          type="button"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            width: '100%',
            padding: '10px 14px',
            background: 'rgba(25,30,40,0.6)',
            border: '1px solid rgba(50,60,75,0.35)',
            borderRadius: '5px',
            cursor: 'pointer',
            color: 'rgba(150,165,180,0.85)',
            fontSize: '11px',
            fontWeight: 500,
            letterSpacing: '0.02em',
          }}
        >
          <svg 
            width="12" 
            height="12" 
            viewBox="0 0 12 12" 
            fill="none"
            style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}
          >
            <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>{isOpen ? "Hide Scenario Impact" : "Show Scenario Impact"}</span>
        </button>

        {isOpen && (
          <div style={{
            marginTop: '12px',
            marginBottom: '30px',
            padding: '24px 28px 32px 28px',
            background: 'rgba(18,22,30,0.8)',
            border: '1px solid rgba(50,60,75,0.35)',
            borderRadius: '6px',
          }}>
            {/* Header with title and scroll indicator on same line */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.06em', color: 'rgba(56,189,248,0.9)' }}>SCENARIO DELTA SNAPSHOT</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ opacity: 0.7 }}>
                  <path d="M6 2V10M6 10L3 7M6 10L9 7" stroke="rgba(56,189,248,0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span style={{ fontSize: '9px', fontWeight: 500, color: 'rgba(56,189,248,0.6)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  Scroll for all metrics
                </span>
              </div>
            </div>
            {/* Subtitle on separate line */}
            <div style={{ marginBottom: '16px', paddingBottom: '14px', borderBottom: '1px solid rgba(50,60,75,0.3)' }}>
              <span style={{ fontSize: '11px', fontWeight: 400, color: 'rgba(120,135,155,0.65)' }}>
                {scenario === 'base' ? 'Base Case → Adjusted Base' : `Base Case → ${scenario.charAt(0).toUpperCase() + scenario.slice(1)}`}
              </span>
            </div>
            
            {/* Table with generous spacing */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {/* Header Row */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '100px 90px 100px 80px 70px 80px 1fr',
                gap: '20px',
                padding: '14px 0',
                borderBottom: '1px solid rgba(56,189,248,0.25)',
              }}>
                <span style={{ fontWeight: 700, fontSize: '11px', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(56,189,248,0.85)' }}>Metric</span>
                <span style={{ fontWeight: 700, fontSize: '11px', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(56,189,248,0.85)', textAlign: 'right' }}>Base</span>
                <span style={{ fontWeight: 700, fontSize: '11px', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(56,189,248,0.85)', textAlign: 'right' }}>Scenario</span>
                <span style={{ fontWeight: 700, fontSize: '11px', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(56,189,248,0.85)', textAlign: 'right' }}>Δ</span>
                <span style={{ fontWeight: 700, fontSize: '11px', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(56,189,248,0.85)', textAlign: 'right' }}>Δ%</span>
                {/* Spacer column */}
                <span></span>
                <span style={{ fontWeight: 700, fontSize: '11px', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(56,189,248,0.85)' }}>CFO Commentary</span>
              </div>

              {/* Data Rows */}
              {deltaData.map((row, idx) => (
                <div 
                  key={row.metric}
                  style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '100px 90px 100px 80px 70px 80px 1fr',
                    gap: '20px',
                    padding: '16px 0',
                    borderBottom: idx === deltaData.length - 1 ? 'none' : '1px solid rgba(50,60,75,0.15)',
                    alignItems: 'flex-start',
                  }}
                >
                  <span style={{ 
                    fontWeight: 600, 
                    fontSize: '12px', 
                    color: 'rgba(200,215,230,0.95)',
                    fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
                  }}>{row.metric}</span>
                  <span style={{ 
                    fontSize: '12px', 
                    color: 'rgba(175,190,210,0.9)', 
                    textAlign: 'right',
                    fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
                    fontVariantNumeric: 'tabular-nums',
                  }}>{row.base}</span>
                  <span style={{ 
                    fontSize: '12px', 
                    color: 'rgba(175,190,210,0.9)', 
                    textAlign: 'right',
                    fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
                    fontVariantNumeric: 'tabular-nums',
                  }}>{row.scenario}</span>
                  <span style={{ 
                    fontSize: '12px', 
                    fontWeight: 600, 
                    color: getDeltaColor(row.deltaType), 
                    textAlign: 'right',
                    fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
                    fontVariantNumeric: 'tabular-nums',
                  }}>{row.delta}</span>
                  <span style={{ 
                    fontSize: '12px', 
                    fontWeight: 600, 
                    color: getDeltaColor(row.deltaType), 
                    textAlign: 'right',
                    fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
                    fontVariantNumeric: 'tabular-nums',
                  }}>{row.deltaPct}</span>
                  {/* Spacer column */}
                  <span></span>
                  <span style={{ 
                    fontSize: '11px',
                    lineHeight: '1.6',
                    fontFamily: "'Inter', -apple-system, sans-serif",
                    color: row.deltaType === 'neutral' ? 'rgba(130,145,165,0.55)' : 'rgba(175,190,210,0.9)',
                    fontStyle: row.deltaType === 'neutral' ? 'italic' : 'normal',
                  }}>{row.commentary}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
