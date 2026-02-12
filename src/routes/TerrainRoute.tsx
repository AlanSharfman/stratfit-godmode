import BaselinePage from "@/pages/baseline/BaselinePage";
import { SimulateOverlay } from '@/components/simulate';
import { SaveSimulationModal, LoadSimulationPanel } from '@/components/simulations';
import SimulationTelemetryRibbon from '@/components/simulation/SimulationTelemetryRibbon';
import ProDetailDrawer from '@/components/simulation/ProDetailDrawer';
import SimulationActivityMonitor from '@/components/system/SimulationActivityMonitor';
import { emitCausal } from "@/ui/causalEvents";
import { useNavigate } from "react-router-dom";
import { LeverState } from "@/logic/calculateMetrics";

interface TerrainRouteProps {
  hasBaseline: boolean;
  showSimulate: boolean;
  setShowSimulate: (show: boolean) => void;
  showSaveModal: boolean;
  setShowSaveModal: (show: boolean) => void;
  showLoadPanel: boolean;
  setShowLoadPanel: (show: boolean) => void;
  levers: LeverState;
  isSimulatingGlobal: boolean;
}

export default function TerrainRoute({
  hasBaseline,
  showSimulate,
  setShowSimulate,
  showSaveModal,
  setShowSaveModal,
  showLoadPanel,
  setShowLoadPanel,
  levers,
  isSimulatingGlobal,
}: TerrainRouteProps) {
  const navigate = useNavigate();

  return (
    <div className="main-content mode-terrain">
      <main className="center-column">
        {/* BASELINE GATING — inline panel when baseline is missing */}
        {!hasBaseline ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            minHeight: '400px', padding: '3rem',
            background: 'linear-gradient(135deg, rgba(15,23,42,0.95), rgba(30,41,59,0.9))',
            border: '1px solid rgba(100,116,139,0.2)', borderRadius: '1rem',
            margin: '2rem auto', maxWidth: '520px',
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%', marginBottom: '1.5rem',
              background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.3))',
              border: '1px solid rgba(139,92,246,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, color: 'rgba(165,143,255,0.9)',
            }}>◆</div>
            <h2 style={{
              fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 600,
              fontSize: '1.25rem', color: 'rgba(226,232,240,0.95)',
              marginBottom: '0.75rem', letterSpacing: '-0.01em',
            }}>Baseline Required</h2>
            <p style={{
              fontFamily: "'Inter', system-ui, sans-serif", fontSize: '0.875rem',
              color: 'rgba(148,163,184,0.85)', textAlign: 'center',
              lineHeight: 1.6, marginBottom: '2rem', maxWidth: '360px',
            }}>
              Initialize your company's financial and operational truth to unlock the STRATFIT platform.
            </p>
            <button
              type="button"
              onClick={() => navigate("/initialize")}
              style={{
                fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 600,
                fontSize: '0.8125rem', letterSpacing: '0.06em', textTransform: 'uppercase',
                padding: '0.75rem 2rem', borderRadius: '0.5rem', border: 'none',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: '#fff', cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(99,102,241,0.5)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(99,102,241,0.35)'; }}
            >
              Go to Initialize
            </button>
          </div>
        ) : (
          <BaselinePage />
        )}
      </main>
      
      {/* MONTE CARLO SIMULATION OVERLAY */}
      <SimulateOverlay 
        isOpen={showSimulate} 
        onClose={() => setShowSimulate(false)}
        levers={levers}
      />
      
      {/* SAVE/LOAD SIMULATION MODALS */}
      <SaveSimulationModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSaved={(id) => {
          console.log('Simulation saved:', id);
          emitCausal({
            source: "simulation_saved",
            bandStyle: "solid",
            color: "rgba(34, 211, 153, 0.3)",
          });
        }}
      />
      <LoadSimulationPanel
        isOpen={showLoadPanel}
        onClose={() => setShowLoadPanel(false)}
        onLoad={(simulation) => {
          console.log('Simulation loaded:', simulation.name);
          emitCausal({
            source: "simulation_loaded",
            bandStyle: "solid",
            color: "rgba(34, 211, 238, 0.3)",
          });
        }}
      />

      {/* SIMULATION TELEMETRY RIBBON — top-right overlay (instrument readout) */}
      <SimulationTelemetryRibbon />

      {/* SIMULATION ACTIVITY MONITOR — real engine telemetry (top-right, auto-collapse) */}
      <SimulationActivityMonitor />

      {/* PRO DETAIL DRAWER — gated expandable (pro/enterprise only) */}
      <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 800, width: 380 }}>
        <ProDetailDrawer />
      </div>

      {/* ── RECALIBRATION STAGE ISOLATION ── */}
      <div className={`recalibration-dim-veil${isSimulatingGlobal ? ' active' : ''}`} />
      <div className={`recalibration-signal${isSimulatingGlobal ? ' active' : ''}`}>
        Recalculating structural behaviour…
      </div>
    </div>
  );
}
