// src/components/ui/ScenarioIntelligencePanel.tsx
// STRATFIT — Scenario Intelligence (SAFE MVP, deterministic)
// No OpenAI calls. No engine math changes. UI + wiring only. Board/investor safe.

import React, { useEffect, useMemo, useState } from "react";
import styles from "./ScenarioIntelligencePanel.module.css";
import { useShallow } from "zustand/react/shallow";
import { useScenarioStore } from "@/state/scenarioStore";
import type { OpenAIScenarioQaResponse } from "@/utils/openaiScenarioQa";
import { saveScenarioQaNote } from "@/utils/scenarioNotes";

type Kpi = { value: number; display: string };

function getKpi(result: any, key: string): Kpi | null {
  const k = result?.kpis?.[key];
  if (!k || typeof k.value !== "number" || typeof k.display !== "string") return null;
  return k as Kpi;
}

function safeNum(n: unknown): number | null {
  return typeof n === "number" && Number.isFinite(n) ? n : null;
}

function riskBand(score01_100: number | null): "LOW" | "MED" | "HIGH" | "CRIT" | "—" {
  if (score01_100 === null) return "—";
  if (score01_100 >= 80) return "CRIT";
  if (score01_100 >= 65) return "HIGH";
  if (score01_100 >= 45) return "MED";
  return "LOW";
}

type QaAnswer = {
  supported: boolean;
  headline: string;
  bullets: string[]; // 3–6 bullets, no numbers/$/% (investor-safe)
  dataUsed: string[];
};

function toDeterministicNotePayload(args: {
  answer: QaAnswer;
  view: {
    scenarioLabel: string;
    tiles: {
      runway: string;
      arrGrowth: string;
      arrDelta: string;
      risk: string;
      riskBand: string;
    };
  };
}): OpenAIScenarioQaResponse & { source: "deterministic" } {
  const { answer, view } = args;
  const body = answer.bullets.filter(Boolean).join(" ");

  return {
    headline: answer.headline,
    answer: body || "—",
    key_metrics: [
      { name: "Scenario", value: view.scenarioLabel },
      { name: "Runway", value: view.tiles.runway },
      { name: "ARR Growth", value: `${view.tiles.arrGrowth} (Δ ARR ${view.tiles.arrDelta})` },
      { name: "Risk", value: `${view.tiles.risk} (State ${view.tiles.riskBand})` },
    ],
    drivers: answer.dataUsed.slice(0, 6),
    confidence: "medium",
    source: "deterministic",
  };
}

function normQ(q: string) {
  return q.trim().toLowerCase();
}

function hasAny(q: string, words: string[]) {
  return words.some((w) => q.includes(w));
}

// (Intentionally no delta formatting in SAFE MVP single-scenario mode.)

type Bands = {
  runway: "CRITICAL" | "TIGHT" | "ADEQUATE" | "STRONG" | "—";
  growth: "CONTRACTING" | "MUTED" | "SOLID" | "STRONG" | "—";
  risk: "LOW" | "MED" | "HIGH" | "CRIT" | "—";
  burn: string; // already categorical/short display
};

function runwayBand(months: number | null): Bands["runway"] {
  if (months === null) return "—";
  if (months < 9) return "CRITICAL";
  if (months < 12) return "TIGHT";
  if (months < 18) return "ADEQUATE";
  return "STRONG";
}

function growthBand(arrGrowthPct: number | null): Bands["growth"] {
  if (arrGrowthPct === null) return "—";
  if (arrGrowthPct < 0) return "CONTRACTING";
  if (arrGrowthPct < 0.1) return "MUTED";
  if (arrGrowthPct < 0.25) return "SOLID";
  return "STRONG";
}

function qaAnswer(
  question: string,
  ctx: {
    scenarioLabel: string;
    bands: Bands;
    activeLeverId: string | null;
  }
): QaAnswer {
  const q = normQ(question);
  if (!q) {
    return {
      supported: false,
      headline: "Awaiting a question",
      bullets: [
        "Type one precise question about this scenario.",
        "Try: runway posture, growth momentum, risk state, lever impact.",
        "This panel is deterministic and single-scenario.",
      ],
      dataUsed: ["question"],
    };
  }

  const isLiquidity = hasAny(q, ["runway", "liquidity", "cash", "burn"]);
  const isRisk = hasAny(q, ["risk", "fragile", "volatility", "execution"]);
  const isGrowth = hasAny(q, ["growth", "arr", "revenue", "momentum"]);
  const isSensitivity = hasAny(q, ["sensitivity", "impact", "lever", "driver", "what moved", "why"]);
  const isStress = hasAny(q, ["stress", "break", "breaking", "downside", "extreme", "crash"]);

  const baseBullets = [
    `Runway posture: ${ctx.bands.runway}.`,
    `Growth momentum: ${ctx.bands.growth}.`,
    `Risk state: ${ctx.bands.risk}.`,
  ];

  if (isSensitivity) {
    if (!ctx.activeLeverId) {
      return {
        supported: true,
        headline: `Sensitivity — ${ctx.scenarioLabel}`,
        bullets: [
          "No lever is currently active.",
          "Move a lever to enter LIVE mode, then ask again.",
          ...baseBullets.slice(0, 1),
        ].slice(0, 5),
        dataUsed: ["activeLeverId", "runway (band)"],
      };
    }
    return {
      supported: true,
      headline: `Sensitivity — ${ctx.scenarioLabel}`,
      bullets: [
        `Active lever: ${ctx.activeLeverId}.`,
        "Interpretation: treat this as directional only (single-scenario mode).",
        ...baseBullets,
      ].slice(0, 6),
      dataUsed: ["activeLeverId", "runway (band)", "arrGrowthPct (band)", "riskIndex (band)"],
    };
  }

  if (isLiquidity) {
    return {
      supported: true,
      headline: `Liquidity — ${ctx.scenarioLabel}`,
      bullets: [
        `Runway posture: ${ctx.bands.runway}.`,
        `Burn discipline: ${ctx.bands.burn || "—"}.`,
        "Decision lens: prioritize runway stability before acceleration.",
        `Risk state: ${ctx.bands.risk}.`,
      ].slice(0, 6),
      dataUsed: ["runway (band)", "burnQuality", "riskIndex (band)"],
    };
  }

  if (isRisk) {
    return {
      supported: true,
      headline: `Risk — ${ctx.scenarioLabel}`,
      bullets: [
        `Risk state: ${ctx.bands.risk}.`,
        "If risk is elevated: simplify the plan and reduce dependency chains.",
        `Runway posture: ${ctx.bands.runway}.`,
        `Growth momentum: ${ctx.bands.growth}.`,
      ].slice(0, 6),
      dataUsed: ["riskIndex (band)", "runway (band)", "arrGrowthPct (band)"],
    };
  }

  if (isGrowth) {
    return {
      supported: true,
      headline: `Growth — ${ctx.scenarioLabel}`,
      bullets: [
        `Growth momentum: ${ctx.bands.growth}.`,
        "If momentum is muted: focus on retention and conversion quality first.",
        `Runway posture: ${ctx.bands.runway}.`,
        `Risk state: ${ctx.bands.risk}.`,
      ].slice(0, 6),
      dataUsed: ["arrGrowthPct (band)", "runway (band)", "riskIndex (band)"],
    };
  }

  if (isStress) {
    return {
      supported: true,
      headline: `Stress posture — ${ctx.scenarioLabel}`,
      bullets: [
        `Runway posture: ${ctx.bands.runway}.`,
        `Risk state: ${ctx.bands.risk}.`,
        `Growth momentum: ${ctx.bands.growth}.`,
        "Interpretation: treat CRITICAL/TIGHT runway with HIGH/CRIT risk as fragile.",
      ].slice(0, 6),
      dataUsed: ["runway (band)", "riskIndex (band)", "arrGrowthPct (band)"],
    };
  }

  return {
    supported: false,
    headline: "Ask a supported question",
    bullets: [
      "Try one of: runway posture, growth momentum, risk state, lever sensitivity.",
      `Current snapshot: runway ${ctx.bands.runway}, growth ${ctx.bands.growth}, risk ${ctx.bands.risk}.`,
      "This panel is single-scenario and deterministic.",
    ],
    dataUsed: ["runway (band)", "arrGrowthPct (band)", "riskIndex (band)"],
  };
}

export default function ScenarioIntelligencePanel() {
  const { activeScenarioId, current, activeLeverId } = useScenarioStore(
    useShallow((s) => {
      const current = s.engineResults?.[s.activeScenarioId];
      return {
        activeScenarioId: s.activeScenarioId,
        current,
        activeLeverId: s.activeLeverId,
      };
    })
  );

  const [qaOpen, setQaOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<QaAnswer | null>(null);
  const [savedNonce, setSavedNonce] = useState(0);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const compareToBaseQa = false; // locked OFF for SAFE MVP
  const hasEngineOutput = Boolean(current && (current as any)?.kpis);

  useEffect(() => {
    if (savedAt === null) return;
    const t = window.setTimeout(() => setSavedAt(null), 1800);
    return () => window.clearTimeout(t);
  }, [savedAt]);

  const view = useMemo(() => {
    const runway = getKpi(current, "runway");
    const arrGrowthPct = getKpi(current, "arrGrowthPct");
    const arrDelta = getKpi(current, "arrDelta");
    const risk = getKpi(current, "riskIndex");
    const cash = getKpi(current, "cashPosition");
    const burn = getKpi(current, "burnQuality");

    const runwayV = safeNum(runway?.value);
    const riskV = safeNum(risk?.value);
    const arrPctV = safeNum(arrGrowthPct?.value);

    // Situation brief (1–2 lines, deterministic; single-scenario)
    const brief: string[] = [];
    const line1 = [
      `Runway ${runway?.display ?? "—"}`,
      `ARR Growth ${arrGrowthPct?.display ?? "—"}${arrDelta?.display ? ` (Δ ARR ${arrDelta.display})` : ""}`,
      `Risk ${risk?.display ?? "—"}`,
    ].join(" · ");
    brief.push(line1);

    // Signals (3 tiles, aligned)
    const riskBandLabel = riskBand(riskV);

    // Action signals (exactly 2–3, deterministic ordering)
    const actions: string[] = [];
    if (runwayV !== null && runwayV < 12) actions.push("Cut burn to extend runway meaningfully.");
    else if (runwayV !== null && runwayV < 18) actions.push("Tighten burn to move runway into a safer band.");

    if (arrGrowthPct?.display && arrGrowthPct.display !== "—") {
      if ((arrGrowthPct.value ?? 0) < 0) actions.push("Stabilize ARR: retention first, then pipeline and pricing.");
      else if ((arrGrowthPct.value ?? 0) < 0.10) actions.push("Increase ARR growth: focus ICP, conversion, and expansion.");
    }

    if (riskV !== null && riskV >= 65) actions.push("Reduce execution risk: de-risk roadmap and simplify dependencies.");
    else if (riskV !== null && riskV >= 45) actions.push("Add guardrails: staged investment with weekly leading indicators.");

    const picked = actions.slice(0, 3);
    while (picked.length < 2) picked.push("Maintain posture: monitor runway, ARR growth, and risk weekly.");

    // Traceability (facts only)
    const traceItems: Array<{ k: string; v: string }> = [];
    traceItems.push({ k: "runway", v: runway?.display ?? "—" });
    traceItems.push({ k: "arrGrowthPct", v: arrGrowthPct?.display ?? "—" });
    traceItems.push({ k: "arrDelta", v: arrDelta?.display ?? "—" });
    traceItems.push({ k: "riskIndex", v: risk?.display ?? "—" });

    const status = activeLeverId ? "LIVE" : "SYNCED";

    return {
      status,
      scenarioLabel: activeScenarioId.toUpperCase(),
      brief: brief.slice(0, 3),
      tiles: {
        runway: runway?.display ?? "—",
        arrGrowth: arrGrowthPct?.display ?? "—",
        arrDelta: arrDelta?.display ?? "—",
        risk: risk?.display ?? "—",
        riskBand: riskBandLabel,
      },
      actions: picked.slice(0, 3),
      traceItems,
      kpis: { runway, cash, burn, risk, arrGrowthPct, arrDelta },
      bands: {
        runway: runwayBand(runwayV),
        growth: growthBand(arrPctV),
        risk: riskBandLabel,
        burn: burn?.display ?? "—",
      } satisfies Bands,
    };
  }, [activeLeverId, activeScenarioId, current]);

  const panelState: "EMPTY" | "READY" | "ANSWERED" | "SAVED" = useMemo(() => {
    if (!hasEngineOutput) return "EMPTY";
    if (!answer) return "READY";
    if (savedAt !== null) return "SAVED";
    return "ANSWERED";
  }, [answer, hasEngineOutput, savedAt]);

  return (
    <div className="cold-panel sf-si__outer">
      <div className="sf-si sf-si--scenario">
        <div className="sf-si__bezel">
          <div className={styles["sf-si__scroll"]}>
            {/* 1) Header */}
            <div className="sf-si__header">
            <div>
              <div className="sf-si__title">Scenario Intelligence</div>
              <div className="sf-si__meta">
                <span className="sf-si__status">
                  <span
                    className={panelState === "EMPTY" ? "sf-si__dot sf-si__dot--pulse" : "sf-si__dot"}
                    aria-hidden="true"
                  />
                  {panelState === "EMPTY" ? "AWAITING" : view.status}
                </span>
                <span className="sf-si__sep">·</span>
                <span className="sf-si__tag">{view.scenarioLabel}</span>
              </div>
            </div>
          </div>

          {/* Mode row (never looks "broken") */}
          <div className="sf-si__section">
            <div className="sf-si__block">
              <div className="sf-si__modeRow">
                <span className="sf-si__modeLabel">Mode</span>
                <span className="sf-si__modePill" title="Single-scenario mode is locked in SAFE MVP.">
                  <span className="sf-si__modeLock" aria-hidden="true">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M7 11V8a5 5 0 0 1 10 0v3"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <path
                        d="M6 11h12v10H6V11Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  Single Scenario (Locked)
                </span>
              </div>
              <div className="sf-si__modeHint">
                Deterministic, investor-safe brief. No comparisons or external calls.
              </div>
            </div>
          </div>

          {panelState === "EMPTY" ? (
            <div className="sf-si__section">
              <div className="sf-si__block sf-si__empty">
                <div className="sf-si__emptyRow">
                  <span className="sf-si__pulseDot" aria-hidden="true" />
                  <div>
                    <div className="sf-si__emptyTitle">Awaiting engine output</div>
                    <div className="sf-si__emptySub">Run a scenario to populate signals and Q&amp;A.</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* 2) Situation Brief */}
              <div className="sf-si__section">
                <div className={`sf-si__kicker ${styles["sf-si__kicker"]}`}>Situation Brief</div>
                <div className="sf-si__block">
                  <div className="sf-si__brief">
                    {view.brief.map((l, i) => (
                      <div key={i}>{l}</div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 3) Signal Tiles (3) */}
              <div className="sf-si__section">
                <div className={`sf-si__kicker ${styles["sf-si__kicker"]}`}>Signals</div>
                <div className="sf-si__tiles">
                  <div className="sf-si__tile">
                    <div className="sf-si__tileLabel">Runway</div>
                    <div className="sf-si__tileValue">{view.tiles.runway}</div>
                    <div className="sf-si__tileSub">Months</div>
                  </div>
                  <div className="sf-si__tile">
                    <div className="sf-si__tileLabel">ARR Growth</div>
                    <div className="sf-si__tileValue">{view.tiles.arrGrowth}</div>
                    <div className="sf-si__tileSub">Δ ARR {view.tiles.arrDelta}</div>
                  </div>
                  <div className="sf-si__tile">
                    <div className="sf-si__tileLabel">Risk</div>
                    <div className="sf-si__tileValue">{view.tiles.risk}</div>
                    <div className="sf-si__tileSub">State {view.tiles.riskBand}</div>
                  </div>
                </div>
              </div>

              {/* 4) Action Signals */}
              <div className="sf-si__section">
                <div className={`sf-si__kicker ${styles["sf-si__kicker"]}`}>Action Signals</div>
                <div className="sf-si__block">
                  <ul className="sf-si__actions">
                    {view.actions.map((a, i) => (
                      <li key={i}>{a}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* 5) Traceability (collapsed) */}
              <details className="sf-si__trace">
                <summary>Traceability</summary>
                <div className="sf-si__traceGrid">
                  {view.traceItems.map((t) => (
                    <React.Fragment key={t.k}>
                      <div className="sf-si__traceK">{t.k}</div>
                      <div className="sf-si__traceV">{t.v}</div>
                    </React.Fragment>
                  ))}
                </div>
              </details>

              {/* Q&A (single question, deterministic) */}
              <details
                className="sf-si__qa"
                open={qaOpen}
                onToggle={(e) => setQaOpen((e.target as HTMLDetailsElement).open)}
              >
                <summary>Ask this scenario</summary>

                <div className="sf-si__qaRow">
                  <input
                    className="sf-si__qaInput"
                    type="text"
                    value={question}
                    placeholder="Ask one precise question (runway, growth, risk, lever impact)"
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        (e.currentTarget.parentElement?.querySelector("button") as HTMLButtonElement | null)?.click();
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="sf-si__qaBtn"
                    disabled={!hasEngineOutput}
                    onClick={() => {
                      setAnswer(
                        qaAnswer(question, {
                          scenarioLabel: view.scenarioLabel,
                          bands: view.bands,
                          activeLeverId: activeLeverId ?? null,
                        })
                      );
                    }}
                  >
                    Ask
                  </button>
                </div>

                <div className="sf-si__qaAnswer" aria-live="polite">
                  {panelState === "READY" ? (
                    <div className="sf-si__qaHint">
                      Ask one question. You’ll get a short, investor-safe answer (no numbers).
                    </div>
                  ) : answer ? (
                    <>
                      <div className="sf-si__qaHeadline">{answer.headline}</div>

                      <ul className="sf-si__qaBullets">
                        {answer.bullets.slice(0, 6).map((b, i) => (
                          <li key={i}>{b}</li>
                        ))}
                      </ul>

                      <div className="sf-si__qaData">
                        <span className="sf-si__qaDataK">Data used:</span>{" "}
                        <span className="sf-si__qaDataV">{answer.dataUsed.length ? answer.dataUsed.join(", ") : "—"}</span>
                      </div>

                      <div className="sf-si__qaActions">
                        <button
                          type="button"
                          className="sf-si__qaBtn sf-si__qaBtn--secondary"
                          disabled={!answer}
                          title="Save this Q&A to Scenario Notes"
                          onClick={() => {
                            const payload = toDeterministicNotePayload({ answer, view });
                            saveScenarioQaNote({
                              scenarioId: activeScenarioId,
                              question,
                              compareToBase: compareToBaseQa,
                              openai: payload as unknown as OpenAIScenarioQaResponse,
                            });
                            setSavedNonce((n) => n + 1);
                            setSavedAt(Date.now());
                          }}
                        >
                          Save to Notes
                        </button>

                        <div className="sf-si__qaSaved" aria-live="polite">
                          {panelState === "SAVED" ? "Saved to Notes" : savedNonce > 0 ? "Saved" : ""}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="sf-si__qaHint">Ask one question. One answer. No history.</div>
                  )}
                </div>
              </details>
            </>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}


