// src/components/ControlDeck.tsx
import React, { useMemo, useState } from "react";
import Slider from "./ui/Slider";
import { useScenarioStore } from "@/state/scenarioStore";
import type { LeverId } from "@/logic/mountainPeakModel";

export interface ControlSliderConfig {
  id: LeverId;
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  format?: (v: number) => string;
  defaultValue?: number;
}

export interface ControlBoxConfig {
  id: string;
  title: string;
  sliders: ControlSliderConfig[];
}

export function ControlDeck(props: {
  boxes: ControlBoxConfig[];
  onChange: (id: LeverId | "__end__", value: number) => void;
}) {
  const { boxes, onChange } = props;

  const activeLeverId = useScenarioStore((s) => s.activeLeverId);
  const setActiveLever = useScenarioStore((s) => s.setActiveLever);

  const rangeMap = useMemo(() => {
    const m = new Map<LeverId, { min: number; max: number; def: number }>();
    boxes.forEach((b) =>
      b.sliders.forEach((s) => {
        const def = Number.isFinite(s.defaultValue) ? (s.defaultValue as number) : s.value;
        m.set(s.id, { min: s.min, max: s.max, def });
      })
    );
    return m;
  }, [boxes]);

  const [dragging, setDragging] = useState<LeverId | null>(null);

  const computeIntensity01 = (id: LeverId, v: number) => {
    const r = rangeMap.get(id);
    if (!r) return 0;
    const span = Math.max(1e-6, r.max - r.min);
    const dist = Math.abs(v - r.def);
    return Math.max(0, Math.min(1, dist / span));
  };

  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 px-6 pb-6">
      {boxes.map((box) => (
        <div
          key={box.id}
          className="rounded-2xl border border-white/[0.10] bg-[#0B0E14]/60 backdrop-blur-md p-4"
          style={{ boxShadow: "0 22px 60px rgba(0,0,0,0.45)" }}
        >
          <div className="text-[12px] font-extrabold tracking-[0.18em] uppercase text-white/70 mb-3">
            {box.title}
          </div>

          <div className="flex flex-col gap-4">
            {box.sliders.map((s) => {
              const isActive = activeLeverId === s.id && (dragging === s.id);

              return (
                <div key={s.id} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="text-[12px] font-bold text-white/80">{s.label}</div>
                    <div className="text-[12px] font-semibold text-white/55">
                      {s.format ? s.format(s.value) : String(s.value)}
                    </div>
                  </div>

                  <Slider
                    value={s.value}
                    min={s.min}
                    max={s.max}
                    step={s.step}
                    highlight={isActive}
                    onStart={() => {
                      setDragging(s.id);
                      const intensity = computeIntensity01(s.id, s.value);
                      setActiveLever(s.id, intensity);
                    }}
                    onEnd={() => {
                      setDragging(null);
                      setActiveLever(null, 0);
                      onChange("__end__", 0);
                    }}
                    onChange={(v) => {
                      const intensity = computeIntensity01(s.id, v);
                      setActiveLever(s.id, intensity);
                      onChange(s.id, v);
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export const ControlDeckStyles = ``;
