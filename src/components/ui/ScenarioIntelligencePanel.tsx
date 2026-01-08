// src/components/ui/ScenarioIntelligencePanel.tsx
// STRATFIT — Scenario Intelligence (SAFE MVP, deterministic)
// UI polish + structure only. No OpenAI calls. No engine math changes.

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useScenarioStore } from "@/state/scenarioStore";

type TabKey = "brief" | "risk" | "questions";

type KpiLike = { id: string; label?: string; value?: number; display?: string };

type QaAnswer = {
  headline: string;
  bullets: string[];
  confidence: "High" | "Medium" | "Low";
  dataUsed: string[];
};

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function safeNum(v: unknown) {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function getKpi(kpis: KpiLike[] | undefined, id: string) {
  return (kpis ?? []).find((k) => k.id === id);
}

function bandRisk(riskIndex: number) {
  // deterministic banding – no math changes, just categorisation
  if (riskIndex >= 75) return { label: "CRITICAL", tone: "bad" as const };
  if (riskIndex >= 55) return { label: "ELEVATED", tone: "warn" as const };
  if (riskIndex >= 35) return { label: "WATCH", tone: "watch" as const };
  return { label: "CONTAINED", tone: "good" as const };
}

function bandRunway(runwayMonths: number) {
  if (runwayMonths >= 18) return { label: "STRONG", tone: "good" as const };
  if (runwayMonths >= 12) return { label: "STABLE", tone: "watch" as const };
  if (runwayMonths >= 6) return { label: "TIGHT", tone: "warn" as const };
  return { label: "CRITICAL", tone: "bad" as const };
}

function bandGrowth(arrGrowthPct: number) {
  if (arrGrowthPct >= 30) return { label: "ACCELERATING", tone: "good" as const };
  if (arrGrowthPct >= 12) return { label: "HEALTHY", tone: "watch" as const };
  if (arrGrowthPct >= 0) return { label: "FLAT", tone: "warn" as const };
  return { label: "DECLINING", tone: "bad" as const };
}

/**
 * Typewriter that feels like "progressive disclosure", not chat.
 * - No caret
 * - No jitter re-trigger
 * - Word-cluster pacing derived from character count
 */
function TypewriterMemo({
  text,
  playKey,
}: {
  text: string;
  playKey: string;
}) {
  const [out, setOut] = useState("");
  const raf = useRef<number | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (raf.current) cancelAnimationFrame(raf.current);
    if (timer.current) window.clearTimeout(timer.current);

    const full = text ?? "";
    if (!full.trim()) {
      setOut("");
      return;
    }

    // Tokenise into word-ish chunks incl spaces to keep natural wrapping
    const tokens = full.match(/\S+\s*/g) ?? [full];

    let i = 0;
    setOut("");

    const step = () => {
      if (i >= tokens.length) return;

      const t = tokens[i] ?? "";
      i += 1;

      setOut((prev) => prev + t);

      // timing: ~24ms per char, capped, with punctuation pause
      const chars = t.length;
      const base = clamp(chars * 24, 45, 220);

      const punct = /[.:;!?—]\s*$/.test(t) ? 190 : 0;
      const para = /\n\s*\n/.test(t) ? 340 : 0;

      timer.current = window.setTimeout(() => {
        raf.current = requestAnimationFrame(step);
      }, base + punct + para);
    };

    raf.current = requestAnimationFrame(step);

    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      if (timer.current) window.clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playKey]);

  return <div className="sf-si__tw">{out}</div>;
}

function qaAnswer(
  question: string,
  ctx: { scenarioLabel: string; bands: Record<string, string>; activeLeverId: string | null }
): QaAnswer {
  // SAFE MVP: deterministic, short, investor-safe.
  const q = (question ?? "").trim().toLowerCase();

  const used = ["runway", "riskIndex", "arrGrowthPct", "burnQuality"].filter(Boolean);

  if (!q) {
    return {
      headline: "Ask a question",
      bullets: ["Use one prompt at a time. Answers are deterministic and investor-safe."],
      confidence: "High",
      dataUsed: used,
    };
  }

  // tiny deterministic routing
  if (q.includes("risk")) {
    return {
      headline: "Risk posture",
      bullets: [
        "Risk posture is driven by the current configuration and observed stress signals.",
        `Current band: ${ctx.bands.risk}.`,
        "Priority is to keep risk contained while improving runway and execution confidence.",
      ],
      confidence: "High",
      dataUsed: used,
    };
  }

  if (q.includes("runway") || q.includes("cash")) {
    return {
      headline: "Runway focus",
      bullets: [
        `Runway band: ${ctx.bands.runway}.`,
        "The fastest improvement comes from burn efficiency and execution discipline.",
        "Avoid changes that trade runway for fragile growth.",
      ],
      confidence: "High",
      dataUsed: used,
    };
  }

  return {
    headline: "Executive answer",
    bullets: [
      "This answer is based on the current operating configuration and core signals.",
      `Scenario: ${ctx.scenarioLabel}.`,
      "If you want a different lens, switch to Risk Map or refine the prompt.",
    ],
    confidence: "Medium",
    dataUsed: used,
  };
}

export function ScenarioIntelligencePanel() {
  const {
    activeScenarioId,
    activeLeverId,
    engineResults,
  } = useScenarioStore(
    useShallow((s) => ({
      activeScenarioId: s.activeScenarioId,
      activeLeverId: s.activeLeverId,
      engineResults: s.engineResults,
    }))
  );

  const [tab, setTab] = useState<TabKey>("brief");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<QaAnswer | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  // deterministic re-type trigger: scenario + a small signal fingerprint
  const current = engineResults?.[activeScenarioId];
  const kpis = useMemo((): KpiLike[] => {
    const raw = (current as any)?.kpis;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw as KpiLike[];

    // Store contract: kpis is a map (id -> { value, display, ... }). Normalize to array.
    if (typeof raw === "object") {
      return Object.entries(raw as Record<string, any>).map(([id, v]) => ({
        id,
        ...(v ?? {}),
      }));
    }

    return [];
  }, [current]);

  const runwayK = getKpi(kpis, "runway");
  const riskK = getKpi(kpis, "riskIndex");
  const growthK = getKpi(kpis, "arrGrowthPct");
  const burnK = getKpi(kpis, "burnQuality");
  const cashK = getKpi(kpis, "cashPosition");

  const runwayV = safeNum(runwayK?.value);
  const riskV = safeNum(riskK?.value);
  const growthV = safeNum(growthK?.value);

  const bands = useMemo(() => {
    const r = bandRisk(riskV).label;
    const rw = bandRunway(runwayV).label;
    const g = bandGrowth(growthV).label;
    const b = burnK?.display ? String(burnK.display) : "—";
    return {
      risk: r,
      runway: rw,
      growth: g,
      burn: b,
    };
  }, [riskV, runwayV, growthV, burnK?.display]);

  const playKey = useMemo(() => {
    const fp = [
      activeScenarioId,
      Math.round(runwayV),
      Math.round(riskV),
      Math.round(growthV),
    ].join("|");
    return fp;
  }, [activeScenarioId, runwayV, riskV, growthV]);

  const view = useMemo(() => {
    const riskBand = bandRisk(riskV);
    const runwayBand = bandRunway(runwayV);
    const growthBand = bandGrowth(growthV);

    // Executive brief: deterministic, memo-grade, 3 lines max
    const brief: string[] = [
      `Overall posture is ${riskBand.label.toLowerCase()} with runway ${runwayBand.label.toLowerCase()} and growth ${growthBand.label.toLowerCase()}.`,
      "Primary focus is preserving stability while improving execution confidence and burn efficiency.",
      "Avoid moves that improve optics but increase fragility or compress runway.",
    ];

    return {
      scenarioLabel: String(activeScenarioId).toUpperCase(),
      status: activeLeverId ? "LIVE" : "SYNCED",
      kpi: {
        cash: cashK?.display ?? "—",
        runway: runwayK?.display ?? "—",
        risk: riskK?.display ?? "—",
        growth: growthK?.display ?? "—",
        burn: burnK?.display ?? "—",
      },
      bands: {
        risk: riskBand.label,
        runway: runwayBand.label,
        growth: growthBand.label,
      },
      brief,
      trace: [
        { k: "runway", v: runwayK?.display ?? "—" },
        { k: "riskIndex", v: riskK?.display ?? "—" },
        { k: "arrGrowthPct", v: growthK?.display ?? "—" },
        { k: "burnQuality", v: burnK?.display ?? "—" },
      ],
    };
  }, [activeScenarioId, activeLeverId, burnK?.display, cashK?.display, growthK?.display, riskK?.display, runwayK?.display, riskV, runwayV, growthV]);

  useEffect(() => {
    if (!savedAt) return;
    const t = window.setTimeout(() => setSavedAt(null), 2200);
    return () => window.clearTimeout(t);
  }, [savedAt]);

  const hasEngineOutput = Boolean(current?.kpis?.length);

  return (
    <div className="sf-si sf-si--scenario">
      <div className="sf-si__bezel">
        {/* Header */}
        <div className="sf-si__header">
          <div className="sf-si__titleRow">
            <div className="sf-si__title">Scenario Intelligence</div>
            <span className={`sf-si__status sf-si__status--${view.status === "LIVE" ? "live" : "synced"}`}>
              {view.status}
            </span>
          </div>
          <div className="sf-si__meta">
            <span className="sf-si__tag">{view.scenarioLabel}</span>
            <span className="sf-si__sep">·</span>
            <span className="sf-si__pill">{bands.risk}</span>
            <span className="sf-si__sep">·</span>
            <span className="sf-si__muted">Deterministic · investor-safe</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="sf-si__tabs" role="tablist" aria-label="Scenario Intelligence Tabs">
          <button
            type="button"
            className={`sf-si__tab ${tab === "brief" ? "is-active" : ""}`}
            onClick={() => setTab("brief")}
            role="tab"
            aria-selected={tab === "brief"}
          >
            Brief
          </button>
          <button
            type="button"
            className={`sf-si__tab ${tab === "risk" ? "is-active" : ""}`}
            onClick={() => setTab("risk")}
            role="tab"
            aria-selected={tab === "risk"}
          >
            Risk Map
          </button>
          <button
            type="button"
            className={`sf-si__tab ${tab === "questions" ? "is-active" : ""}`}
            onClick={() => setTab("questions")}
            role="tab"
            aria-selected={tab === "questions"}
          >
            Questions
          </button>
        </div>

        {/* Body */}
        <div className={`sf-si__body ${tab === "brief" ? "sf-si__body--noScroll" : ""}`}>
          {/* TAB: BRIEF */}
          {tab === "brief" && (
            <div className="sf-si__pane sf-si__pane--brief">
              <div className="sf-si__briefCard">
                <div className="sf-si__h2">Executive Brief</div>
                <div className="sf-si__divider" />

                <TypewriterMemo text={view.brief.join(" ")} playKey={playKey} />

                <div className="sf-si__assumptions">
                  Under current operating assumptions
                </div>
              </div>

              <div className="sf-si__signals">
                <div className="sf-si__h2">Signals</div>
                <div className="sf-si__divider" />
                <div className="sf-si__signalGrid">
                  <div className="sf-si__signalRow">
                    <div className="sf-si__signalK">Financial</div>
                    <div className="sf-si__signalV">{view.bands.runway}</div>
                  </div>
                  <div className="sf-si__signalRow">
                    <div className="sf-si__signalK">Growth</div>
                    <div className="sf-si__signalV">{view.bands.growth}</div>
                  </div>
                  <div className="sf-si__signalRow">
                    <div className="sf-si__signalK">Risk</div>
                    <div className="sf-si__signalV">{view.bands.risk}</div>
                  </div>
                  <div className="sf-si__signalRow">
                    <div className="sf-si__signalK">Burn quality</div>
                    <div className="sf-si__signalV">{bands.burn}</div>
                  </div>
                </div>
              </div>

              {/* Terrain anchor placeholder — we will connect the dot in Phase 1.5 */}
              <div className="sf-si__terrain">
                <div className="sf-si__terrainTop">
                  <div className="sf-si__terrainTitle">Terrain Anchor</div>
                  <div className="sf-si__terrainSub">Single point · current position</div>
                </div>
                <div className="sf-si__terrainLine">
                  <span className="sf-si__terrainDot" aria-hidden="true" />
                  <span className="sf-si__terrainText">
                    Current configuration places the business in <b>{view.bands.risk.toLowerCase()}</b> terrain with runway <b>{view.bands.runway.toLowerCase()}</b>.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB: RISK MAP */}
          {tab === "risk" && (
            <div className="sf-si__pane sf-si__pane--scroll">
              <div className="sf-si__h2">Risk Map</div>
              <div className="sf-si__divider" />

              {/* Placeholder containers wired to existing KPIs (math formalisation is Phase 2) */}
              <div className="sf-si__riskCards">
                <div className="sf-si__riskCard">
                  <div className="sf-si__riskK">Risk posture</div>
                  <div className="sf-si__riskV">{view.kpi.risk}</div>
                  <div className="sf-si__riskBand">{view.bands.risk}</div>
                </div>
                <div className="sf-si__riskCard">
                  <div className="sf-si__riskK">Runway</div>
                  <div className="sf-si__riskV">{view.kpi.runway}</div>
                  <div className="sf-si__riskBand">{view.bands.runway}</div>
                </div>
                <div className="sf-si__riskCard">
                  <div className="sf-si__riskK">ARR growth</div>
                  <div className="sf-si__riskV">{view.kpi.growth}</div>
                  <div className="sf-si__riskBand">{view.bands.growth}</div>
                </div>
              </div>

              <details className="sf-si__trace">
                <summary>Traceability</summary>
                <div className="sf-si__traceGrid">
                  {view.trace.map((t) => (
                    <React.Fragment key={t.k}>
                      <div className="sf-si__traceK">{t.k}</div>
                      <div className="sf-si__traceV">{t.v}</div>
                    </React.Fragment>
                  ))}
                </div>
              </details>
            </div>
          )}

          {/* TAB: QUESTIONS */}
          {tab === "questions" && (
            <div className="sf-si__pane sf-si__pane--scroll">
              <div className="sf-si__h2">Questions</div>
              <div className="sf-si__divider" />

              <div className="sf-si__qa">
                <div className="sf-si__qaRow">
                  <input
                    className="sf-si__qaInput"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Ask one question (deterministic)…"
                    disabled={!hasEngineOutput}
                  />
                  <button
                    type="button"
                    className="sf-si__qaBtn"
                    disabled={!hasEngineOutput}
                    onClick={() => {
                      const a = qaAnswer(question, {
                        scenarioLabel: view.scenarioLabel,
                        bands: bands,
                        activeLeverId: activeLeverId ?? null,
                      });
                      setAnswer(a);
                    }}
                  >
                    Answer
                  </button>
                </div>

                {!hasEngineOutput ? (
                  <div className="sf-si__qaHint">No scenario output yet. Move a lever or load a scenario.</div>
                ) : !answer ? (
                  <div className="sf-si__qaHint">Ask one question. One answer. No history.</div>
                ) : (
                  <div className="sf-si__qaAnswer" aria-live="polite">
                    <div className="sf-si__qaHeadline">{answer.headline}</div>
                    <ul className="sf-si__qaBullets">
                      {answer.bullets.map((b, i) => (
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
                        onClick={() => {
                          try {
                            navigator.clipboard.writeText(
                              [answer.headline, ...answer.bullets.map((x) => `- ${x}`)].join("\n")
                            );
                            setSavedAt("Copied");
                          } catch {
                            setSavedAt("Copy failed");
                          }
                        }}
                      >
                        Copy
                      </button>
                      <button
                        type="button"
                        className="sf-si__qaBtn sf-si__qaBtn--secondary"
                        onClick={() => {
                          setAnswer(null);
                          setQuestion("");
                        }}
                      >
                        Clear
                      </button>
                      {savedAt ? <span className="sf-si__qaSaved">{savedAt}</span> : null}
                    </div>
                  </div>
                )}
              </div>

              {/* We expand the prompt library in Phase 3 */}
              <div className="sf-si__promptHint">
                Prompt library expansion is next (grouped executive prompts).
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
