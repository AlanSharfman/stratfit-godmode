# STRATFIT UI CONTRACT — v1 (LOCKED)

This contract locks STRATFIT's top-level navigation and baseline shell styling.

## Navigation (LOCKED)
- Labels, order, and routes are final.
- Changes are forbidden unless the user explicitly approves "UNLOCK NAV CONTRACT".

## Visual Style (LOCKED)
- Header/nav typography, sizing, and spacing must remain crisp and consistent.
- Palette rules:
  - Default: Cyan/Ice Blue
  - Positive: Emerald
  - Strategic: Indigo/Violet
  - Risk: Red only
  - No Orange

## Enforcement
- TypeScript: uiNavContract.ts is the source of truth (`as const`).
- Runtime: assertUiNavContract.ts fails fast on drift.
- Tests: uiNavContract.test.ts fails if contract changes.
