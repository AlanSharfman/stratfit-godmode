import React from "react";
import styles from "./TrafficLightPill.module.css";
import type { TrafficLight } from "@/logic/spiderFitness";

type Props = {
  label: string;
  band: TrafficLight;
  valueText?: string; // optional override (defaults to band)
  className?: string;
};

const bandToText = (b: TrafficLight) => {
  if (b === "green") return "Green";
  if (b === "amber") return "Amber";
  return "Red";
};

export function TrafficLightPill({ label, band, valueText, className }: Props) {
  const cls =
    band === "green"
      ? styles.green
      : band === "amber"
        ? styles.amber
        : styles.red;

  const text = valueText ?? bandToText(band);

  return (
    <div className={[styles.pill, cls, className].filter(Boolean).join(" ")}>
      <span className={styles.dot} aria-hidden="true" />
      <span className={styles.label}>{label}</span>
      <span className={styles.value}>{text}</span>
    </div>
  );
}
