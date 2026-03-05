import type { KpiKey } from "@/domain/intelligence/kpiZoneMapping"
import { KPI_KEYS, KPI_ZONE_MAP, getHealthLevel } from "@/domain/intelligence/kpiZoneMapping"
import type { PositionKpis } from "@/pages/position/overlays/positionState"
import { getKpiCommentary, getExecutiveSummary } from "@/domain/intelligence/kpiCommentary"

interface ExportRow {
  zone: string
  kpi: string
  value: string
  health: string
  commentary: string
}

const KPI_VALUE_MAP: Record<KpiKey, { label: string; fmt: (k: PositionKpis) => string; raw: (k: PositionKpis) => number }> = {
  cash: { label: "Cash Balance", fmt: (k) => `$${k.cashOnHand.toLocaleString()}`, raw: (k) => k.cashOnHand },
  runway: { label: "Runway (months)", fmt: (k) => k.runwayMonths.toFixed(1), raw: (k) => k.runwayMonths },
  growth: { label: "Growth Rate (%)", fmt: (k) => k.growthRatePct.toFixed(1), raw: (k) => k.growthRatePct },
  arr: { label: "ARR", fmt: (k) => `$${k.arr.toLocaleString()}`, raw: (k) => k.arr },
  revenue: { label: "Monthly Revenue", fmt: (k) => `$${k.revenueMonthly.toLocaleString()}`, raw: (k) => k.revenueMonthly },
  burn: { label: "Monthly Burn", fmt: (k) => `$${k.burnMonthly.toLocaleString()}`, raw: (k) => k.burnMonthly },
  churn: { label: "Churn Rate (%)", fmt: (k) => k.churnPct.toFixed(1), raw: (k) => k.churnPct },
  grossMargin: { label: "Gross Margin (%)", fmt: (k) => k.grossMarginPct.toFixed(1), raw: (k) => k.grossMarginPct },
  headcount: { label: "Headcount", fmt: (k) => `${k.headcount}`, raw: (k) => k.headcount },
  enterpriseValue: { label: "Enterprise Value", fmt: (k) => k.valuationEstimate ? `$${k.valuationEstimate.toLocaleString()}` : "N/A", raw: (k) => k.valuationEstimate || 0 },
}

function buildRows(kpis: PositionKpis): ExportRow[] {
  return KPI_KEYS.map((kpi) => ({
    zone: KPI_ZONE_MAP[kpi].label,
    kpi: KPI_VALUE_MAP[kpi].label,
    value: KPI_VALUE_MAP[kpi].fmt(kpis),
    health: getHealthLevel(kpi, kpis),
    commentary: getKpiCommentary(kpi, kpis) ?? "",
  }))
}

export function exportAsCSV(kpis: PositionKpis): string {
  const rows = buildRows(kpis)
  const header = "Zone,KPI,Value,Health,Commentary"
  const body = rows.map((r) => `"${r.zone}","${r.kpi}","${r.value}","${r.health}","${r.commentary.replace(/"/g, '""')}"`)
  return [header, ...body].join("\n")
}

export function exportAsJSON(kpis: PositionKpis): string {
  const data = {
    exportedAt: new Date().toISOString(),
    platform: "STRATFIT",
    version: "v4",
    executiveSummary: getExecutiveSummary(kpis).narrative,
    kpis: KPI_KEYS.reduce((acc, kpi) => {
      acc[kpi] = {
        zone: KPI_ZONE_MAP[kpi].label,
        label: KPI_VALUE_MAP[kpi].label,
        value: KPI_VALUE_MAP[kpi].raw(kpis),
        formatted: KPI_VALUE_MAP[kpi].fmt(kpis),
        health: getHealthLevel(kpi, kpis),
        commentary: getKpiCommentary(kpi, kpis) ?? "",
      }
      return acc
    }, {} as Record<string, unknown>),
  }
  return JSON.stringify(data, null, 2)
}

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}

export function copyToClipboard(text: string): Promise<boolean> {
  return navigator.clipboard.writeText(text).then(() => true).catch(() => false)
}

export function exportKpisCSV(kpis: PositionKpis) {
  const csv = exportAsCSV(kpis)
  const date = new Date().toISOString().slice(0, 10)
  downloadFile(csv, `stratfit-kpis-${date}.csv`, "text/csv")
}

export function exportKpisJSON(kpis: PositionKpis) {
  const json = exportAsJSON(kpis)
  const date = new Date().toISOString().slice(0, 10)
  downloadFile(json, `stratfit-kpis-${date}.json`, "application/json")
}

export function exportScenariosJSON(scenarios: { name: string; forces: Partial<Record<KpiKey, number>> }[]) {
  const data = {
    exportedAt: new Date().toISOString(),
    platform: "STRATFIT",
    scenarioCount: scenarios.length,
    scenarios,
  }
  const json = JSON.stringify(data, null, 2)
  const date = new Date().toISOString().slice(0, 10)
  downloadFile(json, `stratfit-scenarios-${date}.json`, "application/json")
}
