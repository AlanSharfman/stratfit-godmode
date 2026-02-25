import { Outlet, useLocation } from "react-router-dom";
import MainNav from "@/components/navigation/MainNav";
import EngineDebugPanel from "@/debug/EngineDebugPanel";
import { engineDebugPanelEnabled } from "@/config/featureFlags";
import { SystemBaselineProvider } from "@/system/SystemBaselineProvider";
import StratfitErrorBoundary from "@/system/StratfitErrorBoundary";

export default function App() {
  const location = useLocation();
  const isGodMode = location.pathname === "/position";

  return (
    <SystemBaselineProvider>
      <StratfitErrorBoundary>
        <div className="app">
          {!isGodMode && <MainNav />}
          <Outlet />
          {engineDebugPanelEnabled && <EngineDebugPanel />}
        </div>
      </StratfitErrorBoundary>
    </SystemBaselineProvider>
  );
}
