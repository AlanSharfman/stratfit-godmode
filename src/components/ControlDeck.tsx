import React, { useCallback, useMemo, useRef } from "react";
import { useShallow } from "zustand/react/shallow";
import { LeverSlider } from "@/components/controls/LeverSlider";
import type { LeverId } from "@/logic/mountainPeakModel";
import { useScenarioStore } from "@/state/scenarioStore";

// -----------------------------------------------------------------------------
// Phase-IG Performance Patch
// - Slider UI updates locally (instant).
// - Store writes throttled (RAF + ~33ms), preventing INP spikes.
// - Final commit on release.
// -----------------------------------------------------------------------------

type LeverMap = Record<string, number>;

function nowMs() {
  return (typeof performance !== "undefined" && performance.now) ? performance.now() : Date.now();
}

function ControlDeck() {
  // ✅ Narrow subscriptions: only read levers once per render
  // (still updates when levers change, but we reduce update frequency drastically)
  const { levers } = useScenarioStore(
    useShallow((s: any) => ({
      levers: (s.levers ?? {}) as LeverMap,
    }))
  );

  // ✅ Get the lever setter without subscribing to whole store
  const setLeverFn = useScenarioStore((s: any) =>
    s.setLever ?? s.setLeverValue ?? s.updateLever ?? s.setLeverById ?? s.setLeversPartial
  );

  if (!setLeverFn) {
    // Fail loudly in dev so we don't silently do nothing
    // (this is better than guessing a setter name)
    console.error("[ControlDeck] No lever setter found on scenarioStore. Expected setLever / setLeverValue / updateLever / setLeversPartial.");
  }

  // Throttle mechanics
  const rafRef = useRef<number | null>(null);
  const pendingRef = useRef<{ id: LeverId; v: number } | null>(null);
  const lastWriteRef = useRef<number>(0);

  const flush = useCallback(() => {
    rafRef.current = null;
    const pending = pendingRef.current;
    pendingRef.current = null;
    if (!pending || !setLeverFn) return;

    // Support both signatures:
    // 1) setLever(id, value)
    // 2) setLeversPartial({ [id]: value })
    try {
      if (setLeverFn.length >= 2) {
        setLeverFn(pending.id, pending.v);
      } else {
        setLeverFn({ [pending.id]: pending.v });
      }
    } catch (e) {
      console.error("[ControlDeck] lever setter call failed", e);
    }
  }, [setLeverFn]);

  const scheduleWrite = useCallback(
    (id: LeverId, v: number) => {
      pendingRef.current = { id, v };

      // Hard cap writes to ~30fps to protect INP
      const t = nowMs();
      const dt = t - lastWriteRef.current;

      // If enough time elapsed, write next RAF
      if (dt >= 33) {
        lastWriteRef.current = t;
        if (rafRef.current == null) {
          rafRef.current = requestAnimationFrame(flush);
        }
        return;
      }

      // Otherwise ensure at least one RAF is scheduled
      if (rafRef.current == null) {
        rafRef.current = requestAnimationFrame(() => {
          lastWriteRef.current = nowMs();
          flush();
        });
      }
    },
    [flush]
  );

  const commitWrite = useCallback(
    (id: LeverId, v: number) => {
      // Cancel any pending RAF write and commit immediately
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      pendingRef.current = null;

      if (!setLeverFn) return;

      try {
        if (setLeverFn.length >= 2) {
          setLeverFn(id, v);
        } else {
          setLeverFn({ [id]: v });
        }
      } catch (e) {
        console.error("[ControlDeck] lever commit failed", e);
      }
    },
    [setLeverFn]
  );

  // Define your levers list (IDs must match your LeverId naming)
  // If your store lever keys differ, adjust these IDs to match.
  const leverDefs = useMemo(
    () =>
      [
        { id: "growth" as LeverId, label: "Demand Strength", min: 0, max: 1, step: 0.01 },
        { id: "pricing" as LeverId, label: "Pricing Power", min: 0, max: 1, step: 0.01 },
        { id: "efficiency" as LeverId, label: "Operating Efficiency", min: 0, max: 1, step: 0.01 },
        { id: "risk" as LeverId, label: "Risk Pressure", min: 0, max: 1, step: 0.01 },
        { id: "capital" as LeverId, label: "Capital Buffer", min: 0, max: 1, step: 0.01 },
      ],
    []
  );

  return (
    <div className="controlDeck">
      {leverDefs.map((def) => {
        const v = (levers?.[def.id as any] ?? 0.5) as number;

        return (
          <LeverSlider
            key={def.id}
            id={String(def.id)}
            label={def.label}
            value={v}
            min={def.min}
            max={def.max}
            step={def.step}
            onChangeThrottled={(next) => scheduleWrite(def.id, next)}
            onCommit={(finalV) => commitWrite(def.id, finalV)}
          />
        );
      })}
    </div>
  );
}

export { ControlDeck };
export default ControlDeck;
