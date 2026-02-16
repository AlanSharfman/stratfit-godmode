# STRATFIT FORENSIC AUDIT REPORT
**Date:** 2026-02-16
**Auditor:** GPT-5.2 Principal Systems Engineer

---

## A️⃣ EXECUTIVE SUMMARY

**System Health Status: AT RISK**

**Primary Root Causes:**
1. **Duplicate MainNav implementations** - Two different navigation components exist, causing potential rendering conflicts
2. **Duplicate AppShell implementations** - Three shell variants exist
3. **Legacy imports in AppRouter** - Still imports legacy MainNav for AdminEngineRoute

---

## B️⃣ CRITICAL ISSUES LIST

| Severity | Issue | File Path |
|----------|-------|-----------|
| **HIGH** | Duplicate MainNav: Legacy vs Contract-driven | `src/components/navigation/MainNav.tsx` vs `src/app/navigation/MainNav.tsx` |
| **HIGH** | AppRouter imports legacy MainNav | `src/AppRouter.tsx#L21` |
| **MEDIUM** | Duplicate AppShell x3 | `src/AppShell.tsx`, `src/app/layout/AppShell.tsx`, `src/layout/AppShellLayout.tsx` |
| **MEDIUM** | CSS collision on `.mainNav` | `src/styles/terrainRoot.css#L16` conflicts with `src/app/navigation/MainNav.css` |
| **LOW** | Catch-all redirects to `/position` | `src/AppRouter.tsx#L106` - should go to `/initiate` |

---

## C️⃣ ARCHITECTURE MAP

### Routing Flow
```
main.tsx → BrowserRouter → AppRouter → Routes
  └─ "/" → Navigate to /initiate
  └─ /initiate → InitializeRoute → InitializeBaselinePage
  └─ /position → BaselineRouteWithState → TerrainRoute → BaselinePage ✓
  └─ /objectives → ObjectiveRoute
  └─ /studio → StudioPage
  └─ /scenarios → ScenariosPage (placeholder)
  └─ /risk → RiskRoute
  └─ /capital → AssessmentRoute
  └─ /valuation → ValuationRoute
  └─ /strategic-assessment → StrategicAssessmentPage
  └─ * → Navigate to /position (SHOULD BE /initiate)
```

### Navigation Flow
```
App.tsx (shell) → MainNav (@/app/navigation/MainNav) ✓ CONTRACT
AppRouter.tsx AdminEngineRoute → MainNav (@/components/navigation) ✗ LEGACY
```

### Engine Flow
```
main.tsx → bootstrapEngines() → runEngines.ts (single call) ✓
```

---

## D️⃣ FIX PLAN (DETERMINISTIC)

### Step 1: Remove legacy MainNav import from AppRouter.tsx
```diff
- import { MainNav } from "@/components/navigation";
+ import MainNav from "@/app/navigation/MainNav";
```

### Step 2: Change catch-all redirect from `/position` to `/initiate`
```diff
- <Route path="*" element={<Navigate to={STRATFIT_ROUTES.position} replace />} />
+ <Route path="*" element={<Navigate to={STRATFIT_ROUTES.initiate} replace />} />
```

### Step 3: Remove or namespace conflicting `.mainNav` CSS
In `src/styles/terrainRoot.css`, rename or remove the `.mainNav` rule that conflicts with the contract nav.

---

## E️⃣ HARDENING RECOMMENDATIONS

1. Delete unused `src/AppShell.tsx` after confirming it's not imported
2. Consolidate nav exports: deprecate `src/components/navigation/index.ts` legacy export
3. Add route contract validation test to CI

---

## FILES VERIFIED AS CORRECT

- `src/app/navigation/routeContract.ts` - 9 routes defined ✓
- `src/app/navigation/navConfig.ts` - PRIMARY_NAV array with 9 items ✓
- `src/app/navigation/MainNav.tsx` - Contract-driven NavLink renderer ✓
- `src/app/navigation/MainNav.css` - Institutional styling ✓
- `src/pages/scenarios/ScenariosPage.tsx` - Placeholder created ✓
- `src/AppRouter.tsx` - Uses STRATFIT_ROUTES constants ✓

---

## CURRENT COMMIT STATE

```
69d9291 (HEAD -> master, origin/master) fix: route parity hotfix + nav CSS styling
7c54fa4 nav: switch app to contract-driven MainNav
8c7b347 nav: add valuation as primary tab (amendment C)
```

All changes committed and pushed to `origin/master`.
