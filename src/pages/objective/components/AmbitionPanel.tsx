import React, { useCallback } from "react";
import styles from "../ObjectivePage.module.css";
import { useObjectiveStore } from "@/state/objectiveStore";

/* ── helpers ── */
const fmtCurrency = (v: number) =>
  v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M` : `$${(v / 1_000).toFixed(0)}K`;

interface SliderRowProps {
  label: string;
  desc: string;
  min: number;
  max: number;
  step: number;
  value: number;
  format?: (v: number) => string;
  onChange: (v: number) => void;
}

function SliderRow({ label, desc, min, max, step, value, format, onChange }: SliderRowProps) {
  return (
    <div className={styles.ambitionBlock}>
      <div className={styles.ambitionLabelRow}>
        <span className={styles.ambitionLabel}>{label}</span>
        <span className={styles.ambitionValue}>{format ? format(value) : value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={styles.slider}
      />
      <div className={styles.ambitionDescriptor}>{desc}</div>
    </div>
  );
}

export default function AmbitionPanel() {
  const { targets, setTarget } = useObjectiveStore();

  const set = useCallback(
    <K extends keyof typeof targets>(key: K) =>
      (v: (typeof targets)[K]) =>
        setTarget(key, v),
    [setTarget],
  );

  return (
    <section className={styles.panel}>
      <h2 className={styles.panelTitle}>DEFINE THE CREST</h2>
      <div className={styles.ambitionBlocks}>
        <SliderRow
          label="Revenue Ambition"
          desc="Target annual scale within selected horizon."
          min={500_000}
          max={100_000_000}
          step={500_000}
          value={targets.arr}
          format={fmtCurrency}
          onChange={set("arr")}
        />
        <SliderRow
          label="Growth Intensity"
          desc="Speed at which expansion is pursued."
          min={0}
          max={200}
          step={1}
          value={targets.growth}
          format={(v) => `${v}%`}
          onChange={set("growth")}
        />
        <SliderRow
          label="Margin Standard"
          desc="Operating efficiency required to sustain ambition."
          min={10}
          max={95}
          step={1}
          value={targets.grossMargin}
          format={(v) => `${v}%`}
          onChange={set("grossMargin")}
        />
        <SliderRow
          label="Risk Tolerance"
          desc="Minimum acceptable survival probability."
          min={20}
          max={99}
          step={1}
          value={targets.survival}
          format={(v) => `${v}%`}
          onChange={set("survival")}
        />
        <SliderRow
          label="Capital Buffer Horizon"
          desc="Desired runway stability threshold."
          min={3}
          max={48}
          step={1}
          value={targets.runway}
          format={(v) => `${v} mo`}
          onChange={set("runway")}
        />
      </div>
    </section>
  );
}
