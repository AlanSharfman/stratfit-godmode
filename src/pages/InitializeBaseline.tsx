// src/pages/InitializeBaseline.tsx
import React, { useMemo, useState, useSyncExternalStore } from "react";
import "../styles/initializeBaseline.css";
import {
  getBaselineState,
  lockBaseline,
  setBaselinePatch,
  subscribeBaseline,
} from "../state/baselineStore";
import { calculateBaseline } from "../logic/baselineEngine";
import BaselineSlider from "../components/common/BaselineSlider";

type InitializeBaselineProps = {
  onEnterStratfit?: () => void;
};

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function money0(n: number): string {
  return `$${Math.round(n).toLocaleString()}`;
}

function shortMoney(n: number): string {
  const sign = n < 0 ? "-" : "";
  const v = Math.abs(n);
  if (v >= 1_000_000) return `${sign}$${(v / 1_000_000).toFixed(1)}m`;
  if (v >= 1_000) return `${sign}$${Math.round(v / 1_000)}k`;
  return `${sign}$${Math.round(v)}`;
}

function pct0(n: number): string {
  return `${Math.round(n)}%`;
}

function pct1(n: number): string {
  const d = Number.isInteger(n) ? 0 : 1;
  return `${n.toFixed(d)}%`;
}

function digitsOnly(s: string) {
  return s.replace(/[^\d]/g, "");
}

const LOGO_VERSION = 5; // bump to bust cache when replacing files in `public/brand/`
const LOGO_CANDIDATES = [
  "/brand/stratfit-logo.jpg",
  "/brand/stratfit-logo.png",
  "/brand/stratfit-logo.svg",
  "/brand/logo",
  "/brand/logo.jpg",
  "/brand/logo.png",
];

const InitializeBaseline: React.FC<InitializeBaselineProps> = ({
  onEnterStratfit,
}) => {
  const s = useSyncExternalStore(
    subscribeBaseline,
    getBaselineState,
    getBaselineState
  );

  const locked = s.locked;

  const summary = useMemo(() => {
    return calculateBaseline({
      cash: s.cash,
      monthlyBurn: s.monthlyBurn,
      arr: s.arr,
      monthlyGrowth: s.monthlyGrowth,
      monthlyChurn: s.monthlyChurn,
      nrr: s.nrr,
      headcount: s.headcount,
      avgCost: s.avgCost,
      sm: s.sm,
      rnd: s.rnd,
      ga: s.ga,
    });
  }, [
    s.cash,
    s.monthlyBurn,
    s.arr,
    s.monthlyGrowth,
    s.monthlyChurn,
    s.nrr,
    s.headcount,
    s.avgCost,
    s.sm,
    s.rnd,
    s.ga,
  ]);

  const revenuePerEmployee = useMemo(() => {
    if (!s.headcount) return 0;
    return s.arr / s.headcount;
  }, [s.arr, s.headcount]);

  const operatingProfitMonthly = useMemo(() => {
    const monthlyRevenue = s.arr / 12;
    const structural = (s.headcount * s.avgCost) / 12 + s.sm + s.rnd + s.ga;
    return monthlyRevenue - (s.monthlyBurn + structural);
  }, [s.arr, s.headcount, s.avgCost, s.sm, s.rnd, s.ga, s.monthlyBurn]);

  const onCta = () => {
    if (!locked) {
      lockBaseline();
      return;
    }
    if (onEnterStratfit) {
      onEnterStratfit();
      return;
    }
    window.dispatchEvent(new CustomEvent("stratfit:enter"));
  };

  const [logoIdx, setLogoIdx] = useState(0);
  const logoSrc =
    logoIdx < LOGO_CANDIDATES.length
      ? `${LOGO_CANDIDATES[logoIdx]}?v=${LOGO_VERSION}`
      : null;

  return (
    <div className="ib3-viewport">
      <div className="ib3-frame">
        <div className="ib3-shell">
          <aside className="ib3-sidebar">
            <div className="ib3-brand">
              <div className="ib3-brandRow">
                <div className="ib3-logoFrame">
                  {logoSrc ? (
                    <img
                      key={logoSrc}
                      className="ib3-logo"
                      src={logoSrc}
                      alt="STRATFIT"
                      draggable={false}
                      onError={() => setLogoIdx((i) => i + 1)}
                    />
                  ) : null}
                </div>
                <div className="ib3-brandText">
                  <div className="ib3-brandTop">STRATFIT</div>
                  <div className="ib3-brandSub">baseline initialization</div>
                </div>
              </div>
            </div>

            <div className="ib3-steps">
              <div className="ib3-step">
                <div className="ib3-dot" />
                <div className="ib3-stepText">1 Identity &amp; Context</div>
              </div>

              <div className="ib3-step active">
                <div className="ib3-dot active" />
                <div className="ib3-stepText">2 Financial Position</div>
              </div>

              <div className="ib3-step">
                <div className="ib3-dot" />
                <div className="ib3-stepText">3 Operating Structure</div>
              </div>

              <div className="ib3-step">
                <div className="ib3-dot" />
                <div className="ib3-stepText">4 Strategic Intent</div>
              </div>
            </div>

            <div className="ib3-draft">
              {locked ? "BASELINE — LOCKED" : "DRAFT — NOT LOCKED"}
            </div>
          </aside>

          <main className="ib3-main">
            <header className="ib3-header">
              <div className="ib3-headLeft">
                <div className="ib3-title">INITIALIZE BASELINE</div>
                <div className="ib3-subtitle">
                  Enter your current financial truth to anchor scenario modelling
                </div>
              </div>

              <div className="ib3-metrics">
                <div className="ib3-mCell">
                  <div className="ib3-mTop">
                    <span className="ib3-mIcon">▲</span>
                    <span className="ib3-mName">RUNWAY</span>
                  </div>
                  <div className="ib3-mVal">
                    {summary.runwayMonths}
                    <span className="ib3-mUnit">months</span>
                  </div>
                </div>

                <div className="ib3-mSep" />

                <div className="ib3-mCell">
                  <div className="ib3-mTop">
                    <span className="ib3-mName">BURN MULTIPLE</span>
                  </div>
                  <div className="ib3-mVal">
                    {summary.burnMultiple}
                    <span className="ib3-mUnit">x</span>
                  </div>
                </div>

                <div className="ib3-mSep" />

                <div className="ib3-mCell">
                  <div className="ib3-mTop">
                    <span className="ib3-mIcon">$</span>
                    <span className="ib3-mName">MONTHLY BURN</span>
                  </div>
                  <div className="ib3-mVal">{money0(summary.monthlyBurn)}</div>
                </div>

                <div className="ib3-mSep" />

                <div className="ib3-mCell">
                  <div className="ib3-mTop">
                    <span className="ib3-mName">SURVIVAL PROBABILITY</span>
                  </div>
                  <div className="ib3-mVal">
                    {summary.survivalProbability}
                    <span className="ib3-mUnit">%</span>
                  </div>
                </div>
              </div>
            </header>

            <section className="ib3-stack">
              <div className="ib3-panel">
                <div className="ib3-panelTitle">LIQUIDITY</div>

                <div className="ib3-row">
                  <div className="ib3-label">Cash on Hand</div>
                  <div className="ib3-sliderCell">
                    <BaselineSlider
                      value={s.cash}
                      min={0}
                      max={2_000_000}
                      step={5_000}
                      disabled={locked}
                      variant="wide"
                      onChange={(v) => setBaselinePatch({ cash: v })}
                    />
                  </div>
                  <div className="ib3-value">{money0(s.cash)}</div>
                </div>

                <div className="ib3-row">
                  <div className="ib3-label">Monthly Net Burn</div>
                  <div className="ib3-sliderCell">
                    <BaselineSlider
                      value={s.monthlyBurn}
                      min={0}
                      max={200_000}
                      step={1_000}
                      disabled={locked}
                      variant="wide"
                      onChange={(v) => setBaselinePatch({ monthlyBurn: v })}
                    />
                  </div>
                  <div className="ib3-value">{money0(s.monthlyBurn)}</div>
                </div>
              </div>

              <div className="ib3-panel">
                <div className="ib3-panelTitle">REVENUE ENGINE</div>

                <div className="ib3-row">
                  <div className="ib3-label">Current ARR</div>
                  <div className="ib3-sliderCell">
                    <BaselineSlider
                      value={s.arr}
                      min={0}
                      max={5_000_000}
                      step={10_000}
                      disabled={locked}
                      variant="wide"
                      onChange={(v) => setBaselinePatch({ arr: v })}
                    />
                  </div>
                  <div className="ib3-value">{money0(s.arr)}</div>
                </div>

                <div className="ib3-row compact">
                  <div className="ib3-label">Monthly Growth %</div>
                  <div className="ib3-sliderCell">
                    <BaselineSlider
                      value={s.monthlyGrowth}
                      min={0}
                      max={15}
                      step={0.5}
                      disabled={locked}
                      variant="wide"
                      onChange={(v) => setBaselinePatch({ monthlyGrowth: v })}
                    />
                  </div>
                  <div className="ib3-value">{pct1(s.monthlyGrowth)}</div>
                </div>

                <div className="ib3-row compact">
                  <div className="ib3-label">Monthly Churn %</div>
                  <div className="ib3-sliderCell">
                    <BaselineSlider
                      value={s.monthlyChurn}
                      min={0}
                      max={10}
                      step={0.5}
                      disabled={locked}
                      variant="wide"
                      onChange={(v) => setBaselinePatch({ monthlyChurn: v })}
                    />
                  </div>
                  <div className="ib3-value">{pct1(s.monthlyChurn)}</div>
                </div>

                <div className="ib3-row compact">
                  <div className="ib3-label">Net Revenue Retention %</div>
                  <div className="ib3-sliderCell">
                    <BaselineSlider
                      value={s.nrr}
                      min={60}
                      max={160}
                      step={1}
                      disabled={locked}
                      variant="wide"
                      onChange={(v) => setBaselinePatch({ nrr: v })}
                    />
                  </div>
                  <div className="ib3-value">{pct0(s.nrr)}</div>
                </div>
              </div>

              <div className="ib3-panel">
                <div className="ib3-panelTitle">COST STRUCTURE</div>

                <div className="ib3-costGrid">
                  <div className="ib3-costLeft">
                    <div className="ib3-controls">
                      <div className="ib3-cRow">
                        <div className="ib3-cL">Headcount</div>
                        <div className="ib3-cR">
                          <input
                            className="ib3-inputNum"
                            value={String(s.headcount)}
                            disabled={locked}
                            onChange={(e) => {
                              const raw = digitsOnly(e.target.value);
                              const v =
                                raw === ""
                                  ? 0
                                  : clamp(parseInt(raw, 10), 0, 300);
                              setBaselinePatch({ headcount: v });
                            }}
                          />
                        </div>
                      </div>

                      <div className="ib3-cRow">
                        <div className="ib3-cL">Avg Fully Loaded Cost</div>
                        <div className="ib3-cR">
                          <div className="ib3-moneyWrap">
                            <span className="ib3-moneySym">$</span>
                            <input
                              className="ib3-inputMoney"
                              value={String(Math.round(s.avgCost))}
                              disabled={locked}
                              onChange={(e) => {
                                const raw = digitsOnly(e.target.value);
                                const v =
                                  raw === ""
                                    ? 0
                                    : clamp(parseInt(raw, 10), 0, 5_000_000);
                                setBaselinePatch({ avgCost: v });
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="ib3-cRow">
                        <div className="ib3-cL">
                          Sales &amp; Marketing Spend (monthly)
                        </div>
                        <div className="ib3-cR">
                          <div className="ib3-moneyWrap">
                            <span className="ib3-moneySym">$</span>
                            <input
                              className="ib3-inputMoney"
                              value={String(Math.round(s.sm))}
                              disabled={locked}
                              onChange={(e) => {
                                const raw = digitsOnly(e.target.value);
                                const v =
                                  raw === ""
                                    ? 0
                                    : clamp(parseInt(raw, 10), 0, 5_000_000);
                                setBaselinePatch({ sm: v });
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="ib3-cRow">
                        <div className="ib3-cL">R&amp;D Spend (monthly)</div>
                        <div className="ib3-cR">
                          <div className="ib3-moneyWrap">
                            <span className="ib3-moneySym">$</span>
                            <input
                              className="ib3-inputMoney"
                              value={String(Math.round(s.rnd))}
                              disabled={locked}
                              onChange={(e) => {
                                const raw = digitsOnly(e.target.value);
                                const v =
                                  raw === ""
                                    ? 0
                                    : clamp(parseInt(raw, 10), 0, 5_000_000);
                                setBaselinePatch({ rnd: v });
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="ib3-cRow">
                        <div className="ib3-cL">G&amp;A Spend (monthly)</div>
                        <div className="ib3-cR">
                          <div className="ib3-moneyWrap">
                            <span className="ib3-moneySym">$</span>
                            <input
                              className="ib3-inputMoney"
                              value={String(Math.round(s.ga))}
                              disabled={locked}
                              onChange={(e) => {
                                const raw = digitsOnly(e.target.value);
                                const v =
                                  raw === ""
                                    ? 0
                                    : clamp(parseInt(raw, 10), 0, 5_000_000);
                                setBaselinePatch({ ga: v });
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="ib3-controlsHint">
                        Values are monthly unless stated. Inputs lock after
                        baseline is locked.
                      </div>
                    </div>
                  </div>

                  <div className="ib3-costRight">
                    <div className="ib3-miniCard">
                      <div className="ib3-miniTop">
                        <div className="ib3-miniTitle">Revenue / Employee</div>
                        <div className="ib3-miniValue">
                          {money0(revenuePerEmployee)}
                        </div>
                      </div>
                      <div className="ib3-miniSub">Revenue / Employee</div>
                      <BaselineSlider
                        value={Math.round(revenuePerEmployee / 1000)}
                        min={0}
                        max={500}
                        step={1}
                        disabled
                        variant="mini"
                        onChange={() => {}}
                      />
                    </div>

                    <div className="ib3-miniCard">
                      <div className="ib3-miniTop">
                        <div className="ib3-miniTitle">
                          Revenue and Operating Profit
                        </div>
                        <div className="ib3-miniValue">
                          {shortMoney(operatingProfitMonthly)}
                        </div>
                      </div>
                      <div className="ib3-miniSub">Revenue and Operating Profit</div>
                      <BaselineSlider
                        value={Math.round((operatingProfitMonthly + 200_000) / 1000)}
                        min={0}
                        max={400}
                        step={1}
                        disabled
                        variant="mini"
                        onChange={() => {}}
                      />
                    </div>

                    <button className="ib3-cta" onClick={onCta}>
                      LOCK BASELINE &amp; ENTER STRATFIT
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </main>
        </div>

        <div className="ib3-vignette" />
      </div>
    </div>
  );
};

export default InitializeBaseline;
