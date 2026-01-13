# 🔍 STRATFIT GODMODE - COMPREHENSIVE AUDIT REPORT

**Date**: 2026-01-13  
**Scope**: Post G-D Mode Implementation  
**Status**: ⚠️ **ISSUES IDENTIFIED - ACTION REQUIRED**

---

## 🚨 CRITICAL ISSUES

### 1. **Undefined Variable in VariancesView.tsx** ⚠️ HIGH PRIORITY
**File**: `src/components/compound/variances/VariancesView.tsx`  
**Line**: 326  
**Issue**: Reference to undefined `scenario` variable after local state refactor

```typescript
// Line 326
background: s.id === scenario ? `${s.color}15` : "transparent"
```

**Problem**: The variable `scenario` no longer exists. It was replaced with `localComparisonScenario` in the refactor but this line wasn't updated.

**Impact**: 
- Runtime error when rendering scenario buttons
- Variances page may crash or show incorrect styling
- Button highlight logic broken

**Fix Required**:
```typescript
// Change from:
background: s.id === scenario ? `${s.color}15` : "transparent"

// To:
background: s.id === localComparisonScenario ? `${s.color}15` : "transparent"
```

**Also check line 329**:
```typescript
// Line 329
aria-pressed={s.id === scenario}
```

Should be:
```typescript
aria-pressed={s.id === localComparisonScenario}
```

---

## ⚠️ DUPLICATION ISSUES

### 2. **Two Variance View Files** - OBSOLESCENCE
**Files**:
- `src/components/compound/variances/VariancesView.tsx` (OLD)
- `src/components/compound/variances/VariancesViewNew.tsx` (NEW - G-D MODE)

**Status**: The OLD file is still in use, but the NEW file was created for G-D MODE architecture.

**Current Routing**: 
- ✅ `CenterViewPanel.tsx` correctly imports `VariancesViewNew`
- ❌ `VariancesView.tsx` is **obsolete** but still exists

**Recommendation**: 
1. **Delete** `src/components/compound/variances/VariancesView.tsx` after ensuring no other imports
2. **Rename** `VariancesViewNew.tsx` → `VariancesView.tsx` (clean naming)

**Impact**: 
- Code confusion
- Maintenance burden
- Potential import errors if wrong file is used

---

### 3. **Multiple KPI Definition Files** - FRAGMENTATION
**Files with KPI metadata**:
1. `src/logic/kpiTaxonomy.ts` ✅ (NEW - G-D MODE, comprehensive)
2. `src/config/kpiMeta.ts` (OLD - used by AIIntelligence.tsx)
3. `src/components/KPIConsole.tsx` (KPI_CONFIG array)
4. `src/components/ui/KPICard.tsx` (Label mappings)

**Problem**: KPI definitions are scattered across 4 different files with different schemas.

**Current State**:
- `kpiTaxonomy.ts`: Full metadata (category, format, higherIsBetter)
- `kpiMeta.ts`: Minimal metadata (label, format, higherIsBetter)
- `KPIConsole.tsx`: Display config (label, color, icon, panel)
- `KPICard.tsx`: Label string replacements

**Risks**:
- Naming inconsistencies
- Duplicate maintenance
- Format divergence
- Hard to track canonical source

**Recommendation**:
1. **Audit all KPI references** - map where each is used
2. **Consolidate** into `kpiTaxonomy.ts` as single source
3. **Refactor** other files to import from taxonomy
4. **Deprecate** `kpiMeta.ts` or convert to re-export from taxonomy

---

### 4. **Multiple Scenario Color Definitions** - INCONSISTENCY RISK
**Locations**:
1. `src/state/scenarioStore.ts` - `SCENARIO_COLORS`
2. `src/components/engine/MountainEngine.tsx` - `SCENARIO_THEMES`
3. `src/components/compound/variances/VariancesView.tsx` - `SCENARIOS` array
4. `src/components/compound/variances/VariancesViewNew.tsx` - `SCENARIOS` array

**Issue**: Scenario colors are defined in 4 different places with slightly different values.

**Example Discrepancy**:
```typescript
// scenarioStore.ts
base: { primary: "#22d3ee", ... }

// VariancesView.tsx
base: { color: "rgba(120,180,220,0.85)" }

// MountainEngine.tsx
base: { front: "#22d3ee", ... }
```

**Impact**:
- Visual inconsistency across views
- Hard to maintain global color changes
- Confusion about canonical source

**Recommendation**:
- Use `SCENARIO_COLORS` from `scenarioStore.ts` as single source
- Convert all hardcoded colors to imports from store
- Create helper function if format conversion needed

---

## 🐛 BUGS & ISSUES

### 5. **Missing Error Handling in ScenarioDeltaSnapshot**
**File**: `src/components/ScenarioDeltaSnapshot.tsx`  
**Lines**: 177-186

**Issue**: If `activeScenarioId` or `engineResults` are invalid, the component returns `null` silently.

```typescript
const base = engineResults?.base;
const scenarioKey = activeScenarioId ?? "base";
const scenario = engineResults?.[scenarioKey] ?? engineResults?.base;

// If missing, render nothing (should not happen in normal flow)
if (!base || !scenario) return null;
```

**Problem**: 
- No user feedback when data is missing
- Silent failure makes debugging hard
- User sees blank space instead of error message

**Recommendation**:
```typescript
if (!base || !scenario) {
  return (
    <div style={{ padding: "20px", textAlign: "center", opacity: 0.7 }}>
      ⚠️ Scenario data unavailable. Please refresh or check engine status.
    </div>
  );
}
```

---

### 6. **Potential React Hydration Mismatch**
**File**: `src/components/compound/variances/VariancesView.tsx`  
**Lines**: 294-304

**Issue**: Early return after hooks in loading state could cause hydration issues.

```typescript
const { base, selected, rows, summary } = useVariancesData(selectedScenario.id);

// Data validation - show loading state but don't early return (prevents hook order issues)
const isDataReady = base && selected && rows.length > 0;

// Loading state
if (!isDataReady) {
  return (...); // ← Early return after hook call
}
```

**Problem**: While the comment acknowledges hook order issues, the early return still happens after `useVariancesData` is called.

**Recommendation**: Wrap content in conditional render instead:
```typescript
return (
  <div className={styles.container}>
    {!isDataReady ? (
      <LoadingState />
    ) : (
      <ActualContent />
    )}
  </div>
);
```

---

### 7. **Unused Import in VariancesView**
**File**: `src/components/compound/variances/VariancesView.tsx`  
**Line**: 7

```typescript
import { calculateMetrics } from "@/logic/calculateMetrics";
```

**Issue**: `calculateMetrics` is imported but used inside `useVariancesData` hook, which is a good pattern. However, this creates tight coupling to the calculation logic.

**Status**: Not a bug, but worth noting for future refactoring.

---

## 📊 CODE QUALITY ISSUES

### 8. **Inconsistent Scenario ID Type Definitions**
**Multiple files define ScenarioId**:
1. `src/state/scenarioStore.ts`: `type ScenarioId = "base" | "upside" | "downside" | "extreme"`
2. `src/logic/calculateMetrics.ts`: `export type ScenarioId = "base" | "upside" | "downside" | "extreme"`
3. `src/components/ScenarioSlidePanel.tsx`: May have own definition

**Problem**: Duplicate type definitions create maintenance burden.

**Recommendation**: 
- Keep ONE definition in `scenarioStore.ts`
- All other files should import it
- Use `export type { ScenarioId }` for clarity

---

### 9. **Magic Numbers in Calculations**
**File**: `src/components/compound/variances/VariancesView.tsx`  
**Lines**: 98-101

```typescript
const MARKETING_SPEND_RATIO = 0.45; // ✅ Good
const AVG_REVENUE_PER_CUSTOMER = 12_000; // ✅ Good
const GROSS_MARGIN = 0.74; // ✅ Good
const ANNUAL_CHURN_RATE = 0.12; // ✅ Good
```

**Status**: ✅ Actually GOOD - constants are properly extracted.

However, these same constants appear in other files (`App.tsx`, calculation logic). Should be centralized.

---

### 10. **Accessibility Issues**
**File**: `src/components/compound/variances/VariancesView.tsx`  
**Lines**: 328-329

```typescript
aria-label={`Compare base case to ${s.name} scenario`}
aria-pressed={s.id === scenario} // ← `scenario` undefined
```

**Issues**:
1. `aria-pressed` references undefined variable
2. Button role should be clarified (is it toggle or radio?)

**Recommendation**:
```typescript
role="radio"
aria-checked={s.id === localComparisonScenario}
aria-label={`Compare base case to ${s.name} scenario`}
```

---

## 🔄 POTENTIAL IMPROVEMENTS

### 11. **Missing Type Safety in Spider Chart**
**File**: `src/components/ScenarioDeltaSnapshot.tsx`  
**Lines**: 222-235

```typescript
const spiderData = useMemo(() => {
  const m: ScenarioMetrics = {
    arr: safeNum(scenario?.kpis?.arrCurrent?.value),
    arrGrowthPct: safeNum(scenario?.kpis?.arrGrowthPct?.value),
    // ...
  };
  // ...
}, [scenario]);
```

**Issue**: Multiple optional chaining operators suggest fragile data structure.

**Recommendation**: 
- Add runtime validation
- Use Zod or similar for schema validation
- Log warnings when data is missing

---

### 12. **Hardcoded Strings for KPI Keys**
**Multiple files use string literals**:
```typescript
scenario?.kpis?.arrCurrent?.value
scenario?.kpis?.runway?.value
scenario?.kpis?.riskIndex?.value
```

**Problem**: 
- Typos won't be caught by TypeScript
- Refactoring is error-prone
- No autocomplete

**Recommendation**:
```typescript
// Create KPI key enum
export const KPI_KEYS = {
  ARR_CURRENT: 'arrCurrent',
  RUNWAY: 'runway',
  RISK_INDEX: 'riskIndex',
  // ...
} as const;

// Usage
scenario?.kpis?.[KPI_KEYS.ARR_CURRENT]?.value
```

---

## 📁 FILE ORGANIZATION

### 13. **Inconsistent Module Naming**
**Pattern inconsistencies**:
- `VariancesView.tsx` vs `VariancesViewNew.tsx`
- `ScenarioDeltaSnapshot.tsx` (no View suffix)
- `CenterViewPanel.tsx` (View suffix)

**Recommendation**: Standardize naming convention:
- Components that render views: `*View.tsx`
- Components that are panels: `*Panel.tsx`
- Components that are widgets: `*.tsx` or `*Widget.tsx`

---

### 14. **Mixed Import Styles**
**Some files use**:
```typescript
import { useScenarioStore } from "@/state/scenarioStore";
```

**Others use**:
```typescript
import { calculateMetrics } from "@/logic/calculateMetrics";
```

**Status**: ✅ Actually consistent with `@/` alias. Good practice.

---

## 🧪 TESTING GAPS

### 15. **No Unit Tests Found**
**Missing tests for**:
- `kpiTaxonomy.ts` - Critical formatting logic
- `leverTaxonomy.ts` - Taxonomy definitions
- `VariancesViewNew.tsx` - Core business logic
- `ScenarioDeltaSnapshot.tsx` - Delta calculations

**Recommendation**: Add Jest/Vitest tests for:
1. Formatting functions
2. Delta calculations
3. Commentary generation logic
4. Data transformations

---

## 📋 SUMMARY

### **Critical (Fix Immediately)**
1. ⛔ **Undefined `scenario` variable in VariancesView.tsx** (Lines 326, 329)
2. ⚠️ **Two variance view files** - Remove obsolete one

### **High Priority**
3. 🔴 **Multiple KPI definition sources** - Consolidate
4. 🔴 **Scenario color inconsistencies** - Unify source
5. 🔴 **Missing error feedback in ScenarioDeltaSnapshot**

### **Medium Priority**
6. 🟡 **Duplicate ScenarioId type definitions**
7. 🟡 **Accessibility improvements needed**
8. 🟡 **Business constants scattered across files**

### **Low Priority (Technical Debt)**
9. 🟢 **Add unit tests for critical logic**
10. 🟢 **Improve type safety for KPI keys**
11. 🟢 **Standardize file naming conventions**

---

## ✅ WHAT'S WORKING WELL

1. ✅ **G-D MODE architecture** successfully implemented
2. ✅ **Professional styling** applied (no gaming vibe)
3. ✅ **Data truth enforcement** (engineResults only)
4. ✅ **Error boundaries** in place
5. ✅ **TypeScript types** generally strong
6. ✅ **Const extraction** for magic numbers
7. ✅ **Modular CSS** approach

---

## 🎯 RECOMMENDED ACTION PLAN

### **Phase 1: Critical Fixes** (Today)
1. Fix undefined `scenario` variable in VariancesView.tsx
2. Test Variances page thoroughly
3. Decide on keeping old vs new VariancesView

### **Phase 2: Consolidation** (This Week)
1. Remove obsolete VariancesView.tsx
2. Consolidate KPI definitions into kpiTaxonomy
3. Unify scenario color definitions
4. Add error messages for missing data

### **Phase 3: Quality Improvements** (Next Week)
1. Consolidate business constants
2. Add unit tests for formatters
3. Improve accessibility attributes
4. Standardize file naming

### **Phase 4: Technical Debt** (Future)
1. Add comprehensive test coverage
2. Create KPI key enums
3. Refactor duplicate logic
4. Add Zod validation

---

## 📊 RISK ASSESSMENT

| Issue | Severity | Likelihood | Impact | Risk Score |
|-------|----------|------------|--------|------------|
| Undefined variable | 🔴 High | High | Page crash | **CRITICAL** |
| File duplication | 🟡 Medium | Low | Confusion | Medium |
| KPI fragmentation | 🟡 Medium | Medium | Inconsistency | Medium |
| Missing tests | 🟢 Low | Medium | Bugs | Low-Medium |

---

## 🏁 CONCLUSION

The codebase is **functional** and the G-D MODE implementation is **solid**, but there are **critical bugs** that need immediate attention, particularly the undefined variable issue in VariancesView.tsx.

The main concerns are:
1. **Duplication** (2 variance views, multiple KPI defs)
2. **Inconsistency** (colors, types)
3. **Missing safeguards** (error messages, tests)

**Overall Grade**: B+ (Good foundation, needs bug fixes and cleanup)

**Recommended Priority**: Fix critical bug ASAP, then systematically address duplications.

---

**Report Generated**: 2026-01-13  
**Next Audit**: After critical fixes applied

