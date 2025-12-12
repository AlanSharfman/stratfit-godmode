// src/types/domain.ts

import type { ScenarioId, LeverId, MetricId } from "@/config/dashboardConfig";

/**
 * Core STRATFIT domain types
 *
 * These describe how we *think* about users, companies, scenarios, metrics and levers.
 * Later, Supabase tables will map directly onto these shapes (with some IDs / timestamps).
 */

// ---------- USER ----------
export interface User {
  id: string;           // Supabase auth user.id
  email: string;
  displayName?: string;
  createdAt: string;    // ISO string
}

// ---------- COMPANY ----------
export interface Company {
  id: string;
  ownerUserId: string;  // FK -> User.id (creator/primary owner)
  name: string;
  sector?: string;      // SaaS, eCom, Services, etc.
  currency: string;     // "AUD", "USD", etc.
  createdAt: string;
  updatedAt: string;
}

/**
 * Baseline financial profile for a company.
 * This is the "starting point" the engine works from before levers + scenarios.
 */
export interface CompanyBaseline {
  companyId: string;

  // Simple MVP set – we can extend later
  annualRevenue: number;        // in company currency, e.g. 1_200_000
  monthlyBurn: number;          // e.g. 200_000 (positive number)
  cashOnHand: number;           // e.g. 2_000_000
  headcount: number;
  avgSalaryPerFTE: number;      // e.g. 120_000
  cac: number;                  // customer acquisition cost
  churnRate: number;            // % per year or per month (we’ll clarify later)

  createdAt: string;
  updatedAt: string;
}

// ---------- SCENARIO ----------

/**
 * A single saved scenario for a company.
 * This is what we will store in Supabase later.
 */
export interface ScenarioRecord {
  id: string;
  companyId: string;
  ownerUserId: string;

  // Link to the "mode" in the UI
  scenarioId: ScenarioId;      // "base" | "upside" | "downside" | "extreme"

  name: string;                // e.g. "Base FY25", "Aggressive Growth"
  description?: string;

  // Lever values at the time of saving
  levers: Record<LeverId, number>;

  // Snapshot of metrics at the time of saving (for history / comparison)
  metricsSnapshot: Record<MetricId, number>;

  createdAt: string;
  updatedAt: string;
  archivedAt?: string | null;
}

// ---------- VIEW MODELS (what the UI works with) ----------

/**
 * The thing the dashboard actually binds to when you load a scenario.
 * For now this is just a convenience type – not a DB row.
 */
export interface LoadedScenario {
  scenarioRecordId: string;
  company: Company;
  baseline: CompanyBaseline;
  scenarioId: ScenarioId;
  leverState: Record<LeverId, number>;
  metricState: Record<MetricId, number>;
}
