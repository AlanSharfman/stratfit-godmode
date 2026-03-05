import { create } from "zustand"
import type { KpiKey } from "@/domain/intelligence/kpiZoneMapping"
import { KPI_KEYS, KPI_ZONE_MAP, getHealthLevel } from "@/domain/intelligence/kpiZoneMapping"
import type { PositionKpis } from "@/pages/position/overlays/positionState"

export type AlertSeverity = "info" | "warning" | "critical"
export type AlertChannel = "in-app" | "email" | "slack" | "webhook"

export interface AlertRule {
  id: string
  kpi: KpiKey
  condition: "below" | "above" | "health_is"
  threshold: number | string
  severity: AlertSeverity
  channels: AlertChannel[]
  enabled: boolean
  message: string
}

export interface TriggeredAlert {
  id: string
  ruleId: string
  kpi: KpiKey
  message: string
  severity: AlertSeverity
  value: number | string
  triggeredAt: number
  acknowledged: boolean
}

export interface WebhookConfig {
  id: string
  name: string
  url: string
  events: string[]
  enabled: boolean
  secret?: string
}

interface AlertsState {
  rules: AlertRule[]
  triggered: TriggeredAlert[]
  webhooks: WebhookConfig[]

  addRule: (rule: Omit<AlertRule, "id">) => void
  removeRule: (id: string) => void
  toggleRule: (id: string) => void
  evaluateAlerts: (kpis: PositionKpis) => TriggeredAlert[]
  acknowledgeAlert: (id: string) => void
  clearAlerts: () => void

  addWebhook: (config: Omit<WebhookConfig, "id">) => void
  removeWebhook: (id: string) => void
  toggleWebhook: (id: string) => void
  fireWebhooks: (event: string, payload: Record<string, unknown>) => Promise<void>
}

const STORAGE_KEY = "stratfit-alerts-v1"

function genId() { return `${Date.now()}-${Math.random().toString(36).slice(2, 6)}` }

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function saveState(state: Pick<AlertsState, "rules" | "webhooks">) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ rules: state.rules, webhooks: state.webhooks })) } catch { /* noop */ }
}

const KPI_VALUE_GETTERS: Record<KpiKey, (k: PositionKpis) => number> = {
  cash: (k) => k.cashOnHand,
  runway: (k) => k.runwayMonths,
  growth: (k) => k.growthRatePct,
  arr: (k) => k.arr,
  revenue: (k) => k.revenueMonthly,
  burn: (k) => k.burnMonthly,
  churn: (k) => k.churnPct,
  grossMargin: (k) => k.grossMarginPct,
  headcount: (k) => k.headcount,
  nrr: (k) => k.nrrPct,
  efficiency: (k) => k.efficiencyRatio,
  enterpriseValue: (k) => k.valuationEstimate || 0,
}

const DEFAULT_RULES: AlertRule[] = [
  { id: "default-runway", kpi: "runway", condition: "below", threshold: 6, severity: "critical", channels: ["in-app"], enabled: true, message: "Runway has dropped below 6 months" },
  { id: "default-churn", kpi: "churn", condition: "above", threshold: 8, severity: "warning", channels: ["in-app"], enabled: true, message: "Churn rate exceeds 8%" },
  { id: "default-cash", kpi: "cash", condition: "below", threshold: 100_000, severity: "critical", channels: ["in-app"], enabled: true, message: "Cash balance critically low" },
  { id: "default-burn", kpi: "burn", condition: "above", threshold: 100_000, severity: "warning", channels: ["in-app"], enabled: true, message: "Monthly burn exceeds $100K" },
  { id: "default-growth", kpi: "growth", condition: "below", threshold: 5, severity: "info", channels: ["in-app"], enabled: true, message: "Growth rate has fallen below 5%" },
]

export const useAlertsStore = create<AlertsState>((set, get) => {
  const stored = loadState()

  return {
    rules: stored?.rules ?? DEFAULT_RULES,
    triggered: [],
    webhooks: stored?.webhooks ?? [],

    addRule: (rule) => {
      const newRule = { ...rule, id: genId() }
      set((s) => {
        const rules = [...s.rules, newRule]
        saveState({ rules, webhooks: s.webhooks })
        return { rules }
      })
    },

    removeRule: (id) => {
      set((s) => {
        const rules = s.rules.filter((r) => r.id !== id)
        saveState({ rules, webhooks: s.webhooks })
        return { rules }
      })
    },

    toggleRule: (id) => {
      set((s) => {
        const rules = s.rules.map((r) => r.id === id ? { ...r, enabled: !r.enabled } : r)
        saveState({ rules, webhooks: s.webhooks })
        return { rules }
      })
    },

    evaluateAlerts: (kpis) => {
      const { rules, triggered: existing } = get()
      const newAlerts: TriggeredAlert[] = []

      for (const rule of rules) {
        if (!rule.enabled) continue

        const value = KPI_VALUE_GETTERS[rule.kpi](kpis)
        let fired = false

        if (rule.condition === "below" && typeof rule.threshold === "number") {
          fired = value < rule.threshold
        } else if (rule.condition === "above" && typeof rule.threshold === "number") {
          fired = value > rule.threshold
        } else if (rule.condition === "health_is") {
          fired = getHealthLevel(rule.kpi, kpis) === rule.threshold
        }

        if (fired) {
          const alreadyTriggered = existing.some((a) => a.ruleId === rule.id && !a.acknowledged)
          if (!alreadyTriggered) {
            newAlerts.push({
              id: genId(),
              ruleId: rule.id,
              kpi: rule.kpi,
              message: rule.message,
              severity: rule.severity,
              value: rule.condition === "health_is" ? getHealthLevel(rule.kpi, kpis) : value,
              triggeredAt: Date.now(),
              acknowledged: false,
            })
          }
        }
      }

      if (newAlerts.length > 0) {
        set((s) => ({ triggered: [...s.triggered, ...newAlerts] }))
        const state = get()
        for (const alert of newAlerts) {
          state.fireWebhooks("alert.triggered", { alert })
        }
      }

      return newAlerts
    },

    acknowledgeAlert: (id) => {
      set((s) => ({
        triggered: s.triggered.map((a) => a.id === id ? { ...a, acknowledged: true } : a),
      }))
    },

    clearAlerts: () => set({ triggered: [] }),

    addWebhook: (config) => {
      const hook = { ...config, id: genId() }
      set((s) => {
        const webhooks = [...s.webhooks, hook]
        saveState({ rules: s.rules, webhooks })
        return { webhooks }
      })
    },

    removeWebhook: (id) => {
      set((s) => {
        const webhooks = s.webhooks.filter((w) => w.id !== id)
        saveState({ rules: s.rules, webhooks })
        return { webhooks }
      })
    },

    toggleWebhook: (id) => {
      set((s) => {
        const webhooks = s.webhooks.map((w) => w.id === id ? { ...w, enabled: !w.enabled } : w)
        saveState({ rules: s.rules, webhooks })
        return { webhooks }
      })
    },

    fireWebhooks: async (event, payload) => {
      const { webhooks } = get()
      for (const hook of webhooks) {
        if (!hook.enabled || !hook.events.includes(event)) continue
        try {
          await fetch(hook.url, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...(hook.secret ? { "X-Webhook-Secret": hook.secret } : {}) },
            body: JSON.stringify({ event, payload, timestamp: Date.now(), source: "stratfit" }),
          })
        } catch (e) {
          console.warn(`[STRATFIT] Webhook ${hook.name} failed:`, e)
        }
      }
    },
  }
})
