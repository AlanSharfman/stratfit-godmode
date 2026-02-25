import { Outlet } from "react-router-dom";
import MainNav from "@/components/navigation/MainNav";
import EngineDebugPanel from "@/debug/EngineDebugPanel";
import { engineDebugPanelEnabled } from "@/config/featureFlags";

export default function App() {
  return (
    <div className="app">
      <MainNav />
      <Outlet />
      {engineDebugPanelEnabled && <EngineDebugPanel />}
    </div>
  );
}
