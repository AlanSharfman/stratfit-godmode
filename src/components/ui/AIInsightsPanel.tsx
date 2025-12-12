import { useEffect, useMemo, useRef, useState } from "react";
import type { ScenarioId } from "@/dashboardConfig";

type FooterMetric = { label: string; value: string };

export type InsightsPayload = {
  title: string;
  subtitle?: string;
  scenarioLabel: string;
  scenarioKey: ScenarioId;
  body: string;
  bullets: string[];
  tags?: string[];
  footerMetrics?: FooterMetric[];
};

type Props = {
  scenario: ScenarioId;
  insights: InsightsPayload;
};

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(!!mq.matches);
    apply();
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
  }, []);

  return reduced;
}

/**
 * Premium panel structure (locked):
 * - Header: fixed
 * - Narrative: scrolls independently (typewriter runs here)
 * - Results footer: pinned and ALWAYS visible (never unmounts)
 *
 * Key stability rules:
 * - Never conditionally mount/unmount the footer
 * - Explicit shrink-0 for header/footer
 * - min-h-0 on the scrollable middle region
 * - overflow-hidden at the panel boundary to prevent sibling influence
 */
export default function AIInsightsPanel({ scenario, insights }: Props) {
  const prefersReducedMotion = usePrefersReducedMotion();

  const script = useMemo(() => {
    const body = insights.body ?? "";
    const bullets = Array.isArray(insights.bullets) ? insights.bullets : [];
    return { body, bullets };
  }, [insights.body, insights.bullets]);

  const footerMetrics: FooterMetric[] = useMemo(() => {
    const fm = insights.footerMetrics;
    return Array.isArray(fm) ? fm : [];
  }, [insights.footerMetrics]);

  // Typed output state
  const [typedBody, setTypedBody] = useState("");
  const [typedBullets, setTypedBullets] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  // Cancel tokens + timers
  const runIdRef = useRef(0);
  const timerRef = useRef<number | null>(null);

  const clearTimer = () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  // Typewriter runner
  useEffect(() => {
    clearTimer();
    runIdRef.current += 1;
    const runId = runIdRef.current;

    if (prefersReducedMotion) {
      setIsTyping(false);
      setTypedBody(script.body);
      setTypedBullets([...script.bullets]);
      return;
    }

    setIsTyping(true);
    setTypedBody("");
    setTypedBullets(script.bullets.map(() => ""));

    const body = script.body;
    const bullets = script.bullets;

    const BODY_CPS = 60;
    const BULLET_CPS = 70;
    const PAUSE_BETWEEN_SECTIONS_MS = 120;
    const PAUSE_BETWEEN_BULLETS_MS = 120;

    let phase: "body" | "bullets" = "body";
    let bodyIdx = 0;

    let bulletIdx = 0;
    let bulletCharIdx = 0;

    const stepChars = (cps: number) => Math.max(1, Math.floor(cps / 20)); // 50ms ticks

    const tick = () => {
      if (runIdRef.current !== runId) return;

      if (phase === "body") {
        bodyIdx = Math.min(body.length, bodyIdx + stepChars(BODY_CPS));
        setTypedBody(body.slice(0, bodyIdx));

        if (bodyIdx >= body.length) {
          phase = "bullets";
          timerRef.current = window.setTimeout(tick, PAUSE_BETWEEN_SECTIONS_MS);
          return;
        }

        timerRef.current = window.setTimeout(tick, 50);
        return;
      }

      // bullets
      if (bulletIdx >= bullets.length) {
        setIsTyping(false);
        return;
      }

      const current = bullets[bulletIdx] ?? "";
      bulletCharIdx = Math.min(
        current.length,
        bulletCharIdx + stepChars(BULLET_CPS)
      );

      setTypedBullets((prev) => {
        const next = [...prev];
        next[bulletIdx] = current.slice(0, bulletCharIdx);
        return next;
      });

      if (bulletCharIdx >= current.length) {
        bulletIdx += 1;
        bulletCharIdx = 0;
        timerRef.current = window.setTimeout(tick, PAUSE_BETWEEN_BULLETS_MS);
        return;
      }

      timerRef.current = window.setTimeout(tick, 50);
    };

    tick();

    return () => clearTimer();
  }, [scenario, script.body, script.bullets, prefersReducedMotion]);

  // Which bullet is currently typing (for synced caret)
  const typingBulletIndex = useMemo(() => {
    if (!isTyping) return -1;
    for (let i = 0; i < script.bullets.length; i++) {
      const target = script.bullets[i] ?? "";
      const current = typedBullets[i] ?? "";
      if (current.length < target.length) return i;
    }
    return -1;
  }, [isTyping, script.bullets, typedBullets]);

  const footerTiles = useMemo(() => {
    // We render a stable 6-tile grid always.
    // If metrics are missing, we keep placeholders so footer never collapses.
    const wanted = 6;
    const src = footerMetrics.slice(0, wanted);
    if (src.length >= wanted) return src;
    const pad: FooterMetric[] = [];
    for (let i = src.length; i < wanted; i++) {
      pad.push({ label: "—", value: "—" });
    }
    return [...src, ...pad];
  }, [footerMetrics]);

  const footerHasRealData = footerMetrics.length > 0;

  return (
    <section
      className="h-full w-full rounded-2xl border overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, rgba(10,22,40,0.92), rgba(7,14,26,0.92))",
        borderColor: "rgba(120, 190, 255, 0.18)",
        boxShadow: "0 18px 60px rgba(0,0,0,0.45)",
        // isolates panel layout/paint from affecting siblings (mountain stability)
        contain: "layout paint",
      }}
    >
      {/* 3-part layout */}
      <div className="h-full flex flex-col min-h-0">
        {/* HEADER (fixed) */}
        <header
          className="shrink-0 px-5 pt-5 pb-4 border-b"
          style={{ borderColor: "rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[13px] tracking-[0.18em] text-slate-300/80">
                {insights.title}
              </div>
              {insights.subtitle ? (
                <div className="mt-1 text-[13px] text-slate-200/85">
                  {insights.subtitle}
                </div>
              ) : null}
            </div>

            <div
              className="shrink-0 px-3 py-2 rounded-full text-[12px] font-semibold"
              style={{
                color: "rgba(255,255,255,0.92)",
                background: "rgba(120, 190, 255, 0.10)",
                border: "1px solid rgba(120, 190, 255, 0.22)",
                boxShadow: "0 0 20px rgba(120, 190, 255, 0.10)",
              }}
            >
              {insights.scenarioLabel}
            </div>
          </div>
        </header>

        {/* NARRATIVE (scrollable, typewriter lives here) */}
        <div className="flex-1 min-h-0 px-5 py-4 overflow-auto">
          <div
            className="rounded-xl border px-4 py-4"
            style={{
              borderColor: "rgba(255,255,255,0.07)",
              background: "rgba(255,255,255,0.03)",
            }}
          >
            {/* Intro */}
            <div className="text-[14px] leading-6 text-slate-100/95">
              {typedBody}
              {isTyping && typedBody.length < script.body.length ? (
                <span className="inline-block w-[10px] translate-y-[1px] opacity-80">
                  ▍
                </span>
              ) : null}
            </div>

            {/* Bullets */}
            <div className="mt-4 space-y-3">
              {script.bullets.map((_, i) => {
                const text = typedBullets[i] ?? "";
                const started = text.length > 0;

                return (
                  <div key={i} className="flex gap-3">
                    <div className="pt-[8px] w-3 flex items-start justify-center">
                      <div
                        className="w-[6px] h-[6px] rounded-full transition-opacity"
                        style={{
                          opacity: started ? 1 : 0,
                          background: "rgba(56, 189, 248, 0.95)",
                          boxShadow: "0 0 12px rgba(56, 189, 248, 0.65)",
                        }}
                      />
                    </div>
                    <div className="text-[14px] leading-6 text-slate-100/90">
                      {text}
                      {isTyping && typingBulletIndex === i ? (
                        <span className="inline-block w-[10px] translate-y-[1px] opacity-70">
                          ▍
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tags (kept in narrative area so footer can be purely “results”) */}
          {insights.tags && insights.tags.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {insights.tags.map((t) => (
                <span
                  key={t}
                  className="px-3 py-1 rounded-full text-[12px] text-slate-100/90"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        {/* RESULTS FOOTER (pinned, ALWAYS rendered) */}
        <footer
          className="shrink-0 px-5 py-4 border-t"
          style={{
            borderColor: "rgba(255,255,255,0.06)",
            background: "rgba(0,0,0,0.18)",
          }}
        >
          <div
            className="grid grid-cols-3 gap-3 transition-opacity"
            style={{ opacity: footerHasRealData ? 1 : 0.55 }}
          >
            {footerTiles.map((m, idx) => (
              <div
                key={`${m.label}-${idx}`}
                className="rounded-lg px-3 py-2 border"
                style={{
                  background: "rgba(0,0,0,0.22)",
                  borderColor: "rgba(255,255,255,0.07)",
                }}
              >
                <div className="text-[10px] tracking-[0.18em] text-slate-300/70">
                  {m.label}
                </div>
                <div className="mt-1 text-[13px] font-semibold text-slate-100/95">
                  {m.value}
                </div>
              </div>
            ))}
          </div>
        </footer>
      </div>
    </section>
  );
}
