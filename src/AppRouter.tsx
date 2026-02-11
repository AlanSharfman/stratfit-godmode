import { Route, Routes } from "react-router-dom";
import App from "./App";
import ScenarioMemoPage from "@/pages/ScenarioMemoPage";
import AdminEngineConsole from "@/components/admin/AdminEngineConsole";
import { MainNav } from "@/components/navigation";

function AdminEngineRoute() {
  return (
    <div className="app">
      <MainNav />
      <AdminEngineConsole />
    </div>
  );
}

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/memo/*" element={<ScenarioMemoPage />} />
      <Route path="/admin/engine" element={<AdminEngineRoute />} />
      <Route path="/*" element={<App />} />
    </Routes>
  );
}


