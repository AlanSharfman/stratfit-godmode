import KPICard, { type KPIData } from './KPICard';

interface KPICardRowProps {
  kpis: KPIData[];
  activeKPI: number | null;
  onKPIClick: (index: number | null) => void;
}

export default function KPICardRow({ kpis, activeKPI, onKPIClick }: KPICardRowProps) {
  return (
    <div className="grid grid-cols-7 gap-2.5">
      {kpis.map((kpi, i) => (
        <KPICard
          key={kpi.id}
          kpi={kpi}
          isActive={activeKPI === i}
          isSpotlight={activeKPI !== null}
          onClick={() => onKPIClick(activeKPI === i ? null : i)}
        />
      ))}
    </div>
  );
}