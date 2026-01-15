// src/components/compound/impact/ImpactView.tsx
import RiskBreakdownPanel from "@/components/center/RiskBreakdownPanel";

export default function ImpactView() {
  return (
    <div className="relative h-full w-full overflow-auto rounded-3xl border border-slate-700/40 bg-gradient-to-br from-slate-950/60 to-black/80 p-6 shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
      <RiskBreakdownPanel />
    </div>
  );
}
