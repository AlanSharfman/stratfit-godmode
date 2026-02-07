import React, { useEffect, useMemo, useState } from "react";
import Slider from "@/components/ui/Slider";
import styles from "./LeverSliderRow.module.css";

function clamp(v: number, lo: number, hi: number): number {
  if (v < lo) return lo;
  if (v > hi) return hi;
  return v;
}

export function LeverSliderRow(props: {
  label: string;
  description?: string;
  value: number;
  baselineValue?: number | null;
  showBaseline?: boolean;
  min: number;
  max: number;
  step?: number;
  format?: (v: number) => string;
  parse?: (raw: string) => number | null;
  onChange: (v: number) => void;
  onCommit?: () => void;
}) {
  const {
    label,
    description,
    value,
    baselineValue,
    showBaseline = true,
    min,
    max,
    step = 1,
    format,
    parse,
    onChange,
    onCommit,
  } = props;

  const safeValue = Number.isFinite(value) ? clamp(value, min, max) : min;
  const [rawInput, setRawInput] = useState<string>(() => (format ? format(safeValue) : String(safeValue)));

  useEffect(() => {
    setRawInput(format ? format(safeValue) : String(safeValue));
  }, [safeValue, format]);

  const baselineLeftPct = useMemo(() => {
    if (!showBaseline) return null;
    if (baselineValue == null) return null;
    if (!Number.isFinite(baselineValue)) return null;
    const b = clamp(baselineValue, min, max);
    const pct = max > min ? ((b - min) / (max - min)) * 100 : 0;
    return clamp(pct, 0, 100);
  }, [baselineValue, max, min, showBaseline]);

  const onBlur = () => {
    const parsed = parse ? parse(rawInput) : (() => {
      const s = rawInput.replace(/[$,%\s]/g, "");
      if (!s) return null;
      const n = Number(s);
      return Number.isFinite(n) ? n : null;
    })();
    if (parsed == null) {
      setRawInput(format ? format(safeValue) : String(safeValue));
      return;
    }
    const next = clamp(parsed, min, max);
    onChange(next);
    onCommit?.();
  };

  return (
    <div className={styles.row}>
      <div className={styles.header}>
        <div className={styles.label}>{label}</div>
      </div>
      {description ? <div className={styles.sub}>{description}</div> : null}

      <div className={styles.controls}>
        <div className={styles.trackWrap}>
          {baselineLeftPct != null ? (
            <div className={styles.baselineMark} style={{ left: `calc(${baselineLeftPct}% - 1px)` }} />
          ) : null}
          <Slider
            value={safeValue}
            min={min}
            max={max}
            step={step}
            onChange={(v) => onChange(v)}
            onEnd={onCommit}
          />
        </div>

        <input
          className={styles.num}
          value={rawInput}
          onChange={(e) => setRawInput(e.target.value)}
          onBlur={onBlur}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          }}
          inputMode="decimal"
        />
      </div>
    </div>
  );
}

export default LeverSliderRow;


