import type { KpiKey } from "@/domain/intelligence/kpiZoneMapping"
import { KPI_KEYS } from "@/domain/intelligence/kpiZoneMapping"

export type CompanyStage = "pre-seed" | "seed" | "series-a" | "series-b" | "growth"

export interface BenchmarkProfile {
  stage: CompanyStage
  label: string
  description: string
  kpis: Record<KpiKey, { p25: number; p50: number; p75: number; top10: number }>
  sampleSize: number
}

export interface BenchmarkComparison {
  kpi: KpiKey
  label: string
  yourValue: number
  p25: number
  p50: number
  p75: number
  top10: number
  percentile: number
  verdict: "below" | "median" | "above" | "top"
}

const STAGE_BENCHMARKS: Record<CompanyStage, BenchmarkProfile> = {
  "pre-seed": {
    stage: "pre-seed",
    label: "Pre-Seed",
    description: "< $500K raised, validating product-market fit",
    sampleSize: 342,
    kpis: {
      cash: { p25: 80_000, p50: 180_000, p75: 400_000, top10: 750_000 },
      runway: { p25: 4, p50: 8, p75: 14, top10: 24 },
      growth: { p25: 5, p50: 15, p75: 35, top10: 60 },
      arr: { p25: 0, p50: 24_000, p75: 120_000, top10: 360_000 },
      revenue: { p25: 0, p50: 2_000, p75: 10_000, top10: 30_000 },
      burn: { p25: 8_000, p50: 18_000, p75: 35_000, top10: 60_000 },
      churn: { p25: 8, p50: 5, p75: 3, top10: 1.5 },
      grossMargin: { p25: 40, p50: 60, p75: 75, top10: 85 },
      headcount: { p25: 1, p50: 3, p75: 6, top10: 12 },
      nrr: { p25: 70, p50: 85, p75: 100, top10: 120 },
      efficiency: { p25: 0.2, p50: 0.5, p75: 0.9, top10: 1.5 },
      enterpriseValue: { p25: 500_000, p50: 1_500_000, p75: 4_000_000, top10: 10_000_000 },
    },
  },
  "seed": {
    stage: "seed",
    label: "Seed",
    description: "$500K–$3M raised, early traction",
    sampleSize: 518,
    kpis: {
      cash: { p25: 300_000, p50: 800_000, p75: 1_800_000, top10: 3_500_000 },
      runway: { p25: 6, p50: 12, p75: 18, top10: 30 },
      growth: { p25: 10, p50: 25, p75: 50, top10: 80 },
      arr: { p25: 60_000, p50: 240_000, p75: 720_000, top10: 1_500_000 },
      revenue: { p25: 5_000, p50: 20_000, p75: 60_000, top10: 125_000 },
      burn: { p25: 25_000, p50: 55_000, p75: 100_000, top10: 180_000 },
      churn: { p25: 7, p50: 4.5, p75: 2.5, top10: 1.2 },
      grossMargin: { p25: 50, p50: 65, p75: 78, top10: 88 },
      headcount: { p25: 3, p50: 8, p75: 15, top10: 25 },
      nrr: { p25: 80, p50: 95, p75: 110, top10: 130 },
      efficiency: { p25: 0.3, p50: 0.65, p75: 1.1, top10: 1.8 },
      enterpriseValue: { p25: 2_000_000, p50: 6_000_000, p75: 15_000_000, top10: 35_000_000 },
    },
  },
  "series-a": {
    stage: "series-a",
    label: "Series A",
    description: "$3M–$15M raised, scaling",
    sampleSize: 287,
    kpis: {
      cash: { p25: 1_500_000, p50: 4_000_000, p75: 8_000_000, top10: 15_000_000 },
      runway: { p25: 10, p50: 18, p75: 24, top10: 36 },
      growth: { p25: 15, p50: 40, p75: 70, top10: 120 },
      arr: { p25: 500_000, p50: 1_500_000, p75: 4_000_000, top10: 10_000_000 },
      revenue: { p25: 40_000, p50: 125_000, p75: 330_000, top10: 830_000 },
      burn: { p25: 80_000, p50: 180_000, p75: 350_000, top10: 600_000 },
      churn: { p25: 6, p50: 3.5, p75: 2, top10: 0.8 },
      grossMargin: { p25: 55, p50: 70, p75: 80, top10: 90 },
      headcount: { p25: 10, p50: 25, p75: 50, top10: 80 },
      nrr: { p25: 90, p50: 105, p75: 120, top10: 145 },
      efficiency: { p25: 0.5, p50: 0.8, p75: 1.3, top10: 2.2 },
      enterpriseValue: { p25: 10_000_000, p50: 30_000_000, p75: 80_000_000, top10: 200_000_000 },
    },
  },
  "series-b": {
    stage: "series-b",
    label: "Series B",
    description: "$15M–$50M raised, market expansion",
    sampleSize: 164,
    kpis: {
      cash: { p25: 5_000_000, p50: 15_000_000, p75: 30_000_000, top10: 60_000_000 },
      runway: { p25: 14, p50: 22, p75: 30, top10: 48 },
      growth: { p25: 20, p50: 50, p75: 90, top10: 150 },
      arr: { p25: 3_000_000, p50: 8_000_000, p75: 20_000_000, top10: 50_000_000 },
      revenue: { p25: 250_000, p50: 660_000, p75: 1_660_000, top10: 4_160_000 },
      burn: { p25: 250_000, p50: 500_000, p75: 900_000, top10: 1_500_000 },
      churn: { p25: 5, p50: 3, p75: 1.5, top10: 0.5 },
      grossMargin: { p25: 60, p50: 72, p75: 82, top10: 92 },
      headcount: { p25: 40, p50: 80, p75: 150, top10: 250 },
      nrr: { p25: 100, p50: 115, p75: 130, top10: 155 },
      efficiency: { p25: 0.7, p50: 1.0, p75: 1.6, top10: 2.8 },
      enterpriseValue: { p25: 50_000_000, p50: 150_000_000, p75: 400_000_000, top10: 1_000_000_000 },
    },
  },
  "growth": {
    stage: "growth",
    label: "Growth",
    description: "$50M+ raised, scaling to IPO",
    sampleSize: 89,
    kpis: {
      cash: { p25: 20_000_000, p50: 60_000_000, p75: 150_000_000, top10: 300_000_000 },
      runway: { p25: 18, p50: 30, p75: 48, top10: 60 },
      growth: { p25: 25, p50: 60, p75: 100, top10: 200 },
      arr: { p25: 15_000_000, p50: 40_000_000, p75: 100_000_000, top10: 300_000_000 },
      revenue: { p25: 1_250_000, p50: 3_330_000, p75: 8_330_000, top10: 25_000_000 },
      burn: { p25: 800_000, p50: 2_000_000, p75: 4_000_000, top10: 8_000_000 },
      churn: { p25: 4, p50: 2.5, p75: 1.2, top10: 0.3 },
      grossMargin: { p25: 65, p50: 75, p75: 85, top10: 95 },
      headcount: { p25: 100, p50: 250, p75: 500, top10: 1000 },
      nrr: { p25: 110, p50: 125, p75: 140, top10: 165 },
      efficiency: { p25: 0.9, p50: 1.3, p75: 2.0, top10: 3.5 },
      enterpriseValue: { p25: 200_000_000, p50: 600_000_000, p75: 2_000_000_000, top10: 10_000_000_000 },
    },
  },
}

function computePercentile(value: number, benchmarks: { p25: number; p50: number; p75: number; top10: number }, isInverse = false): number {
  const v = isInverse ? -value : value
  const b = isInverse
    ? { p25: -benchmarks.p25, p50: -benchmarks.p50, p75: -benchmarks.p75, top10: -benchmarks.top10 }
    : benchmarks

  if (v <= b.p25) return Math.max(0, (v / Math.max(1, b.p25)) * 25)
  if (v <= b.p50) return 25 + ((v - b.p25) / Math.max(1, b.p50 - b.p25)) * 25
  if (v <= b.p75) return 50 + ((v - b.p50) / Math.max(1, b.p75 - b.p50)) * 25
  if (v <= b.top10) return 75 + ((v - b.p75) / Math.max(1, b.top10 - b.p75)) * 15
  return Math.min(99, 90 + ((v - b.top10) / Math.max(1, b.top10)) * 10)
}

const INVERSE_KPIS: Set<KpiKey> = new Set(["burn", "churn"])

const KPI_VALUE_MAP: Record<KpiKey, (k: any) => number> = {
  cash: (k) => k.cashOnHand,
  runway: (k) => k.runwayMonths,
  growth: (k) => k.growthRatePct,
  arr: (k) => k.arr,
  revenue: (k) => k.revenueMonthly,
  burn: (k) => k.burnMonthly,
  churn: (k) => k.churnPct,
  grossMargin: (k) => k.grossMarginPct,
  headcount: (k) => k.headcount ?? 0,
  nrr: (k) => k.nrrPct ?? 100,
  efficiency: (k) => k.efficiencyRatio,
  enterpriseValue: (k) => k.valuationEstimate || 0,
}

const KPI_LABEL: Record<KpiKey, string> = {
  cash: "Cash Balance",
  runway: "Runway",
  growth: "Growth Rate",
  arr: "ARR",
  revenue: "Monthly Revenue",
  burn: "Monthly Burn",
  churn: "Churn Rate",
  grossMargin: "Gross Margin",
  headcount: "Headcount",
  nrr: "Net Revenue Retention",
  efficiency: "Efficiency",
  enterpriseValue: "Enterprise Value",
}

export function detectStage(kpis: { arr: number; cashOnHand: number }): CompanyStage {
  if (kpis.arr >= 15_000_000) return "growth"
  if (kpis.arr >= 3_000_000) return "series-b"
  if (kpis.arr >= 500_000) return "series-a"
  if (kpis.arr >= 60_000 || kpis.cashOnHand >= 300_000) return "seed"
  return "pre-seed"
}

export function getBenchmarkProfile(stage: CompanyStage): BenchmarkProfile {
  return STAGE_BENCHMARKS[stage]
}

export function compareToBenchmarks(kpis: any, stage?: CompanyStage): BenchmarkComparison[] {
  const s = stage ?? detectStage(kpis)
  const profile = STAGE_BENCHMARKS[s]

  return KPI_KEYS.map((kpi) => {
    const yourValue = KPI_VALUE_MAP[kpi](kpis)
    const bench = profile.kpis[kpi]
    const isInverse = INVERSE_KPIS.has(kpi)
    const percentile = computePercentile(yourValue, bench, isInverse)
    const verdict: BenchmarkComparison["verdict"] =
      percentile >= 90 ? "top" :
      percentile >= 60 ? "above" :
      percentile >= 40 ? "median" : "below"

    return {
      kpi,
      label: KPI_LABEL[kpi],
      yourValue,
      p25: bench.p25,
      p50: bench.p50,
      p75: bench.p75,
      top10: bench.top10,
      percentile: Math.round(percentile),
      verdict,
    }
  })
}
