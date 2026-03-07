// src/components/terrain/TerrainLensConfig.ts
// Configuration map for the 6 Terrain Lenses.
// Each lens maps to a unique colour, terrain marker station name, and KPI key.

import type { KpiKey } from "@/domain/intelligence/kpiZoneMapping"
import { KPI_CATEGORY_COLORS, KPI_ZONE_MAP } from "@/domain/intelligence/kpiZoneMapping"

export interface LensConfig {
  /** Hex colour for laser beam, pill highlight, and marker glow */
  color: string
  /** Station name displayed on the terrain marker */
  marker: string
  /** Display label for the lens */
  label: string
  /** KPI key this lens corresponds to */
  kpi: KpiKey
}

/**
 * 6 primary terrain lenses — one per PRIMARY_KPI.
 * Colours are sourced from KPI_CATEGORY_COLORS (single source of truth).
 */
export const TERRAIN_LENS_CONFIG: Record<string, LensConfig> = {
  cash:            { color: KPI_CATEGORY_COLORS.cash.hex,            marker: KPI_ZONE_MAP.cash.stationName,            label: KPI_ZONE_MAP.cash.label,            kpi: "cash" },
  runway:          { color: KPI_CATEGORY_COLORS.runway.hex,          marker: KPI_ZONE_MAP.runway.stationName,          label: KPI_ZONE_MAP.runway.label,          kpi: "runway" },
  growth:          { color: KPI_CATEGORY_COLORS.growth.hex,          marker: KPI_ZONE_MAP.growth.stationName,          label: KPI_ZONE_MAP.growth.label,          kpi: "growth" },
  revenue:         { color: KPI_CATEGORY_COLORS.revenue.hex,         marker: KPI_ZONE_MAP.revenue.stationName,         label: KPI_ZONE_MAP.revenue.label,         kpi: "revenue" },
  burn:            { color: KPI_CATEGORY_COLORS.burn.hex,            marker: KPI_ZONE_MAP.burn.stationName,            label: KPI_ZONE_MAP.burn.label,            kpi: "burn" },
  enterpriseValue: { color: KPI_CATEGORY_COLORS.enterpriseValue.hex, marker: KPI_ZONE_MAP.enterpriseValue.stationName, label: KPI_ZONE_MAP.enterpriseValue.label, kpi: "enterpriseValue" },
} as const

/** Get the lens config for a given KPI key, or null if not a primary lens */
export function getLensConfig(kpi: KpiKey): LensConfig | null {
  return TERRAIN_LENS_CONFIG[kpi] ?? null
}
