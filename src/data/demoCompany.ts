// src/data/demoCompany.ts
// STRATFIT — Demo Company Data (9C)
// Pre-loaded sample data for the Interactive Demo Playground.

import type { BaselineInputs } from "@/state/baselineStore"

export const DEMO_COMPANY: BaselineInputs = {
  cash: 1_200_000,
  monthlyBurn: 85_000,
  revenue: 42_000,
  grossMargin: 72,
  growthRate: 15,
  churnRate: 4.2,
  headcount: 18,
  arpa: 280,
  stage: "seed",
}

export const DEMO_COMPANY_NAME = "Acme Analytics"

export const DEMO_COMPANY_DESCRIPTION =
  "A seed-stage B2B SaaS company with $1.2M in the bank, 18 employees, and 15% MoM growth. " +
  "Healthy gross margins but a burn rate that gives ~14 months of runway. " +
  "Typical of a company preparing for Series A."
