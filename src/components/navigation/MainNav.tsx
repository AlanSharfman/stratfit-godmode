import React from "react";
import {
  ClipboardList,
  Mountain,
  SlidersHorizontal,
  GitCompare,
  ShieldAlert,
  DollarSign,
  CheckCircle2,
  Save,
  FolderOpen,
  Download,
  Share2,
  ChevronDown,
} from "lucide-react";

import "./MainNav.css";

type NavId =
  | "onboarding"
  | "terrain"
  | "strategy"
  | "compare"
  | "risk"
  | "valuation"
  | "decision";

type Props = {
  activeScenario: { name: string; lastModified?: string } | null;
  activeItemId: NavId;
  onNavigate: (id: NavId) => void;
  onSave?: () => void;
  onLoad?: () => void;
  onExport?: () => void;
  onShare?: () => void;
};

type NavItem = { id: NavId; label: string; icon: React.ReactNode };

const NAV: NavItem[] = [
  { id: "onboarding", label: "Onboarding", icon: <ClipboardList size={16} /> },
  { id: "terrain", label: "Terrain", icon: <Mountain size={16} /> },
  { id: "strategy", label: "Strategy Studio", icon: <SlidersHorizontal size={16} /> },
  { id: "compare", label: "Compare", icon: <GitCompare size={16} /> },
  { id: "risk", label: "Risk", icon: <ShieldAlert size={16} /> },
  { id: "valuation", label: "Valuation", icon: <DollarSign size={16} /> },
  { id: "decision", label: "Decision", icon: <CheckCircle2 size={16} /> },
];

export function MainNav({
  activeScenario,
  activeItemId,
  onNavigate,
  onSave,
  onLoad,
  onExport,
  onShare,
}: Props) {
  const scenarioName = activeScenario?.name ?? "Current Trajectory";
  const scenarioMeta = activeScenario?.lastModified ?? "Active";

  return (
    <header className="sf-nav" role="banner">
      <div className="sf-nav-inner">
        {/* LEFT: Brand + Scenario */}
        <div className="sf-nav-left">
          <button
            type="button"
            className="sf-brand"
            onClick={() => onNavigate("terrain")}
            aria-label="Go to Terrain"
          >
            <span className="sf-logoMark" aria-hidden />
            <span className="sf-brandText">
              <span className="sf-brandName">STRATFIT</span>
              <span className="sf-brandSub">Scenario Intelligence</span>
            </span>
          </button>

          <span className="sf-nav-divider" aria-hidden />

          <button
            type="button"
            className="sf-scenarioPill"
            onClick={() => onNavigate("terrain")}
            aria-label="Active scenario"
          >
            <span className="sf-scenarioDot" aria-hidden />
            <span className="sf-scenarioLabel">Active Scenario</span>
            <span className="sf-scenarioName" title={scenarioName}>
              {scenarioName}
            </span>
            <span className="sf-scenarioMeta">{scenarioMeta}</span>
            <span className="sf-scenarioCaret" aria-hidden>
              <ChevronDown size={14} />
            </span>
          </button>
        </div>

        {/* CENTER: Canonical Nav */}
        <nav className="sf-nav-center" aria-label="Primary">
          {NAV.map((item) => {
            const isActive = item.id === activeItemId;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={isActive ? "sf-nav-item isActive" : "sf-nav-item"}
                aria-current={isActive ? "page" : undefined}
              >
                <span className={isActive ? "sf-nav-icon isActive" : "sf-nav-icon"}>{item.icon}</span>
                <span className="sf-nav-label">{item.label}</span>
                <span className="sf-nav-rail" aria-hidden />
              </button>
            );
          })}
        </nav>

        {/* RIGHT: Actions */}
        <div className="sf-nav-right">
          <ActionButton label="Save" icon={<Save size={16} />} onClick={onSave} />
          <ActionButton label="Load" icon={<FolderOpen size={16} />} onClick={onLoad} />
          <ActionButton label="Export" icon={<Download size={16} />} onClick={onExport} />
          <ActionButton label="Share" icon={<Share2 size={16} />} onClick={onShare} primary />
        </div>
      </div>
    </header>
  );
}

function ActionButton({
  label,
  icon,
  onClick,
  primary,
}: {
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      className={primary ? "sf-actionBtn sf-actionBtnPrimary" : "sf-actionBtn"}
      onClick={onClick}
      disabled={!onClick}
      aria-disabled={!onClick}
    >
      <span className="sf-actionIcon" aria-hidden>
        {icon}
      </span>
      <span className="sf-actionText">{label}</span>
    </button>
  );
}

// Kept for compatibility with existing exports; uses a minimal configuration.
export function MainNavCompact() {
  return (
    <MainNav
      activeScenario={{ name: "Current Trajectory", lastModified: "Active" }}
      activeItemId="terrain"
      onNavigate={() => {}}
    />
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
  className,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className ? `sf-pageHeader ${className}` : "sf-pageHeader"}>
      <div className="sf-pageHeader-left">
        <div className="sf-pageHeader-title">{title}</div>
        {subtitle ? <div className="sf-pageHeader-subtitle">{subtitle}</div> : null}
      </div>
      {actions ? <div className="sf-pageHeader-actions">{actions}</div> : null}
    </div>
  );
}


