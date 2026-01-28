// src/components/compare/mockData.ts
// STRATFIT — Mock Data for Compare View

import { CompareDataset, CompareMetric, DriverHeatmap, DriverKey } from "./types";

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

// deterministic pseudo-random
function hash01(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function makeMockCompareData(metric: CompareMetric = "ARR"): CompareDataset {
  const months = Array.from({ length: 37 }, (_, i) => i); // 0..36

  // Baseline and Exploration means (p50) + widening uncertainty bands (p5/p95)
  const baseStart = metric === "ARR" ? 3.2 : metric === "CASH" ? 4.0 : 18;
  const expStart = baseStart;

  const baseP50: number[] = [];
  const expP50: number[] = [];
  const baseP5: number[] = [];
  const baseP95: number[] = [];
  const expP5: number[] = [];
  const expP95: number[] = [];

  for (let i = 0; i < months.length; i++) {
    const m = months[i];
    const t = m / 36;

    // baseline growth curve
    const gA = 0.85 + 0.25 * easeInOut(t);
    // exploration grows faster after mid-horizon
    const accel = 0.15 + 0.55 * easeInOut(clamp((t - 0.25) / 0.75, 0, 1));
    const gB = gA + accel;

    const noiseA = (hash01(100 + i) - 0.5) * 0.06;
    const noiseB = (hash01(200 + i) - 0.5) * 0.06;

    const a = expCurve(baseStart, gA, t) * (1 + noiseA);
    const b = expCurve(expStart, gB, t) * (1 + noiseB);

    baseP50.push(a);
    expP50.push(b);

    // Uncertainty widens over time; exploration slightly wider
    const bandA = baseStart * (0.08 + 0.22 * t);
    const bandB = baseStart * (0.10 + 0.28 * t);

    baseP5.push(a - bandA);
    baseP95.push(a + bandA);
    expP5.push(b - bandB);
    expP95.push(b + bandB);
  }

  return {
    months,
    metric,
    baseline: { p5: baseP5, p50: baseP50, p95: baseP95 },
    exploration: { p5: expP5, p50: expP50, p95: expP95 },
  };
}

function expCurve(start: number, growth: number, t: number) {
  // smooth-ish compounding, not a straight line
  return start * (1 + growth * t + 0.9 * t * t);
}

export function makeMockHeatmap(monthCount: number): DriverHeatmap {
  const drivers: DriverKey[] = [
    "Pricing",
    "Demand",
    "Churn",
    "CAC",
    "Headcount",
    "COGS",
    "Ops Risk",
    "Capital Raise",
  ];

  const values: number[][] = drivers.map((_, r) => {
    const row: number[] = [];
    for (let c = 0; c < monthCount; c++) {
      const t = c / Math.max(1, monthCount - 1);
      const wobble = (hash01(1000 + r * 77 + c * 13) - 0.5) * 0.55;
      const drift = (r % 2 === 0 ? 1 : -1) * (0.15 + 0.55 * easeInOut(t));
      row.push(clamp(drift + wobble, -1, 1));
    }
    return row;
  });

  return { drivers, values };
}

