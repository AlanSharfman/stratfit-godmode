import { Outlet } from "react-router-dom";
import MainNav from "@/app/navigation/MainNav";
import EngineDebugPanel from "@/debug/EngineDebugPanel";

export default function App() {
  return (
    <div className="app">
      <MainNav />
      <Outlet />
      <EngineDebugPanel />
    </div>
  );
}
