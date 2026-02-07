// src/onboard/components/RightIntelPanel.tsx

import React, { useMemo } from "react";
import { Gauge, Layers, Shield, Target } from "lucide-react";
import type { OnboardingData } from "../schema";
import type { OnboardStepId } from "../validators";
import { validateCapital, validateCompany, validateFinancial, validateOperating, validateStrategic } from "../validators";

function fmtPct(s: string) {
  const x = Number(String(s ?? "").replace(/,/g, "").trim());
  return Number.isFinite(x) ? `${x}%` : "—";
}
function fmtMoney(s: string) {
  const x = Number(String(s ?? "").replace(/,/g, "").trim());
  if (!Number.isFinite(x)) return "—";
  const abs = Math.abs(x);
  if (abs >= 1_000_000_000) return `$${(x / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `$${(x / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${(x / 1_000).toFixed(0)}K`;
  return `$${x.toFixed(0)}`;
}

export function RightIntelPanel({
  active,
  data,
}: {
  active: OnboardStepId;
  data: OnboardingData;
}) {
  const coreStatus = useMemo(() => {
    const company = validateCompany(data);
    const fin = validateFinancial(data);
    const cap = validateCapital(data);
    const op = validateOperating(data);
    const strat = validateStrategic(data);
    const completed = [company, fin, cap, op, strat].filter(Boolean).length;
    return { company, fin, cap, op, strat, completed };
  }, [data]);

  const kpis = useMemo(() => {
    const f = data.financialBaselineCore;
    return {
      arr: fmtMoney(f.arr),
      growth: fmtPct(f.growthRate),
      gm: fmtPct(f.grossMargin),
      burn: fmtMoney(f.monthlyBurn),
      cash: fmtMoney(f.cashOnHand),
    };
  }, [data.financialBaselineCore]);

  const guidance = useMemo(() => {
    switch (active) {
      case "company":
        return {
          title: "Identity & perimeter",
          bullets: [
            "Keep industries and markets high-level; we normalize later.",
            "Contact details support report exports and collaboration workflows.",
            "Business model drives baseline unit-economics assumptions.",
          ],
        };
      case "financial":
        return {
          title: "Baseline financial signal",
          bullets: [
            "ARR and growth anchor the ridge-line and momentum gradient.",
            "Gross margin influences slope tension and efficiency banding.",
            "Burn + cash define runway pressure (stability vs fragility).",
          ],
        };
      case "capital":
        return {
          title: "Capital constraints",
          bullets: [
            "Debt service is treated as a fixed draw on resilience.",
            "Last raise context calibrates risk posture and optionality.",
            "Keep rates simple; precision isn’t required at this stage.",
          ],
        };
      case "operating":
        return {
          title: "Operating dynamics",
          bullets: [
            "Churn and cycle time shape downside acceleration.",
            "ACV establishes revenue concentration sensitivity.",
            "Risk descriptors remain tri-level for reliability.",
          ],
        };
      case "strategic":
        return {
          title: "Strategic posture",
          bullets: [
            "Focus acts as the top-level policy for trade-off weighting.",
            "Horizon determines how aggressively terrain paths are smoothed.",
            "Primary constraint and fastest downside define guardrails.",
          ],
        };
    }
  }, [active]);

  return (
    <aside className="sfOn-intel">
      <div className="sfOn-intelHeader">
        <div className="sfOn-intelTitle">Intelligence</div>
        <div className="sfOn-intelSub">Real-time synthesis — no simulation content</div>
      </div>

      <div className="sfOn-intelCard">
        <div className="sfOn-intelCardTop">
          <Gauge className="sfOn-intelIcon" />
          <div>
            <div className="sfOn-intelCardTitle">Snapshot</div>
            <div className="sfOn-intelCardSub">Baseline signals captured so far</div>
          </div>
        </div>
        <div className="sfOn-kpiGrid">
          <div className="sfOn-kpi">
            <div className="sfOn-kpiLabel">ARR</div>
            <div className="sfOn-kpiValue">{kpis.arr}</div>
          </div>
          <div className="sfOn-kpi">
            <div className="sfOn-kpiLabel">Growth</div>
            <div className="sfOn-kpiValue">{kpis.growth}</div>
          </div>
          <div className="sfOn-kpi">
            <div className="sfOn-kpiLabel">Gross Margin</div>
            <div className="sfOn-kpiValue">{kpis.gm}</div>
          </div>
          <div className="sfOn-kpi">
            <div className="sfOn-kpiLabel">Burn</div>
            <div className="sfOn-kpiValue">{kpis.burn}</div>
          </div>
          <div className="sfOn-kpi">
            <div className="sfOn-kpiLabel">Cash</div>
            <div className="sfOn-kpiValue">{kpis.cash}</div>
          </div>
          <div className="sfOn-kpi">
            <div className="sfOn-kpiLabel">Core steps</div>
            <div className="sfOn-kpiValue">{coreStatus.completed}/5</div>
          </div>
        </div>
      </div>

      <div className="sfOn-intelCard">
        <div className="sfOn-intelCardTop">
          <Target className="sfOn-intelIcon" />
          <div>
            <div className="sfOn-intelCardTitle">{guidance.title}</div>
            <div className="sfOn-intelCardSub">How this feeds terrain baseline</div>
          </div>
        </div>
        <ul className="sfOn-bullets">
          {guidance.bullets.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      </div>

      <div className="sfOn-intelCard sfOn-intelCard--thin">
        <div className="sfOn-intelMini">
          <Layers className="sfOn-intelIconMini" />
          <div className="sfOn-intelMiniText">
            <div className="sfOn-intelMiniTitle">Progressive disclosure</div>
            <div className="sfOn-intelMiniSub">Advanced fields are optional and never block navigation.</div>
          </div>
        </div>
        <div className="sfOn-intelMini">
          <Shield className="sfOn-intelIconMini" />
          <div className="sfOn-intelMiniText">
            <div className="sfOn-intelMiniTitle">Draft safety</div>
            <div className="sfOn-intelMiniSub">Auto-saves locally while you type (debounced).</div>
          </div>
        </div>
      </div>
    </aside>
  );
}


