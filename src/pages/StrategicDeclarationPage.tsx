// src/pages/StrategicDeclarationPage.tsx

import { useMemo } from 'react';
import { useStrategicDeclarationStore } from '@/stores/strategicDeclarationStore';
import type {
  CapitalAccess,
  GrowthDriver,
  IntentType,
  LeadershipBandwidth,
  SupplierDependency,
  TeamDepth,
} from '@/types/strategicDeclaration';

const INTENT_OPTIONS: IntentType[] = [
  'Controlled Growth',
  'Aggressive Expansion',
  'Margin Optimization',
  'Survival & Stabilization',
  'Market Domination',
  'Exit Preparation',
];

const GROWTH_DRIVER_OPTIONS: GrowthDriver[] = [
  'Pricing Power',
  'Volume Expansion',
  'New Product Launch',
  'Geographic Expansion',
  'Operational Efficiency',
  'M&A',
  'Channel Expansion',
];

const LEADERSHIP_OPTIONS: LeadershipBandwidth[] = [
  'Fully Focused',
  'Stretched',
  'Fragmented',
];

const TEAM_DEPTH_OPTIONS: TeamDepth[] = ['Strong Bench', 'Adequate', 'Thin'];

const CAPITAL_ACCESS_OPTIONS: CapitalAccess[] = [
  'Confirmed',
  'Likely',
  'Uncertain',
  'None',
];

const SUPPLIER_DEP_OPTIONS: SupplierDependency[] = [
  'Diversified',
  'Moderate',
  'High',
];

function isFiniteNumber(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n);
}

function parseNumberOrNaN(raw: string): number {
  return raw.trim() === '' ? Number.NaN : Number(raw);
}

export default function StrategicDeclarationPage() {
  const { input, setField, calculateDerived, buildPayload, lock, locked, reset } =
    useStrategicDeclarationStore();

  const derived = useMemo(() => calculateDerived(), [input, calculateDerived]);

  const isValid =
    typeof input.intentType === 'string' &&
    Array.isArray(input.growthDrivers) &&
    input.growthDrivers.length > 0 &&
    isFiniteNumber(input.targetRevenue) &&
    input.targetRevenue > 0 &&
    isFiniteNumber(input.targetMargin) &&
    isFiniteNumber(input.currentRevenue) &&
    input.currentRevenue > 0 &&
    isFiniteNumber(input.grossMargin) &&
    isFiniteNumber(input.recurringRevenueRatio) &&
    isFiniteNumber(input.fixedCosts) &&
    isFiniteNumber(input.variableCostRatio) &&
    isFiniteNumber(input.cash) &&
    isFiniteNumber(input.netDebt) &&
    typeof input.leadershipBandwidth === 'string' &&
    typeof input.teamDepth === 'string' &&
    typeof input.capitalAccess === 'string' &&
    isFiniteNumber(input.clientConcentration) &&
    typeof input.supplierDependency === 'string';

  const toggleGrowthDriver = (driver: GrowthDriver) => {
    const current = (input.growthDrivers ?? []) as GrowthDriver[];
    const next = current.includes(driver)
      ? current.filter((d) => d !== driver)
      : [...current, driver];
    setField('growthDrivers', next);
  };

  const handleSubmit = () => {
    const payload = buildPayload();
    if (!payload) return;

    // Model-ready payload (stable keys)
    // eslint-disable-next-line no-console
    console.log('DECLARATION PAYLOAD:', payload);

    lock();

    // This repo currently doesn’t run a Router; open the existing Simulate overlay
    // by hard-navigating to /simulate and letting App auto-open it on boot.
    try {
      window.localStorage.setItem('sf.openSimulateOnBoot', '1');
    } catch {
      // ignore
    }
    window.location.assign('/simulate');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-5xl mx-auto px-8 py-12 space-y-10">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Strategic Declaration</h1>
          <p className="text-slate-300">
            Lock an explicit strategic posture and financial baseline. The output is a deterministic,
            model-ready payload.
          </p>
        </header>

        {/* SECTION 1 */}
        <section className="space-y-5">
          <h2 className="text-xl font-medium">1. Strategic Intent</h2>

          <div className="grid grid-cols-1 gap-4">
            <label className="space-y-2">
              <div className="text-sm text-slate-300">Intent Type</div>
              <select
                className="w-full bg-slate-900 border border-slate-700 rounded-md p-3"
                disabled={locked}
                value={(input.intentType ?? '') as string}
                onChange={(e) => setField('intentType', e.target.value as IntentType)}
              >
                <option value="">Select objective</option>
                {INTENT_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="space-y-2">
                <div className="text-sm text-slate-300">Target Revenue (24m)</div>
                <input
                  type="number"
                  inputMode="decimal"
                  className="w-full bg-slate-900 border border-slate-700 rounded-md p-3"
                  disabled={locked}
                  value={isFiniteNumber(input.targetRevenue) ? input.targetRevenue : ''}
                  onChange={(e) => setField('targetRevenue', parseNumberOrNaN(e.target.value))}
                />
              </label>
              <label className="space-y-2">
                <div className="text-sm text-slate-300">Target EBITDA Margin (%)</div>
                <input
                  type="number"
                  inputMode="decimal"
                  className="w-full bg-slate-900 border border-slate-700 rounded-md p-3"
                  disabled={locked}
                  value={isFiniteNumber(input.targetMargin) ? input.targetMargin : ''}
                  onChange={(e) => setField('targetMargin', parseNumberOrNaN(e.target.value))}
                />
              </label>
            </div>

            <div className="space-y-2">
              <div className="text-sm text-slate-300">Growth Drivers (select all that apply)</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {GROWTH_DRIVER_OPTIONS.map((d) => {
                  const checked = (input.growthDrivers ?? []).includes(d);
                  return (
                    <label
                      key={d}
                      className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-md px-3 py-2"
                    >
                      <input
                        type="checkbox"
                        disabled={locked}
                        checked={checked}
                        onChange={() => toggleGrowthDriver(d)}
                      />
                      <span className="text-sm">{d}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2 */}
        <section className="space-y-5">
          <h2 className="text-xl font-medium">2. Financial Structure</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="space-y-2">
              <div className="text-sm text-slate-300">Current Revenue</div>
              <input
                type="number"
                inputMode="decimal"
                className="w-full bg-slate-900 border border-slate-700 rounded-md p-3"
                disabled={locked}
                value={isFiniteNumber(input.currentRevenue) ? input.currentRevenue : ''}
                onChange={(e) => setField('currentRevenue', parseNumberOrNaN(e.target.value))}
              />
            </label>
            <label className="space-y-2">
              <div className="text-sm text-slate-300">Gross Margin (%)</div>
              <input
                type="number"
                inputMode="decimal"
                className="w-full bg-slate-900 border border-slate-700 rounded-md p-3"
                disabled={locked}
                value={isFiniteNumber(input.grossMargin) ? input.grossMargin : ''}
                onChange={(e) => setField('grossMargin', parseNumberOrNaN(e.target.value))}
              />
            </label>
            <label className="space-y-2">
              <div className="text-sm text-slate-300">Recurring Revenue Ratio (%)</div>
              <input
                type="number"
                inputMode="decimal"
                className="w-full bg-slate-900 border border-slate-700 rounded-md p-3"
                disabled={locked}
                value={isFiniteNumber(input.recurringRevenueRatio) ? input.recurringRevenueRatio : ''}
                onChange={(e) =>
                  setField('recurringRevenueRatio', parseNumberOrNaN(e.target.value))
                }
              />
            </label>
            <label className="space-y-2">
              <div className="text-sm text-slate-300">Fixed Costs (Annual)</div>
              <input
                type="number"
                inputMode="decimal"
                className="w-full bg-slate-900 border border-slate-700 rounded-md p-3"
                disabled={locked}
                value={isFiniteNumber(input.fixedCosts) ? input.fixedCosts : ''}
                onChange={(e) => setField('fixedCosts', parseNumberOrNaN(e.target.value))}
              />
            </label>
            <label className="space-y-2">
              <div className="text-sm text-slate-300">Variable Cost Ratio (%)</div>
              <input
                type="number"
                inputMode="decimal"
                className="w-full bg-slate-900 border border-slate-700 rounded-md p-3"
                disabled={locked}
                value={isFiniteNumber(input.variableCostRatio) ? input.variableCostRatio : ''}
                onChange={(e) => setField('variableCostRatio', parseNumberOrNaN(e.target.value))}
              />
            </label>
            <label className="space-y-2">
              <div className="text-sm text-slate-300">Cash on Hand</div>
              <input
                type="number"
                inputMode="decimal"
                className="w-full bg-slate-900 border border-slate-700 rounded-md p-3"
                disabled={locked}
                value={isFiniteNumber(input.cash) ? input.cash : ''}
                onChange={(e) => setField('cash', parseNumberOrNaN(e.target.value))}
              />
            </label>
            <label className="space-y-2">
              <div className="text-sm text-slate-300">Net Debt</div>
              <input
                type="number"
                inputMode="decimal"
                className="w-full bg-slate-900 border border-slate-700 rounded-md p-3"
                disabled={locked}
                value={isFiniteNumber(input.netDebt) ? input.netDebt : ''}
                onChange={(e) => setField('netDebt', parseNumberOrNaN(e.target.value))}
              />
            </label>
          </div>
        </section>

        {/* SECTION 3 */}
        <section className="space-y-5">
          <h2 className="text-xl font-medium">3. Execution Posture</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="space-y-2">
              <div className="text-sm text-slate-300">Leadership Bandwidth</div>
              <select
                className="w-full bg-slate-900 border border-slate-700 rounded-md p-3"
                disabled={locked}
                value={(input.leadershipBandwidth ?? '') as string}
                onChange={(e) =>
                  setField('leadershipBandwidth', e.target.value as LeadershipBandwidth)
                }
              >
                <option value="">Select</option>
                {LEADERSHIP_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <div className="text-sm text-slate-300">Team Depth</div>
              <select
                className="w-full bg-slate-900 border border-slate-700 rounded-md p-3"
                disabled={locked}
                value={(input.teamDepth ?? '') as string}
                onChange={(e) => setField('teamDepth', e.target.value as TeamDepth)}
              >
                <option value="">Select</option>
                {TEAM_DEPTH_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <div className="text-sm text-slate-300">Capital Access</div>
              <select
                className="w-full bg-slate-900 border border-slate-700 rounded-md p-3"
                disabled={locked}
                value={(input.capitalAccess ?? '') as string}
                onChange={(e) => setField('capitalAccess', e.target.value as CapitalAccess)}
              >
                <option value="">Select</option>
                {CAPITAL_ACCESS_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <div className="text-sm text-slate-300">Client Concentration (%)</div>
              <input
                type="number"
                inputMode="decimal"
                className="w-full bg-slate-900 border border-slate-700 rounded-md p-3"
                disabled={locked}
                value={isFiniteNumber(input.clientConcentration) ? input.clientConcentration : ''}
                onChange={(e) =>
                  setField('clientConcentration', parseNumberOrNaN(e.target.value))
                }
              />
            </label>

            <label className="space-y-2 md:col-span-2">
              <div className="text-sm text-slate-300">Supplier Dependency</div>
              <select
                className="w-full bg-slate-900 border border-slate-700 rounded-md p-3"
                disabled={locked}
                value={(input.supplierDependency ?? '') as string}
                onChange={(e) =>
                  setField('supplierDependency', e.target.value as SupplierDependency)
                }
              >
                <option value="">Select</option>
                {SUPPLIER_DEP_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        {/* DERIVED PANEL */}
        {derived && (
          <section className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-2">
            <h3 className="text-lg font-medium">Derived Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-slate-200">
              <div>Runway: {derived.runwayMonths} months</div>
              <div>Liquidity Buffer: {derived.liquidityBuffer.toFixed(0)}</div>
              <div>Operating Leverage: {derived.operatingLeverageRatio.toFixed(2)}</div>
              <div>Volatility Index: {derived.volatilityIndex.toFixed(2)}</div>
            </div>
          </section>
        )}

        <div className="space-y-3">
          <button
            disabled={!isValid || locked}
            onClick={handleSubmit}
            className="w-full bg-cyan-600 hover:bg-cyan-700 rounded-md py-4 font-medium disabled:opacity-40 disabled:hover:bg-cyan-600"
          >
            Lock &amp; Simulate
          </button>

          <button
            disabled={locked}
            onClick={reset}
            className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-md py-3 font-medium disabled:opacity-40"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}


