-- Supab-- supabase/schema.sql
-- STRATFIT core schema (MVP)
-- Maps to src/types/domain.ts

-- NOTE:
-- - We rely on Supabase's built-in auth.users for authentication
-- - These tables are all in the `public` schema
-- - RLS policies will be added later once we're ready

-- ==============================
-- COMPANIES
-- ==============================
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null,      -- references auth.users.id (we'll add FK later)
  name text not null,
  sector text,                      -- e.g. 'SaaS', 'E-commerce', 'Services'
  currency text not null default 'AUD',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.companies is 'Companies using STRATFIT (one user can own multiple companies)';

-- Optional: link to auth.users (uncomment inside a function / migration that runs with correct privileges)
-- alter table public.companies
--   add constraint companies_owner_fk
--   foreign key (owner_user_id)
--   references auth.users (id)
--   on delete cascade;


-- ==============================
-- COMPANY BASELINES
-- ==============================
create table if not exists public.company_baselines (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,

  annual_revenue numeric not null default 0,          -- in company currency, e.g. 1200000
  monthly_burn numeric not null default 0,            -- positive number, e.g. 200000
  cash_on_hand numeric not null default 0,            -- e.g. 2000000
  headcount integer not null default 0,
  avg_salary_per_fte numeric not null default 0,
  cac numeric not null default 0,                     -- customer acquisition cost
  churn_rate numeric not null default 0,              -- % per period (we'll standardise later)

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.company_baselines is 'Baseline financial/operational profile per company used as the starting point for scenarios';


-- ==============================
-- SCENARIOS
-- ==============================
create table if not exists public.scenarios (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  owner_user_id uuid not null,    -- mirrors companies.owner_user_id for RLS checks

  -- Link to our ScenarioId union: "base" | "upside" | "downside" | "extreme"
  scenario_id text not null check (scenario_id in ('base', 'upside', 'downside', 'extreme')),

  name text not null,             -- e.g. 'Base FY25', 'Aggressive Growth'
  description text,

  -- Levers at save time: { revenueGrowth: 20, operatingExpenses: 0, ... }
  levers jsonb not null,

  -- Metrics snapshot at save time: { runway: 12, cash: 2, ... }
  metrics_snapshot jsonb not null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

comment on table public.scenarios is 'Saved scenario snapshots for each company with lever values + metric outputs';


-- ==============================
-- FUTURE: USER PROFILE TABLE (OPTIONAL)
-- ==============================
-- If you want a separate public.users/profile table:
-- (For now, we can rely purely on auth.users + metadata.)

-- create table if not exists public.user_profiles (
--   id uuid primary key default gen_random_uuid(),
--   auth_user_id uuid not null unique,  -- FK to auth.users.id
--   display_name text,
--   created_at timestamptz not null default now(),
--   updated_at timestamptz not null default now()
-- );

-- ==============================
-- RLS (Row-Level Security) PLACEHOLDER
-- We will add policies later once we wire auth.
-- ==============================

-- alter table public.companies enable row level security;
-- alter table public.company_baselines enable row level security;
-- alter table public.scenarios enable row level security;

-- Example RLS policy skeletons (do not apply yet if you’re just prototyping):

-- create policy "Companies are readable by owner" on public.companies
--   for select using (auth.uid() = owner_user_id);

-- create policy "Companies are insertable by owner" on public.companies
--   for insert with check (auth.uid() = owner_user_id);

-- create policy "Companies are updatable by owner" on public.companies
--   for update using (auth.uid() = owner_user_id);

-- Repeat similar for company_baselines and scenarios.
ase Schema for StratFit GodMode
-- This file contains the database schema definitions


