// src/components/AIIntelligenceEnhanced.tsx
// STRATFIT — AI Intelligence (Command Assessment)
// Goal: interpretation, not KPI duplication.
// Rules: no engine math changes; no KPI duplication UI; no raw numbers in content.

import React, { useEffect, useMemo, useRef, useState } from "react";
// Typewriter effect hook
function useTypewriter(text: string, speed = 18, enabled = true) {
  const [display, setDisplay] = useState("");
  useEffect(() => {
    if (!enabled) { setDisplay(text); return; }
    setDisplay("");
    let i = 0;
    let cancelled = false;
    function type() {
      if (cancelled) return;
      setDisplay(text.slice(0, i));
      if (i < text.length) {
        i++;
        setTimeout(type, speed + Math.random() * 24 - 8);
      }
    }
    type();
    return () => { cancelled = true; };
  }, [text, speed, enabled]);
  return display;
}
import type { ScenarioId } from "@/state/scenarioStore";
import { calculateMetrics, type LeverState } from "@/logic/calculateMetrics";
import { deriveArrGrowth } from "@/utils/arrGrowth";
import { mapScenarioIntelligence, type ScenarioMetricsSnapshot } from "@/utils/scenarioIntelligenceMapping";
import {
  askStrategicQuestionsOpenAI,
  computeScenarioHash,
  createStrategicQaCache,
  fetchStrategicQaCached,
  type AIQAResponse,
  type DeltaDir,
  type ScenarioLabel,
  type StrategicQaPromptInput,
  type StrategicQuestionId,
} from "@/utils/openaiStrategicQa";
import { appendScenarioNote } from "@/utils/scenarioNotes";
import { buildScenarioIntelligence, buildScenarioMemo } from "@/memo/buildScenarioMemo";

type RiskSignal = {
  severity: "STABLE" | "MODERATE" | "ELEVATED" | "HIGH";
  title: string;
  driver: string;
  impact: string;
};

function snapshotFromMetrics(m: ReturnType<typeof calculateMetrics>): ScenarioMetricsSnapshot {
  // NOTE: These are derived representations for interpretation only (UI), not engine changes.
  const runwayMonths = m.runway;
  const cashPosition = m.cashPosition * 1_000_000; // calculateMetrics cash is in "M" units
  const burnRateMonthly = m.burnQuality * 1_000; // burnQuality displayed as $K
  const arr = (m.momentum / 10) * 1_000_000; // UI ARR proxy ($XM)
  const growthRate = Math.max(-0.5, Math.min(0.8, (m.momentum - 50) * 0.006));
  const arrNext12 = arr * (1 + growthRate);
  const arrGrowth = deriveArrGrowth({ arrCurrent: arr, arrNext12 });
  const arrGrowthPct = arrGrowth.arrGrowthPct === null ? NaN : arrGrowth.arrGrowthPct * 100;
  const grossMarginPct = m.earningsPower;
  const riskScore = m.riskIndex;
  const enterpriseValue = (m.enterpriseValue / 10) * 1_000_000;
  return {
    runwayMonths,
    cashPosition,
    burnRateMonthly,
    arr,
    arrGrowthPct,
    grossMarginPct,
    riskScore,
    enterpriseValue,
  };
}

export default function AIIntelligenceEnhanced(props: { levers: LeverState; scenario: ScenarioId }) {
  const { levers, scenario } = props;

  const { cur, base, assessment } = useMemo(() => {
    const cur = snapshotFromMetrics(calculateMetrics(levers, scenario));
    const base = snapshotFromMetrics(calculateMetrics(levers, "base"));
    return { cur, base, assessment: mapScenarioIntelligence({ current: cur, baseline: base }) };
  }, [levers, scenario]);

  const [aiAnswersEnabled, setAiAnswersEnabled] = useState<boolean>(() => {
    try {
      return window.localStorage.getItem("STRATFIT_SI_AI_ANSWERS") === "1";
    } catch {
      return false; // default OFF (locked)
    }
  });

  const [compareToBase, setCompareToBase] = useState<boolean>(() => {
    try {
      const v = window.localStorage.getItem("STRATFIT_SI_AI_COMPARE_BASE");
      if (v === "0") return false;
      if (v === "1") return true;
      return true; // default ON (locked)
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem("STRATFIT_SI_AI_ANSWERS", aiAnswersEnabled ? "1" : "0");
    } catch {}
  }, [aiAnswersEnabled]);

  useEffect(() => {
    try {
      window.localStorage.setItem("STRATFIT_SI_AI_COMPARE_BASE", compareToBase ? "1" : "0");
    } catch {}
  }, [compareToBase]);

  function dir(delta: number): DeltaDir {
    const eps = 1e-9;
    return delta > eps ? "up" : delta < -eps ? "down" : "flat";
  }

  function inferId(q: string): StrategicQuestionId {
    const s = (q ?? "").toLowerCase();
    if (s.includes("capital timing sensitivity")) return "capital_timing";
    if (s.includes("sustainable is current growth")) return "growth_sustainability";
    if (s.includes("risk most concentrated")) return "risk_concentration";
    if (s.includes("assumptions does this scenario rely")) return "assumption_fragility";
    return "custom";
  }

  const promptInput = useMemo<StrategicQaPromptInput | null>(() => {
    const questions = (assessment.strategicQuestions ?? []).slice(0, 2);
    if (!questions.length) return null;

    const scenarioLabel: ScenarioLabel = scenario;
    const flat: DeltaDir = "flat";
    const deltas = compareToBase
      ? {
          runway: dir(cur.runwayMonths - base.runwayMonths),
          burn: dir(cur.burnRateMonthly - base.burnRateMonthly),
          growth: dir(cur.arrGrowthPct - base.arrGrowthPct),
          margin: dir(cur.grossMarginPct - base.grossMarginPct),
          risk: dir(cur.riskScore - base.riskScore),
          valuation: dir(cur.enterpriseValue - base.enterpriseValue),
        }
      : { runway: flat, burn: flat, growth: flat, margin: flat, risk: flat, valuation: flat };

    return {
      scenarioId: scenario,
      scenarioLabel,
      compareToBase,
      observation: assessment.observations.slice(0, 2),
      assumptionFlags: assessment.assumptionFlags.slice(0, 2),
      systemState: assessment.systemState,
      topRisks: assessment.risks.slice(0, 2),
      deltas,
      strategicQuestions: questions.map((q) => ({ id: inferId(q.question), question: q.question })),
    };
  }, [assessment, base, compareToBase, cur, scenario]);

  const scenarioHash = useMemo(() => {
    if (!promptInput) return null;
    return computeScenarioHash(promptInput);
  }, [promptInput]);

  const cacheRef = useRef(createStrategicQaCache());
  const failedRef = useRef<Set<string>>(new Set());
  const savedRef = useRef<Set<string>>(new Set());
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResp, setAiResp] = useState<AIQAResponse | null>(null);

  useEffect(() => {
    if (!aiAnswersEnabled) {
      setAiLoading(false);
      setAiResp(null);
      return;
    }
    if (!promptInput || !scenarioHash) {
      setAiLoading(false);
      setAiResp(null);
      return;
    }

    const cached = cacheRef.current.get(scenarioHash);
    if (cached) {
      setAiResp(cached);
      setAiLoading(false);
      return;
    }

    if (failedRef.current.has(scenarioHash)) {
      setAiResp(null);
      setAiLoading(false);
      return;
    }

    setAiLoading(true);
    let cancelled = false;
    const t = window.setTimeout(async () => {
      const resp = await fetchStrategicQaCached({
        cache: cacheRef.current,
        hash: scenarioHash,
        fetcher: async () => {
          const out = await askStrategicQuestionsOpenAI({ input: promptInput });
          if (!out) throw new Error("openai_failed");
          return out;
        },
      });

      if (cancelled) return;
      if (!resp) {
        failedRef.current.add(scenarioHash);
        setAiResp(null);
        setAiLoading(false);
        return;
      }

      setAiResp(resp);
      setAiLoading(false);

      // Save successful AI output into Scenario Notes with provenance (once per hash)
      if (!savedRef.current.has(scenarioHash)) {
        savedRef.current.add(scenarioHash);
        appendScenarioNote({
          type: "ai_qa",
          scenarioId: scenario,
          compareToBase,
          model: "gpt-4o-mini",
          inputHash: scenarioHash,
          payload: resp,
        });
      }
    }, 700);

    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [aiAnswersEnabled, compareToBase, promptInput, scenario, scenarioHash]);

  return (
    <div className="cold-panel sf-si">
      <div className="sf-si__header">
        <div>
          <div className="sf-si__title" style={{fontSize:28,letterSpacing:'0.08em',fontWeight:900,color:'#22d3ee',textTransform:'uppercase'}}>Scenario Intelligence</div>
          <div className="sf-si__meta" style={{display:'flex',alignItems:'center',gap:8}}>
            <span className="sf-si__status">
              <span className="sf-si__dot" aria-hidden="true" />
              SYNCED
            </span>
            <span className="sf-si__sep">·</span>
            <span className="sf-si__tag" style={{position:'relative',display:'inline-flex',alignItems:'center',gap:6}}>
              ASSESSMENT
              <span style={{display:'inline-flex',gap:2,marginLeft:6}}>
                {[0,1,2].map(i => (
                  <span key={i}
                    style={{
                      width:7,height:7,borderRadius:4,
                      background:'#22ff99',
                      boxShadow:'0 0 8px #22ff99,0 0 2px #22ff99',
                      opacity: aiLoading
                        ? 0.4 + 0.6 * (i === (Math.floor(Date.now() / 300) % 3) ? 1 : 0)
                        : 0.25,
                      transition:'opacity 0.2s',
                      display:'inline-block',
                    }}
                  />
                ))}
              </span>
            </span>
          </div>
        </div>

        <div style={{ marginLeft: "auto" }}>
          <button
            type="button"
            onClick={() => {
              const scenarioName =
                scenario === "base"
                  ? "Base Scenario"
                  : scenario === "upside"
                  ? "Upside Scenario"
                  : scenario === "downside"
                  ? "Downside Scenario"
                  : "Extreme Scenario";

              const strategicQA = (assessment.strategicQuestions ?? []).slice(0, 2).map((qa) => {
                const id = inferId(qa.question);
                const aiItem = aiAnswersEnabled ? aiResp?.items?.find((it) => it && it.id === id) : null;
                return { question: qa.question, answer: aiItem?.answer ? aiItem.answer : qa.answer };
              });

              const intel = buildScenarioIntelligence({
                scenarioId: scenario,
                scenarioName,
                preparedAt: new Date().toISOString(),
                modelVersion: aiAnswersEnabled && aiResp ? "deterministic-v1 + gpt-4o-mini" : "deterministic-v1",
                assessment: {
                  systemState: assessment.systemState,
                  observations: assessment.observations,
                  risks: assessment.risks,
                  attention: assessment.attention,
                  assumptionFlags: assessment.assumptionFlags,
                  strategicQuestions: assessment.strategicQuestions,
                },
                strategicQAOverride: strategicQA,
              });

              const memo = buildScenarioMemo(intel);
              try {
                window.localStorage.setItem("scenarioMemoSnapshot", JSON.stringify(memo));
              } catch {}

              window.open(`/memo/${scenario}?print=1`, "_blank");
            }}
            className="header-action-btn"
            aria-label="Export Scenario Memo"
          >
            Export Scenario Memo
          </button>
        </div>
      </div>


      <div className="sf-si__section">
        <div className="sf-si__kicker" style={{color:'#22d3ee'}}>Observations</div>
        <div className="sf-si__brief">
          {assessment.observations.map((l, i) => {
            const text = useTypewriter(l, 18, true);
            return (
              <div key={i} style={{color:'#22d3ee', fontFamily:'ui-monospace,monospace', fontSize:15, marginBottom:6}}>{text}</div>
            );
          })}
        </div>
      </div>

      <div className="sf-si__section">
        <div className="sf-si__kicker">System State</div>
        <div className="sf-si__tiles" style={{ gridTemplateColumns: "repeat(3, minmax(0,1fr))" }}>
          <div className="sf-si__tile">
            <div className="sf-si__tileLabel">Financial</div>
            <div className="sf-si__tileValue">{assessment.systemState.financial}</div>
            <div className="sf-si__tileSub">Runway posture</div>
          </div>
          <div className="sf-si__tile">
            <div className="sf-si__tileLabel">Operational</div>
            <div className="sf-si__tileValue">{assessment.systemState.operational}</div>
            <div className="sf-si__tileSub">Load vs capacity</div>
          </div>
          <div className="sf-si__tile">
            <div className="sf-si__tileLabel">Execution</div>
            <div className="sf-si__tileValue">{assessment.systemState.execution}</div>
            <div className="sf-si__tileSub">Variance control</div>
          </div>
        </div>
      </div>


      <div className="sf-si__section">
        <div className="sf-si__kicker" style={{color:'#a78bfa'}}>Risk Signals</div>
        <div className="sf-si__brief">
          {assessment.risks.length ? (
            assessment.risks.map((r: RiskSignal, i: number) => {
              const riskText = useTypewriter(`${r.severity} · ${r.title}: ${r.driver} ${r.impact}`, 18, true);
              return (
                <div key={i} style={{ marginBottom: 10, color:'#a78bfa', fontFamily:'ui-monospace,monospace', fontSize:15 }}>
                  {riskText}
                </div>
              );
            })
          ) : (
            <div>No structural risks detected at current thresholds.</div>
          )}
        </div>
      </div>


      <div className="sf-si__section">
        <div className="sf-si__kicker" style={{color:'#22c55e'}}>Attention Signals</div>
        <ul className="sf-si__actions">
          {assessment.attention.slice(0, 3).map((a, i) => {
            const attnText = useTypewriter(a, 18, true);
            return (
              <li key={i} style={{color:'#22c55e', fontFamily:'ui-monospace,monospace', fontSize:15}}>{attnText}</li>
            );
          })}
        </ul>
      </div>

      {assessment.assumptionFlags.length ? (
        <div className="sf-si__section">
          <div className="sf-si__kicker">Assumption Flags</div>
          <ul className="sf-si__actions">
            {assessment.assumptionFlags.slice(0, 2).map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {assessment.strategicQuestions && assessment.strategicQuestions.length ? (
        <div className="sf-si__section">
          <div className="sf-si__kicker">Strategic Questions</div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "rgba(255,255,255,0.70)" }}>
              <input
                type="checkbox"
                checked={aiAnswersEnabled}
                onChange={(e) => setAiAnswersEnabled(e.target.checked)}
              />
              AI Answers
            </label>

            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "rgba(255,255,255,0.70)" }}>
              <input
                type="checkbox"
                checked={compareToBase}
                onChange={(e) => setCompareToBase(e.target.checked)}
                disabled={!aiAnswersEnabled}
              />
              Compare to Base
            </label>

            {aiAnswersEnabled ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 11, color: "rgba(255,255,255,0.62)" }}>
                <span className="sf-si__dot" aria-hidden="true" style={{ opacity: aiLoading ? 1 : 0.25 }} />
                {aiLoading ? "ANALYZING" : aiResp ? "AI READY" : "AI OFFLINE"}
              </span>
            ) : null}
          </div>

          <div className="sf-si__brief">
            {assessment.strategicQuestions.slice(0, 2).map((qa, i) => {
              const id = inferId(qa.question);
              const aiItem = aiResp?.items?.find((it) => it && it.id === id);
              const answer = aiAnswersEnabled && aiItem?.answer ? aiItem.answer : qa.answer;
              return (
                <div key={i} style={{ marginBottom: 10 }}>
                <div style={{ fontWeight: 900, color: "rgba(255,255,255,0.86)" }}>
                  {qa.question}
                </div>
                <div style={{ color: "rgba(255,255,255,0.74)", marginTop: 3 }}>
                  {answer}
                </div>
              </div>
              );
            })}
          </div>
        </div>
      ) : null}

      <details className="sf-si__trace">
        <summary>Traceability</summary>
        <div className="sf-si__traceGrid" style={{ gridTemplateColumns: "1fr" }}>
          <div className="sf-si__traceV">
            Trace: runwayMonths, cashPosition, burnRateMonthly, arr, arrGrowthPct, grossMarginPct, riskScore, enterpriseValue.
          </div>
        </div>
      </details>
    </div>
  );
}


