// src/components/ui/ScenarioIntelligencePanel.tsx
// STRATFIT — Scenario Intelligence (SAFE MVP, deterministic)
// No AI calls. No animation. No engine math changes. UI + wiring only.

import React, { useMemo, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useScenarioStore } from "@/state/scenarioStore";
import { askScenarioOpenAI } from "@/utils/openaiScenarioQa";
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

function sign(n: number) {
  return n > 0 ? "+" : n < 0 ? "−" : "";
}

function fmtDeltaInt(n: number, suffix: string) {
  return `${sign(n)}${Math.abs(Math.round(n))}${suffix}`;
}

function riskBand(score01_100: number | null): "LOW" | "MED" | "HIGH" | "CRIT" | "—" {
  if (score01_100 === null) return "—";
  if (score01_100 >= 80) return "CRIT";
  if (score01_100 >= 65) return "HIGH";
  if (score01_100 >= 45) return "MED";
  return "LOW";
}

type QaAnswer =
  | { supported: true; headline: string; lines: string[]; dataUsed: string[] }
  | { supported: false; headline: string; lines: string[]; dataUsed: string[] };

function normQ(q: string) {
  return q.trim().toLowerCase();
}

function hasAny(q: string, words: string[]) {
  return words.some((w) => q.includes(w));
}

function fmtDeltaCompact(n: number | null, suffix: string) {
  if (n === null || !Number.isFinite(n)) return "—";
  return `${sign(n)}${Math.abs(n).toFixed(0)}${suffix}`;
}

function qaAnswer(question: string, ctx: {
  scenarioLabel: string;
  runway: Kpi | null;
  cash: Kpi | null;
  burn: Kpi | null;
  risk: Kpi | null;
  arrGrowthPct: Kpi | null;
  arrDelta: Kpi | null;
  runwayDelta: number | null;
  cashDelta: number | null;
  riskDelta: number | null;
  arrPctDelta: number | null;
  activeLeverId: string | null;
  leverIntensity01: number | null;
}): QaAnswer {
  const q = normQ(question);
  if (!q) {
    return {
      supported: false,
      headline: "Enter a question",
      lines: ["Type one precise question about the current scenario."],
      dataUsed: [],
    };
  }

  // Pattern routing (phase 1 — deterministic)
  const isStress = hasAny(q, ["stress", "break", "breaking", "downside", "extreme", "crash"]);
  const isRunwayCash = hasAny(q, ["runway", "cash", "liquidity", "burn"]);
  const isRisk = hasAny(q, ["risk", "fragile", "volatility", "execution"]);
  const isSensitivity = hasAny(q, ["sensitivity", "impact", "lever", "driver", "what moved", "why"]);

  const runwayV = safeNum(ctx.runway?.value);
  const cashV = safeNum(ctx.cash?.value);
  const riskV = safeNum(ctx.risk?.value);
  const riskState = riskBand(riskV);

  if (isStress) {
    const headline = `Stress posture — ${ctx.scenarioLabel}`;
    const lines = [
      `Runway: ${ctx.runway?.display ?? "—"}${ctx.runwayDelta !== null ? ` (${fmtDeltaInt(ctx.runwayDelta, "mo")} vs Base)` : ""}.`,
      `ARR Growth: ${ctx.arrGrowthPct?.display ?? "—"} (Δ ARR ${ctx.arrDelta?.display ?? "—"}).`,
      `Risk: ${ctx.risk?.display ?? "—"} (state ${riskState})${ctx.riskDelta !== null ? ` (${fmtDeltaInt(ctx.riskDelta, "")} vs Base)` : ""}.`,
    ];
    return {
      supported: true,
      headline,
      lines,
      dataUsed: ["runway", "arrGrowthPct", "arrDelta", "riskIndex", "Δ vs base (if available)"],
    };
  }

  if (isRunwayCash) {
    const headline = `Liquidity — ${ctx.scenarioLabel}`;
    const lines = [
      `Runway: ${ctx.runway?.display ?? "—"}${ctx.runwayDelta !== null ? ` (${fmtDeltaInt(ctx.runwayDelta, "mo")} vs Base)` : ""}.`,
      `Cash: ${ctx.cash?.display ?? "—"}${ctx.cashDelta !== null ? ` (${sign(ctx.cashDelta)}$${Math.abs(ctx.cashDelta / 1_000_000).toFixed(2)}M vs Base)` : ""}.`,
      `Burn: ${ctx.burn?.display ?? "—"} (proxy).`,
    ];
    return {
      supported: true,
      headline,
      lines,
      dataUsed: ["runway", "cashPosition", "burnQuality", "Δ vs base (if available)"],
    };
  }

  if (isRisk) {
    const headline = `Risk — ${ctx.scenarioLabel}`;
    const lines = [
      `Risk score: ${ctx.risk?.display ?? "—"} (state ${riskState})${ctx.riskDelta !== null ? ` (${fmtDeltaInt(ctx.riskDelta, "")} vs Base)` : ""}.`,
      `Runway: ${ctx.runway?.display ?? "—"} · ARR Growth: ${ctx.arrGrowthPct?.display ?? "—"}.`,
    ];
    return {
      supported: true,
      headline,
      lines,
      dataUsed: ["riskIndex", "runway", "arrGrowthPct", "Δ vs base (if available)"],
    };
  }

  if (isSensitivity) {
    const headline = `Sensitivity — ${ctx.scenarioLabel}`;
    if (!ctx.activeLeverId || ctx.leverIntensity01 === null) {
      return {
        supported: true,
        headline,
        lines: [
          "No lever is currently active.",
          "Drag a lever to see LIVE status, then ask again (e.g. “impact of this lever on runway”).",
        ],
        dataUsed: ["activeLeverId", "leverIntensity01"],
      };
    }

    const intensityPct = Math.round(ctx.leverIntensity01 * 100);
    return {
      supported: true,
      headline,
      lines: [
        `Active lever: ${ctx.activeLeverId} (intensity ${intensityPct}%).`,
        `Current: Runway ${ctx.runway?.display ?? "—"} · Cash ${ctx.cash?.display ?? "—"} · Risk ${ctx.risk?.display ?? "—"}.`,
      ],
      dataUsed: ["activeLeverId", "leverIntensity01", "runway", "cashPosition", "riskIndex"],
    };
  }

  // Fail gracefully
  return {
    supported: false,
    headline: "Not supported",
    lines: ["This question type is not supported yet."],
    dataUsed: [],
  };
}

export default function ScenarioIntelligencePanel() {
  const { activeScenarioId, current, base, activeLeverId, leverIntensity01 } = useScenarioStore(
    useShallow((s) => {
      const current = s.engineResults?.[s.activeScenarioId];
      const base = s.engineResults?.["base"];
      return {
        activeScenarioId: s.activeScenarioId,
        current,
        base,
        activeLeverId: s.activeLeverId,
        leverIntensity01: s.leverIntensity01,
      };
    })
  );

  const [qaOpen, setQaOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<QaAnswer | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const askSeqRef = useRef(0);
  const [compareToBaseQa, setCompareToBaseQa] = useState(false); // OFF by default (locked)
  const [aiJson, setAiJson] = useState<OpenAIScenarioQaResponse | null>(null);
  const [savedNonce, setSavedNonce] = useState(0);

  const view = useMemo(() => {
    const runway = getKpi(current, "runway");
    const arrGrowthPct = getKpi(current, "arrGrowthPct");
    const arrDelta = getKpi(current, "arrDelta");
    const risk = getKpi(current, "riskIndex");
    const cash = getKpi(current, "cashPosition");
    const burn = getKpi(current, "burnQuality");

    const runwayBase = getKpi(base, "runway");
    const arrGrowthPctBase = getKpi(base, "arrGrowthPct");
    const riskBase = getKpi(base, "riskIndex");
    const cashBase = getKpi(base, "cashPosition");

    const runwayV = safeNum(runway?.value);
    const riskV = safeNum(risk?.value);
    const cashV = safeNum(cash?.value);
    const runwayDelta = activeScenarioId !== "base" && runwayV !== null && runwayBase ? runwayV - runwayBase.value : null;
    const riskDelta = activeScenarioId !== "base" && riskV !== null && riskBase ? riskV - riskBase.value : null;
    const cashDelta = activeScenarioId !== "base" && cashV !== null && cashBase ? cashV - cashBase.value : null;

    const arrPctV = safeNum(arrGrowthPct?.value);
    const arrPctDelta =
      activeScenarioId !== "base" && arrPctV !== null && arrGrowthPctBase && safeNum(arrGrowthPctBase.value) !== null
        ? arrPctV - arrGrowthPctBase.value
        : null;

    // Situation brief (2–3 lines, deterministic; runway + ARR growth + risk)
    const brief: string[] = [];
    const line1 = [
      `Runway ${runway?.display ?? "—"}${runwayDelta !== null ? ` (${fmtDeltaInt(runwayDelta, "mo")} vs Base)` : ""}`,
      `ARR Growth ${arrGrowthPct?.display ?? "—"}${arrDelta?.display ? ` (Δ ARR ${arrDelta.display})` : ""}`,
      `Risk ${risk?.display ?? "—"}${riskDelta !== null ? ` (${fmtDeltaInt(riskDelta, "")} vs Base)` : ""}`,
    ].join(" · ");
    brief.push(line1);

    if (activeScenarioId !== "base" && (arrPctDelta !== null || runwayDelta !== null || riskDelta !== null)) {
      const parts: string[] = [];
      if (runwayDelta !== null) parts.push(`Runway ${fmtDeltaInt(runwayDelta, "mo")}`);
      if (arrPctDelta !== null) parts.push(`ARR Growth ${fmtDeltaInt(arrPctDelta * 100, "%")}`);
      if (riskDelta !== null) parts.push(`Risk ${fmtDeltaInt(riskDelta, "")}`);
      brief.push(`Delta drivers: ${parts.join(" · ")}`);
    }

    // Signals (3 tiles, aligned)
    const riskBandLabel = riskBand(riskV);

    // Action signals (exactly 2–3, deterministic ordering)
    const actions: string[] = [];
    if (runwayV !== null && runwayV < 12) actions.push("Cut burn to extend runway beyond 12 months.");
    else if (runwayV !== null && runwayV < 18) actions.push("Tighten burn to reach 18+ months of runway.");

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
    if (runwayDelta !== null) traceItems.push({ k: "Δ runway vs base", v: fmtDeltaInt(runwayDelta, "mo") });
    if (arrPctDelta !== null) traceItems.push({ k: "Δ ARR growth vs base", v: fmtDeltaInt(arrPctDelta * 100, "%") });
    if (riskDelta !== null) traceItems.push({ k: "Δ risk vs base", v: fmtDeltaInt(riskDelta, "") });

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
      deltas: { runwayDelta, cashDelta, riskDelta, arrPctDelta },
    };
  }, [activeLeverId, activeScenarioId, base, current]);

  return (
    <div className="cold-panel sf-si">
      {/* 1) Header */}
      <div className="sf-si__header">
        <div>
          <div className="sf-si__title">Scenario Intelligence</div>
          <div className="sf-si__meta">
            <span className="sf-si__status">
              <span className="sf-si__dot" aria-hidden="true" />
              {view.status}
            </span>
            <span className="sf-si__sep">·</span>
            <span className="sf-si__tag">{view.scenarioLabel}</span>
          </div>
        </div>
      </div>

      {/* 2) Situation Brief */}
      <div className="sf-si__section">
        <div className="sf-si__kicker">Situation Brief</div>
        <div className="sf-si__brief">
          {view.brief.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </div>
      </div>

      {/* 3) Signal Tiles (3) */}
      <div className="sf-si__section">
        <div className="sf-si__kicker">Signals</div>
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
        <div className="sf-si__kicker">Action Signals</div>
        <ul className="sf-si__actions">
          {view.actions.map((a, i) => (
            <li key={i}>{a}</li>
          ))}
        </ul>
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

      {/* Q&A (controlled, single-question) — collapsed by default */}
      <details className="sf-si__qa" open={qaOpen} onToggle={(e) => setQaOpen((e.target as HTMLDetailsElement).open)}>
        <summary>Ask this scenario</summary>
        <div className="sf-si__qaRow">
          <label className="sf-si__qaToggle" title="When enabled, answers reference differences vs Base scenario">
            <span className="sf-si__qaToggleLabel">Compare to Base</span>
            <span className={`sf-si__qaSwitch ${compareToBaseQa ? "on" : ""}`} aria-hidden="true">
              <span className="sf-si__qaSwitchKnob" />
            </span>
            <input
              className="sr-only"
              type="checkbox"
              checked={compareToBaseQa}
              onChange={(e) => setCompareToBaseQa(e.target.checked)}
            />
          </label>
          <input
            className="sf-si__qaInput"
            type="text"
            value={question}
            placeholder="Ask one precise question (e.g. “runway risk under downside?”)"
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                // handled by the Ask button click for consistency
                (e.currentTarget.parentElement?.querySelector("button") as HTMLButtonElement | null)?.click();
              }
            }}
          />
          <button
            type="button"
            className="sf-si__qaBtn"
            disabled={aiLoading}
            onClick={() => {
              const seq = ++askSeqRef.current;
              const compareToBase = compareToBaseQa === true;
              const deterministic = () =>
                qaAnswer(question, {
                  scenarioLabel: view.scenarioLabel,
                  runway: view.kpis.runway,
                  cash: view.kpis.cash,
                  burn: view.kpis.burn,
                  risk: view.kpis.risk,
                  arrGrowthPct: view.kpis.arrGrowthPct,
                  arrDelta: view.kpis.arrDelta,
                  runwayDelta: view.deltas.runwayDelta,
                  cashDelta: view.deltas.cashDelta,
                  riskDelta: view.deltas.riskDelta,
                  arrPctDelta: view.deltas.arrPctDelta,
                  activeLeverId: activeLeverId ?? null,
                  leverIntensity01: typeof leverIntensity01 === "number" ? leverIntensity01 : null,
                });

              // AI attempt (safe): only after submit; UI stays stable; deterministic fallback on any failure.
              setAiLoading(true);
              setAiJson(null);
              setAnswer({
                supported: true,
                headline: "Analyzing",
                lines: ["Computing answer from current scenario metrics…"],
                dataUsed: [],
              });

              askScenarioOpenAI({
                userQuestion: question,
                activeScenario: view.scenarioLabel,
                engineResultsSnapshot: current?.kpis ?? {},
                baseScenarioResults: compareToBase ? base?.kpis ?? {} : undefined,
                compareToBase,
              })
                .then((ai) => {
                  if (askSeqRef.current !== seq) return;
                  if (!ai) {
                    setAiJson(null);
                    setAnswer(deterministic());
                    return;
                  }
                  setAiJson(ai);
                  setAnswer({
                    supported: true,
                    headline: ai.headline,
                    lines: [ai.answer, ai.drivers.length ? `Drivers: ${ai.drivers.join(" · ")}` : ""].filter(Boolean),
                    dataUsed: ai.key_metrics.map((m) => `${m.name}: ${m.value}`),
                  });
                })
                .catch(() => {
                  if (askSeqRef.current !== seq) return;
                  setAiJson(null);
                  setAnswer(deterministic());
                })
                .finally(() => {
                  if (askSeqRef.current !== seq) return;
                  setAiLoading(false);
                });
            }}
          >
            {aiLoading ? "…" : "Ask"}
          </button>
        </div>

        <div className="sf-si__qaAnswer" aria-live="polite">
          {answer ? (
            <>
              <div className="sf-si__qaHeadline">{answer.headline}</div>
              <div className="sf-si__qaBody">
                {answer.lines.map((l, i) => (
                  <div key={i}>{l}</div>
                ))}
              </div>
              <div className="sf-si__qaData">
                <span className="sf-si__qaDataK">Data used:</span>{" "}
                <span className="sf-si__qaDataV">{answer.dataUsed.length ? answer.dataUsed.join(", ") : "—"}</span>
              </div>

              <div className="sf-si__qaActions">
                <button
                  type="button"
                  className="sf-si__qaBtn sf-si__qaBtn--secondary"
                  disabled={!aiJson || aiLoading}
                  title={aiJson ? "Save this Q&A to Scenario Notes" : "Only AI JSON answers can be saved"}
                  onClick={() => {
                    if (!aiJson) return;
                    saveScenarioQaNote({
                      scenarioId: activeScenarioId,
                      question,
                      compareToBase: compareToBaseQa === true,
                      openai: aiJson,
                    });
                    setSavedNonce((n) => n + 1);
                  }}
                >
                  Save to Notes
                </button>
                <div className="sf-si__qaSaved" aria-live="polite">
                  {savedNonce > 0 ? "Saved" : ""}
                </div>
              </div>
            </>
          ) : (
            <div className="sf-si__qaHint">One question. One answer. No history.</div>
          )}
        </div>
      </details>
    </div>
  );
}


