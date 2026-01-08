// src/components/ui/TakeTheTour.tsx
// STRATFIT — Minimal “Take the tour” (Phase 1, UI-only)

import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

type StepKey = "kpis" | "mountain" | "sliders" | "intel";

type Step = {
  key: StepKey;
  selector: string;
  title: string;
  body: string;
};

function getRectForSelector(selector: string): DOMRect | null {
  const el = document.querySelector(selector);
  if (!el) return null;
  return (el as HTMLElement).getBoundingClientRect();
}

export default function TakeTheTour() {
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const steps: Step[] = useMemo(
    () => [
      {
        key: "kpis",
        selector: '[data-tour="kpis"]',
        title: "KPIs",
        body: "Instrumentation only. Read the dials, then return to the mountain.",
      },
      {
        key: "mountain",
        selector: '[data-tour="mountain"]',
        title: "Mountain",
        body: "Primary system surface. Cause → effect lives here.",
      },
      {
        key: "sliders",
        selector: '[data-tour="sliders"]',
        title: "Levers",
        body: "Adjust a lever, then release to commit. Watch the response.",
      },
      {
        key: "intel",
        selector: '[data-tour="intel"]',
        title: "Scenario Intelligence",
        body: "CFO-grade readout: risks, actions, and trajectory.",
      },
    ],
    []
  );

  const step = steps[Math.max(0, Math.min(steps.length - 1, stepIndex))];

  useEffect(() => {
    if (!open) return;
    setStepIndex(0);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const update = () => {
      const r = getRectForSelector(step.selector);
      setRect(r);
    };

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, step.selector]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const overlay = open
    ? createPortal(
        <div className="sf-tour" role="dialog" aria-modal="true" aria-label="System guide">
          <div className="sf-tour__dim" onClick={() => setOpen(false)} />

          {rect ? (
            <div
              className="sf-tour__focus"
              style={{
                left: Math.max(8, rect.left - 10),
                top: Math.max(8, rect.top - 10),
                width: Math.min(window.innerWidth - 16, rect.width + 20),
                height: Math.min(window.innerHeight - 16, rect.height + 20),
              }}
            />
          ) : null}

          <div className="sf-tour__card" style={{ right: 18, bottom: 18 }}>
            <div className="sf-tour__kicker">SYSTEM GUIDE</div>
            <div className="sf-tour__title">{step.title}</div>
            <div className="sf-tour__body">{step.body}</div>

            <div className="sf-tour__actions">
              <button
                type="button"
                className="sf-tour__btn"
                onClick={() => setOpen(false)}
                style={{ opacity: 0.85 }}
              >
                Exit
              </button>
              <div style={{ flex: 1 }} />
              <button
                type="button"
                className="sf-tour__btn"
                disabled={stepIndex === 0}
                onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
              >
                Back
              </button>
              <button
                type="button"
                className="sf-tour__btn sf-tour__btn--primary"
                onClick={() => {
                  if (stepIndex >= steps.length - 1) setOpen(false);
                  else setStepIndex((i) => Math.min(steps.length - 1, i + 1));
                }}
              >
                {stepIndex >= steps.length - 1 ? "Done" : "Next"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <>
      <button type="button" className="sf-tour-pill" onClick={() => setOpen(true)}>
        <svg
          className="sf-tour-pill__icon"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
          <circle cx="12" cy="12" r="2.5" />
        </svg>
        SYSTEM GUIDE
      </button>
      {overlay}
    </>
  );
}


