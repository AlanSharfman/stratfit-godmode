# CANONICAL_MAP — One True Map

This file exists to prevent “helpful” accidental rewiring and duplicated flows.

## Canonical onboarding (single source of truth)
- **Entry UI**: `src/onboard/OnboardApp.tsx`
- **Draft persistence**: `src/onboard/storage.ts` (key: `stratfit.onboard.v1`)
- **Baseline mapping**: `src/onboard/baseline/map.ts`
- **Baseline persistence (canonical)**: `src/state/onboardingStore.ts` (persist key: `sf.baseline.v1`)
- **Bridge (write-through)**: `src/onboard/baseline/storage.ts` writes into canonical store and also writes legacy key for compatibility.

## App entry wiring
- **Onboarding view**: `src/App.tsx` renders `<OnboardApp onExitToTerrain={...} />` when the header nav selects onboarding.

## Quarantine rules (hard)
- `src/_quarantine/**` is **never imported** by live code.
- `src/_inbox_migrations/**` is staging-only and **never imported** by live code.

## Legacy (kept for rollback only)
- Legacy baseline editor UI is quarantined in: `src/_quarantine/legacy-baseline/`
