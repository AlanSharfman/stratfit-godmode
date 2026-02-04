# STRATFIT — /baseline Route (Wired Implementation)

**Pixel-perfect god-mode UI + Zustand store integration**

## Files

```
baseline_wired/
├── app/baseline/
│   ├── page.tsx              ← Next.js route
│   ├── BaselinePage.tsx      ← Main component (wired to store)
│   └── BaselinePage.module.css  ← Pixel-perfect god-mode styling
└── state/
    └── onboardingStore.ts    ← Zustand store (unchanged from your codebase)
```

## Integration Steps

### 1. Copy the route
```bash
cp -r app/baseline /your-project/src/app/
```

### 2. Ensure store is at correct path
The component imports from:
```typescript
import { useBaselineStore } from "@/state/onboardingStore";
```

If your store is elsewhere, update the import path in `BaselinePage.tsx`.

### 3. Install zustand dependencies (if not present)
```bash
npm install zustand
```

### 4. Navigate to `/baseline`
The page will:
- Show loading state while hydrating from localStorage
- Display the god-mode UI with working sliders
- Sliders update `draft` state in Zustand store
- "LOCK BASELINE & ENTER STRATFIT" button:
  - Validates required fields
  - Calls `lockBaselineFromDraft()`
  - Redirects to `/` on success

## Store Fields Updated

| Slider | Store Path |
|--------|-----------|
| Current ARR | `draft.metrics.currentARR` |
| Headcount | `draft.operating.headcount` |
| Cash on Hand | `draft.metrics.cashOnHand` |
| Monthly Burn | `draft.metrics.monthlyBurn` |

**Note:** Extended fields (Growth %, Churn %, NRR, Opex breakdown) are stored in component-local state. To persist these, extend the `BaselineMetrics` / `BaselineOperating` types in `onboardingStore.ts`.

## Post-Lock Behavior

After locking:
- `baselineLocked` = true
- `baseline` contains the immutable snapshot
- UI shows "BASELINE — LOCKED" status
- Sliders become disabled
- Button changes to "ENTER STRATFIT"
- Reset button appears in sidebar

## Customization

### Change redirect destination
In `BaselinePage.tsx`, find:
```typescript
router.push("/");
```
Change to your desired post-lock route (e.g., `/dashboard`, `/terrain`).

### Add more fields to store
Extend types in `onboardingStore.ts`:
```typescript
type BaselineMetrics = {
  cashOnHand: number;
  monthlyBurn: number;
  currentARR: number;
  arrGrowthPct?: number;
  // Add these:
  monthlyGrowthPct?: number;
  monthlyChurnPct?: number;
  nrr?: number;
};
```

Then wire them in `BaselinePage.tsx`:
```typescript
onChange={(v) => setDraft({ metrics: { monthlyGrowthPct: v } })}
```

## Screenshot Match

The UI matches the attached reference screenshot exactly:
- Atmospheric background with mountain silhouettes
- 280px sidebar with cyan active indicator
- HUD strip with runway/burn multiple/$150,000/survival probability
- LIQUIDITY section with runway months + 1.3x badge
- REVENUE ENGINE with slider rows (Label → InputBox → Slider → Output)
- COST STRUCTURE with 2-column grid
- Gold gradient CTA button
